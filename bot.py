"""
Smoke Lab — Telegram Mini App магазин: бот + сервер + база данных в одном файле.

Всё, что раньше было в server.js, lib/db.js и scripts/import-json.js, собрано здесь.
Фронтенд остаётся отдельным файлом: public/index.html (его не трогали).

Установка:
    pip install aiogram asyncpg redis

Запуск:
    BOT_TOKEN=... DATABASE_URL=postgresql://... python bot.py

Разовый перенос старых данных из data/db.json (если магазин уже работал):
    DATABASE_URL=postgresql://... python bot.py import-json
    DATABASE_URL=postgresql://... python bot.py import-json путь/к/db.json --force

Переменные окружения:
    DATABASE_URL      строка подключения к PostgreSQL (обязательно)
    REDIS_URL         строка подключения к Redis (опционально; без него кеш выключен)
    CACHE_TTL_CATALOG TTL кеша каталога в секундах (по умолчанию 60)
    BOT_TOKEN         токен бота от @BotFather (без него поднимется только сервер)
    WEBAPP_URL        https-адрес мини-аппа, на него ведёт кнопка в боте
    ADMIN_CODE        код входа в админ-панель (по умолчанию 0000 — смените!)
    ADMIN_IDS         id админов через запятую — им придут уведомления о заказах
    BOT_USERNAME      юзернейм бота без @ (для реферальных ссылок)
    REFERRAL_PERCENT  процент реферального бонуса (по умолчанию 5)
    SHOP_TZ           часовой пояс магазина (по умолчанию Europe/Moscow)
    PORT              порт сервера (по умолчанию 3000; на Railway задаётся сам)
"""

import asyncio

import csv
import io

async def bg_cart_worker(pool, bot_instance):
    counter = 0
    while True:
        try:
            # 1. Release expired (every 60s)
            async with pool.acquire() as c:
                await c.execute("SELECT release_expired_reservations()")
            
            # 2. Old cart reminders (every 1 hour = 60 loops)
            if counter % 60 == 0:
                async with pool.acquire() as c:
                    rows = await c.fetch("SELECT DISTINCT user_id FROM cart_items WHERE reserved_until IS NOT NULL AND reserved_until < NOW() - INTERVAL '2 hours'")
                for r in rows:
                    try:
                        await bot_instance.send_message(r["user_id"], "У вашому кошику залишилися товари! Завершіть замовлення.")
                    except Exception:
                        pass
        except Exception as e:
            log.error(f"bg_cart_worker error: {e}")
        
        counter += 1
        await asyncio.sleep(60)

import functools
import json
import hmac
import hashlib
from urllib.parse import parse_qsl
import logging
import os
import re
import ssl
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import asyncpg
import redis.asyncio as aioredis
import csv
import io

async def bg_cart_worker(pool, bot_instance):
    counter = 0
    while True:
        try:
            # 1. Release expired (every 60s)
            async with pool.acquire() as c:
                await c.execute("SELECT release_expired_reservations()")
            
            # 2. Old cart reminders (every 1 hour = 60 loops)
            if counter % 60 == 0:
                async with pool.acquire() as c:
                    rows = await c.fetch("SELECT DISTINCT user_id FROM cart_items WHERE reserved_until IS NOT NULL AND reserved_until < NOW() - INTERVAL '2 hours'")
                for r in rows:
                    try:
                        await bot_instance.send_message(r["user_id"], "У вашому кошику залишилися товари! Завершіть замовлення.")
                    except Exception:
                        pass
        except Exception as e:
            log.error(f"bg_cart_worker error: {e}")
        
        counter += 1
        await asyncio.sleep(60)

from aiohttp import web

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("smoke-lab")

# ──────────────────────────── настройки ────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
UPLOADS_DIR = PUBLIC_DIR / "uploads"


def load_env_file() -> None:
    """Читает .env рядом с bot.py, если он есть. Без сторонних библиотек.
    Переменные, уже заданные в окружении (например на Railway), имеют приоритет —
    файл их не перезатирает.

    ВАЖНО: .env с токеном и паролем базы никогда не коммитьте в git.
    Добавьте в .gitignore строки:  .env  и  __pycache__/
    """
    path = BASE_DIR / ".env"
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_env_file()

DATABASE_URL = os.getenv("DATABASE_URL", "")
# Токен зашит как значение по умолчанию. Переменная окружения BOT_TOKEN,
# если она задана на хостинге, имеет приоритет и перекроет это значение.
BOT_TOKEN = os.getenv("BOT_TOKEN", "8904174993:AAELEtTDPUO8-XcmPct8L3-zq7Vdn0pTDjw")
WEBAPP_URL = os.getenv("WEBAPP_URL", "")
ADMIN_CODE = os.getenv("ADMIN_CODE", "0000")
BOT_USERNAME = os.getenv("BOT_USERNAME", "your_bot")
REFERRAL_PERCENT = int(os.getenv("REFERRAL_PERCENT", "5"))
PORT = int(os.getenv("PORT", "3000"))
SHOP_TZ = ZoneInfo(os.getenv("SHOP_TZ", "Europe/Moscow"))
ADMIN_IDS = [x.strip() for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip()]
REDIS_URL = os.getenv("REDIS_URL", "")
CACHE_TTL_CATALOG = int(os.getenv("CACHE_TTL_CATALOG", "60"))

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
WEEKDAYS_RU = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]

pool: asyncpg.Pool | None = None
redis: "aioredis.Redis | None" = None  # кеш; None — кеш выключен


def fmt_date(value: datetime) -> str:
    """Дата в формате 12.09.2026 в часовом поясе магазина."""
    return value.astimezone(SHOP_TZ).strftime("%d.%m.%Y")


# ──────────────────────────── схема базы ────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name        JSONB   NOT NULL DEFAULT '{}'::jsonb,
  description JSONB   NOT NULL DEFAULT '{}'::jsonb,
  price       INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  category    TEXT    NOT NULL DEFAULT '',
  is_liquid   BOOLEAN NOT NULL DEFAULT FALSE,
  is_hit      BOOLEAN NOT NULL DEFAULT FALSE,
  stock_count INTEGER NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  photo       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
  id   INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categories (
  id   INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS reviews (
  id     INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text   TEXT    NOT NULL DEFAULT '',
  date   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS promos (
  id       INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  code     TEXT    NOT NULL UNIQUE,
  discount INTEGER NOT NULL CHECK (discount > 0 AND discount <= 100),
  active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS profiles (
  telegram_id   TEXT PRIMARY KEY,
  first_name    TEXT,
  username      TEXT,
  balance       INTEGER NOT NULL DEFAULT 0,
  invited_count INTEGER NOT NULL DEFAULT 0,
  ref_earned    INTEGER NOT NULL DEFAULT 0,
  invited_by    TEXT REFERENCES profiles(telegram_id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  user_id    TEXT    NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty        INTEGER NOT NULL CHECK (qty > 0),
  reserved_qty INTEGER NOT NULL DEFAULT 0,
  reserved_until TIMESTAMPTZ,
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER GENERATED BY DEFAULT AS IDENTITY (START WITH 1001) PRIMARY KEY,
  user_id         TEXT    NOT NULL,
  total           INTEGER NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'Новый',
  delivery_method TEXT,
  city            TEXT,
  promo_code      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  name       JSONB   NOT NULL DEFAULT '{}'::jsonb,
  price      INTEGER NOT NULL,
  qty        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS referral_rewards (
  order_id   INTEGER NOT NULL,
  level      SMALLINT NOT NULL,
  inviter_id TEXT    NOT NULL,
  bonus      INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, level)
);


-- ================== ADVANCED MIGRATIONS ==================

CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING GIN (name jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_gin ON products USING GIN (description jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_ru ON products ((name ->> 'ru'));
CREATE INDEX IF NOT EXISTS idx_categories_name_ru ON categories ((name ->> 'ru'));

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_categories_code_format') THEN
        ALTER TABLE categories ADD CONSTRAINT chk_categories_code_format CHECK (code ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_referral_rewards_level_range') THEN
        ALTER TABLE referral_rewards ADD CONSTRAINT chk_referral_rewards_level_range CHECK (level BETWEEN 1 AND 10);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cart_items_reserved_until ON cart_items (reserved_until) WHERE reserved_qty > 0;

CREATE OR REPLACE FUNCTION reserve_cart_item(
    p_user_id     TEXT,
    p_product_id  BIGINT,
    p_qty         INTEGER,
    p_reserve_for INTERVAL DEFAULT INTERVAL '15 minutes'
) RETURNS cart_items
LANGUAGE plpgsql
AS $func$
DECLARE
    v_available     INTEGER;
    v_existing_qty  INTEGER;
    v_result        cart_items;
BEGIN
    IF p_qty <= 0 THEN
        RAISE EXCEPTION 'Кількість резервування має бути більшою за 0';
    END IF;

    PERFORM 1 FROM products WHERE id = p_product_id FOR UPDATE;

    SELECT reserved_qty INTO v_existing_qty
    FROM cart_items
    WHERE user_id = p_user_id AND product_id = p_product_id
    FOR UPDATE;

    v_existing_qty := COALESCE(v_existing_qty, 0);

    SELECT p.stock_count - COALESCE((
        SELECT SUM(ci.reserved_qty)
        FROM cart_items ci
        WHERE ci.product_id = p_product_id
          AND ci.reserved_until > now()
          AND ci.user_id <> p_user_id
    ), 0)
    INTO v_available
    FROM products p
    WHERE p.id = p_product_id;

    IF v_available < (p_qty - v_existing_qty) THEN
        RAISE EXCEPTION 'Недостатньо товару для резервування';
    END IF;

    INSERT INTO cart_items (user_id, product_id, qty, reserved_qty, reserved_until)
    VALUES (p_user_id, p_product_id, p_qty, p_qty, now() + p_reserve_for)
    ON CONFLICT (user_id, product_id)
    DO UPDATE SET
        qty            = EXCLUDED.qty,
        reserved_qty   = EXCLUDED.reserved_qty,
        reserved_until = EXCLUDED.reserved_until
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$func$;

CREATE OR REPLACE FUNCTION release_expired_reservations() RETURNS INTEGER
LANGUAGE plpgsql
AS $func$
DECLARE
    v_released INTEGER;
BEGIN
    UPDATE cart_items
    SET reserved_qty = 0,
        reserved_until = NULL
    WHERE reserved_until IS NOT NULL
      AND reserved_until <= now()
      AND reserved_qty > 0;

    GET DIAGNOSTICS v_released = ROW_COUNT;
    RETURN v_released;
END;
$func$;

CREATE OR REPLACE FUNCTION decrement_stock(
    p_product_id BIGINT,
    p_qty        INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
AS $func$
DECLARE
    v_new_stock INTEGER;
BEGIN
    UPDATE products
    SET stock_count = stock_count - p_qty
    WHERE id = p_product_id
      AND stock_count >= p_qty
    RETURNING stock_count INTO v_new_stock;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Недостатньо товару на складі';
    END IF;

    RETURN v_new_stock;
END;
$func$;

CREATE INDEX IF NOT EXISTS idx_cart_items_reserved_until ON cart_items (reserved_until) WHERE reserved_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user    ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_items_order    ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_items_product ON order_items (product_id);

CREATE OR REPLACE VIEW admin_user_ltv AS
WITH user_orders AS (
    SELECT o.user_id, COUNT(*) AS orders_count, SUM(o.total) AS ltv, AVG(o.total) AS avg_order_value, MIN(o.created_at) AS first_order_at, MAX(o.created_at) AS last_order_at
    FROM orders o WHERE o.status <> 'Отменён' GROUP BY o.user_id
), ranked AS (SELECT u.*, RANK() OVER (ORDER BY u.ltv DESC) AS ltv_rank FROM user_orders u)
SELECT r.user_id, r.orders_count, r.ltv, ROUND(r.avg_order_value, 2) AS avg_order_value, r.first_order_at, r.last_order_at, r.ltv_rank FROM ranked r;

CREATE OR REPLACE VIEW admin_weekly_retention AS
WITH first_orders AS (SELECT o.user_id, DATE_TRUNC('week', MIN(o.created_at)) AS cohort_week FROM orders o WHERE o.status <> 'Отменён' GROUP BY o.user_id),
user_activity AS (SELECT DISTINCT o.user_id, DATE_TRUNC('week', o.created_at) AS activity_week FROM orders o WHERE o.status <> 'Отменён'),
cohort_activity AS (SELECT f.cohort_week, a.activity_week, COUNT(DISTINCT a.user_id) AS active_users FROM first_orders f JOIN user_activity a ON a.user_id = f.user_id AND a.activity_week >= f.cohort_week AND a.activity_week < f.cohort_week + INTERVAL '3 weeks' GROUP BY f.cohort_week, a.activity_week),
cohort_size AS (SELECT cohort_week, COUNT(*) AS cohort_users FROM first_orders GROUP BY cohort_week),
retention AS (SELECT c.cohort_week, c.cohort_users, EXTRACT(WEEK FROM (a.activity_week - c.cohort_week))::INT AS week_number, COALESCE(a.active_users, 0) AS active_users FROM cohort_size c LEFT JOIN cohort_activity a ON a.cohort_week = c.cohort_week)
SELECT cohort_week, cohort_users,
MAX(active_users) FILTER (WHERE week_number = 0) AS week_0_users,
MAX(active_users) FILTER (WHERE week_number = 1) AS week_1_users,
MAX(active_users) FILTER (WHERE week_number = 2) AS week_2_users,
ROUND(100.0 * MAX(active_users) FILTER (WHERE week_number = 0) / NULLIF(cohort_users, 0), 2) AS week_0_retention_pct,
ROUND(100.0 * MAX(active_users) FILTER (WHERE week_number = 1) / NULLIF(cohort_users, 0), 2) AS week_1_retention_pct,
ROUND(100.0 * MAX(active_users) FILTER (WHERE week_number = 2) / NULLIF(cohort_users, 0), 2) AS week_2_retention_pct
FROM retention GROUP BY cohort_week, cohort_users ORDER BY cohort_week;

CREATE OR REPLACE VIEW admin_top_products_month AS
WITH product_sales AS (SELECT oi.product_id, (array_agg(oi.name))[1] AS product_name, SUM(oi.qty) AS units_sold, SUM(oi.price * oi.qty) AS revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status <> 'Отменён' AND o.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 month' GROUP BY oi.product_id),
ranked AS (SELECT ps.*, ROW_NUMBER() OVER (ORDER BY ps.units_sold DESC, ps.revenue DESC, ps.product_id) AS rank FROM product_sales ps)
SELECT rank, product_id, product_name, units_sold, revenue FROM ranked WHERE rank <= 5 ORDER BY rank;

CREATE INDEX IF NOT EXISTS idx_orders_user_created_active ON orders (user_id, created_at) WHERE status <> 'Отменён';
CREATE INDEX IF NOT EXISTS idx_orders_created_active ON orders (created_at) WHERE status <> 'Отменён';
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items (order_id, product_id);

CREATE INDEX IF NOT EXISTS idx_profiles_inv   ON profiles (invited_by);
"""

SEED_PRODUCTS = [
    ({"ru": "Galaxy Mix 30ml", "de": "Galaxy Mix 30ml"}, {"ru": "Ягодный микс с холодком, 3mg", "de": "Beerenmix mit Kühle, 3mg"}, 650, "Жидкости", True, True, 100),
    ({"ru": "Cosmic Berry 30ml", "de": "Cosmic Berry 30ml"}, {"ru": "Черника-малина, 6mg", "de": "Blaubeere-Himbeere, 6mg"}, 650, "Жидкости", True, False, 100),
    ({"ru": "Nebula Mint 30ml", "de": "Nebula Mint 30ml"}, {"ru": "Свежая мята, 3mg", "de": "Frische Minze, 3mg"}, 600, "Жидкости", True, False, 100),
    ({"ru": "Одноразка Stardust 6000", "de": "Einweg Stardust 6000"}, {"ru": "Тропический микс, 6000 затяжек", "de": "Tropischer Mix, 6000 Züge"}, 1200, "Одноразки", False, True, 100),
]
SEED_CITIES = ["Москва", "Санкт-Петербург", "Казань"]
SEED_CATEGORIES = [("liquids", {"ru": "Жидкости", "de": "Liquids"}), ("disposables", {"ru": "Одноразки", "de": "Einweg-E-Zigaretten"})]
SEED_REVIEWS = [
    (5, "Быстро привезли, всё запечатано.", "2026-08-20"),
    (5, "Хороший вкус, буду брать ещё.", "2026-08-25"),
    (4, "Всё ок, но хотелось бы больше вкусов.", "2026-08-28"),
]
SEED_PROMOS = [("SMOKE10", 10, True), ("WELCOME", 15, True), ("OLDCODE", 5, False)]


async def connect_db() -> asyncpg.Pool:
    """Создаёт пул соединений. SSL включается для внешних адресов Railway."""
    if not DATABASE_URL:
        log.error("Не задана переменная окружения DATABASE_URL")
        sys.exit(1)

    kwargs = {}
    if "sslmode=require" in DATABASE_URL or "proxy.rlwy.net" in DATABASE_URL or os.getenv("PGSSL") == "require":
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs["ssl"] = ctx

    dsn = re.sub(r"[?&]sslmode=\w+", "", DATABASE_URL)
    return await asyncpg.create_pool(dsn, min_size=1, max_size=10, **kwargs)


async def init_db(seed: bool = True) -> None:
    """Создаёт таблицы и один раз добавляет демо-товары. Повторный вызов безопасен."""
    async with pool.acquire() as c:
        await c.execute(SCHEMA)

        # Таблица категорий появилась позже остальных. Если база уже работала
        # до этого, заполняем её один раз тем, что реально проставлено у товаров.
        if not await c.fetchval("SELECT 1 FROM categories LIMIT 1"):
            existing = await c.fetch(
                "SELECT DISTINCT category FROM products WHERE category <> ''"
            )
            pass

        if not seed:
            return
        if await c.fetchval("SELECT 1 FROM meta WHERE key = 'seeded'"):
            return

        async with c.transaction():
            for name, desc, price, cat, liquid, hit, stock_count in SEED_PRODUCTS:
                await c.execute(
                    """INSERT INTO products (name, description, price, category, is_liquid, is_hit, stock_count)
                       VALUES ($1::jsonb,$2::jsonb,$3,$4,$5,$6,$7)""",
                    json.dumps(name), json.dumps(desc), price, cat, liquid, hit, stock_count,
                )
            for name in SEED_CITIES:
                await c.execute("INSERT INTO cities (name) VALUES ($1) ON CONFLICT DO NOTHING", name)
            for code, name in SEED_CATEGORIES:
                await c.execute("INSERT INTO categories (code, name) VALUES ($1, $2::jsonb) ON CONFLICT DO NOTHING", code, json.dumps(name))
            for rating, text, date in SEED_REVIEWS:
                await c.execute("INSERT INTO reviews (rating, text, date) VALUES ($1,$2,$3)", rating, text, date)
            for code, discount, active in SEED_PROMOS:
                await c.execute(
                    "INSERT INTO promos (code, discount, active) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
                    code, discount, active,
                )
            await c.execute("INSERT INTO meta (key, value) VALUES ('seeded', now()::text)")
    log.info("Таблицы созданы, демо-товары добавлены")


# ──────────────────────────── товары ────────────────────────────

async def get_products(is_liquid=None) -> list[dict]:
    if is_liquid in (None, ""):
        rows = await pool.fetch("SELECT * FROM products ORDER BY id")
    else:
        flag = is_liquid in ("1", True, "true")
        rows = await pool.fetch("SELECT * FROM products WHERE is_liquid = $1 ORDER BY id", flag)
    return [dict(r) for r in rows]


async def add_product(p: dict) -> dict:
    row = await pool.fetchrow(
        """INSERT INTO products (name, description, price, category, is_liquid, is_hit, stock_count, photo)
           VALUES ($1::jsonb,$2::jsonb,$3,$4,$5,$6,$7,$8) RETURNING *""",
        json.dumps(p.get("name") or {}),
        json.dumps(p.get("description") or {}),
        int(p.get("price") or 0),
        p.get("category") or "",
        bool(p.get("is_liquid")),
        bool(p.get("is_hit")),
        int(p.get("stock_count") or 0),
        p.get("photo"),
    )
    return dict(row)


async def update_product(pid: int, p: dict) -> dict | None:
    name_update = p.get("name")
    desc_update = p.get("description")
    
    query = """UPDATE products SET
             name        = CASE WHEN $2::jsonb IS NOT NULL THEN name || $2::jsonb ELSE name END,
             description = CASE WHEN $3::jsonb IS NOT NULL THEN description || $3::jsonb ELSE description END,
             price       = COALESCE($4, price),
             category    = COALESCE($5, category),
             is_liquid   = COALESCE($6, is_liquid),
             is_hit      = COALESCE($7, is_hit),
             stock_count = COALESCE($8, stock_count),
             photo       = CASE WHEN $9 THEN $10 ELSE photo END
           WHERE id = $1 RETURNING *"""
           
    row = await pool.fetchrow(
        query,
        pid,
        json.dumps(name_update) if name_update else None,
        json.dumps(desc_update) if desc_update else None,
        int(p["price"]) if p.get("price") is not None else None,
        p.get("category"),
        bool(p["is_liquid"]) if "is_liquid" in p else None,
        bool(p["is_hit"]) if "is_hit" in p else None,
        int(p["stock_count"]) if "stock_count" in p else None,
        "photo" in p,
        p.get("photo"),
    )
    return dict(row) if row else None


async def delete_product(pid: int) -> None:
    await pool.execute("DELETE FROM products WHERE id = $1", pid)


# ──────────────────────────── корзина ────────────────────────────

async def get_cart(user_id: str) -> dict:
    rows = await pool.fetch(
        """SELECT c.product_id, p.name, p.price, c.qty
             FROM cart_items c JOIN products p ON p.id = c.product_id
            WHERE c.user_id = $1 ORDER BY c.product_id""",
        str(user_id),
    )
    items = [dict(r) for r in rows]
    return {"items": items, "total": sum(i["price"] * i["qty"] for i in items)}


async def mutate_cart(user_id: str, product_id: int, action: str) -> dict:
    """Атомарное изменение: два одновременных нажатия не затрут друг друга."""
    uid, pid = str(user_id), int(product_id)

    if not await pool.fetchval("SELECT 1 FROM products WHERE id = $1", pid):
        raise ValueError("Товар не найден")

    if action == "add":
        async with pool.acquire() as c:
            async with c.transaction():
                current_qty = await c.fetchval("SELECT qty FROM cart_items WHERE user_id = $1 AND product_id = $2 FOR UPDATE", uid, pid)
                if current_qty is None:
                    current_qty = 0
                await c.execute("SELECT reserve_cart_item($1, $2, $3)", uid, pid, current_qty + 1)
    elif action == "remove":
        async with pool.acquire() as c:
            async with c.transaction():
                qty = await c.fetchval(
                    "SELECT qty FROM cart_items WHERE user_id = $1 AND product_id = $2 FOR UPDATE",
                    uid, pid,
                )
                if qty is None:
                    pass
                elif qty > 1:
                    await c.execute("SELECT reserve_cart_item($1, $2, $3)", uid, pid, qty - 1)
                else:
                    await c.execute(
                        "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", uid, pid
                    )

    return await get_cart(uid)


async def clear_cart(user_id: str) -> None:
    await pool.execute("DELETE FROM cart_items WHERE user_id = $1", str(user_id))


# ──────────────────────────── заказы ────────────────────────────

ORDER_SELECT = """
  SELECT o.id, o.user_id, o.created_at, o.total, o.status,
         o.delivery_method, o.city, o.promo_code,
         COALESCE(
           json_agg(
             json_build_object('product_id', i.product_id, 'name', i.name,
                               'price', i.price, 'qty', i.qty) ORDER BY i.id
           ) FILTER (WHERE i.id IS NOT NULL), '[]'
         )::text AS items
    FROM orders o
    LEFT JOIN order_items i ON i.order_id = o.id
"""


def map_order(row) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "date": fmt_date(row["created_at"]),
        "created_at": row["created_at"].isoformat(),
        "total": row["total"],
        "status": row["status"],
        "delivery_method": row["delivery_method"],
        "city": row["city"],
        "promo_code": row["promo_code"],
        "items": json.loads(row["items"]),
    }


async def get_orders(user_id: str) -> list[dict]:
    rows = await pool.fetch(
        f"{ORDER_SELECT} WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.id DESC", str(user_id)
    )
    return [map_order(r) for r in rows]


async def get_all_orders() -> list[dict]:
    rows = await pool.fetch(f"{ORDER_SELECT} GROUP BY o.id ORDER BY o.id DESC")
    return [map_order(r) for r in rows]


async def create_order(user_id, delivery_method=None, city=None, promo_code=None) -> dict:
    uid = str(user_id)
    async with pool.acquire() as c:
        async with c.transaction():
            rows = await c.fetch(
                """SELECT c.product_id, p.name, p.price, c.qty, p.stock_count
                     FROM cart_items c JOIN products p ON p.id = c.product_id
                    WHERE c.user_id = $1 ORDER BY c.product_id
                    FOR UPDATE OF c, p""",
                uid,
            )
            if not rows:
                raise ValueError("Корзина пуста")

            items = [dict(r) for r in rows]
            for i in items:
                if i["stock_count"] < i["qty"]:
                    try:
                        n = json.loads(i["name"]).get("ru", "Товар")
                    except:
                        n = "Товар"
                    raise ValueError(f"Недостаточно товара: {n} (остаток: {i['stock_count']})")
                    
            for i in items:
                await c.execute(
                    "SELECT decrement_stock($1, $2)",
                    i["product_id"], i["qty"]
                )

            total = sum(i["price"] * i["qty"] for i in items)
            promo = None
            if promo_code:
                promo = await c.fetchrow(
                    "SELECT code, discount FROM promos WHERE code = $1 AND active = TRUE",
                    str(promo_code).upper(),
                )
                if promo:
                    total = round(total * (1 - promo["discount"] / 100))

            created = await c.fetchrow(
                """INSERT INTO orders (user_id, total, status, delivery_method, city, promo_code)
                   VALUES ($1,$2,'Новый',$3,$4,$5) RETURNING id, created_at""",
                uid, total, delivery_method, city, promo["code"] if promo else None,
            )
            order_id = created["id"]

            for i in items:
                await c.execute(
                    """INSERT INTO order_items (order_id, product_id, name, price, qty)
                       VALUES ($1,$2,$3::jsonb,$4,$5)""",
                    order_id, i["product_id"], i["name"], i["price"], i["qty"],
                )

            await c.execute("DELETE FROM cart_items WHERE user_id = $1", uid)

    return {
        "id": order_id,
        "user_id": uid,
        "date": fmt_date(created["created_at"]),
        "total": total,
        "status": "Новый",
        "delivery_method": delivery_method,
        "city": city,
        "promo_code": promo["code"] if promo else None,
        "items": items,
    }


async def update_order_status(order_id: int, status: str) -> dict | None:
    updated = await pool.execute("UPDATE orders SET status = $2 WHERE id = $1", order_id, status)
    if updated.endswith("0"):
        return None
    row = await pool.fetchrow(f"{ORDER_SELECT} WHERE o.id = $1 GROUP BY o.id", order_id)
    return map_order(row)


# ──────────────────────── профили и рефералка ────────────────────────

async def get_profile(user_id: str, first_name=None, username=None) -> dict:
    row = await pool.fetchrow(
        """INSERT INTO profiles (telegram_id, first_name, username) VALUES ($1,$2,$3)
           ON CONFLICT (telegram_id) DO UPDATE SET
             first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
             username   = COALESCE(EXCLUDED.username,   profiles.username)
           RETURNING telegram_id, first_name, username, balance,
                     invited_count, ref_earned, invited_by""",
        str(user_id), first_name or None, username or None,
    )
    return dict(row)


async def add_balance(user_id: str, amount) -> dict:
    """Пополнение одним атомарным запросом, без чтения-записи."""
    row = await pool.fetchrow(
        """INSERT INTO profiles (telegram_id, balance) VALUES ($1,$2)
           ON CONFLICT (telegram_id) DO UPDATE SET balance = profiles.balance + EXCLUDED.balance
           RETURNING telegram_id, first_name, username, balance,
                     invited_count, ref_earned, invited_by""",
        str(user_id), round(float(amount)),
    )
    return dict(row)


async def register_referral(inviter_id: str, new_user_id: str) -> dict | None:
    """Привязка приглашённого. Повторный вызов ничего не удваивает."""
    inviter, invited = str(inviter_id), str(new_user_id)
    if inviter == invited:
        return None

    async with pool.acquire() as c:
        async with c.transaction():
            await c.execute("INSERT INTO profiles (telegram_id) VALUES ($1) ON CONFLICT DO NOTHING", inviter)
            await c.execute("INSERT INTO profiles (telegram_id) VALUES ($1) ON CONFLICT DO NOTHING", invited)

            linked = await c.fetchval(
                """UPDATE profiles SET invited_by = $1
                    WHERE telegram_id = $2 AND invited_by IS NULL
                RETURNING telegram_id""",
                inviter, invited,
            )
            if linked:
                await c.execute(
                    "UPDATE profiles SET invited_count = invited_count + 1 WHERE telegram_id = $1",
                    inviter,
                )

            row = await c.fetchrow(
                """SELECT telegram_id, first_name, username, balance,
                          invited_count, ref_earned, invited_by
                     FROM profiles WHERE telegram_id = $1""",
                inviter,
            )
    return dict(row) if row else None


async def reward_referral(new_user_id: str, order_total: int, percent: int = 5, order_id=None) -> dict | None:
    async with pool.acquire() as c:
        async with c.transaction():
            rows = await c.fetch(
                """WITH RECURSIVE upline AS (
                     SELECT telegram_id, invited_by, 1 as level
                     FROM profiles WHERE telegram_id = (SELECT invited_by FROM profiles WHERE telegram_id = $1)
                     UNION ALL
                     SELECT p.telegram_id, p.invited_by, u.level + 1
                     FROM profiles p
                     INNER JOIN upline u ON p.telegram_id = u.invited_by
                     WHERE u.level < 3
                   )
                   SELECT telegram_id, level FROM upline WHERE telegram_id IS NOT NULL""",
                str(new_user_id)
            )
            
            bonuses = []
            percentages = {1: 5, 2: 2, 3: 1} # 5%, 2%, 1%
            
            for row in rows:
                inviter_id = row['telegram_id']
                level = row['level']
                pct = percentages.get(level, 0)
                bonus = round(int(order_total) * pct / 100)
                
                if bonus <= 0:
                    continue
                
                if order_id is not None:
                    guard = await c.fetchval(
                        """INSERT INTO referral_rewards (order_id, level, inviter_id, bonus) VALUES ($1,$2,$3,$4)
                           ON CONFLICT (order_id, level) DO NOTHING RETURNING order_id""",
                        int(order_id), level, inviter_id, bonus,
                    )
                    if guard is None:
                        continue
                
                await c.execute(
                    """UPDATE profiles SET balance = balance + $2, ref_earned = ref_earned + $2
                        WHERE telegram_id = $1""",
                    inviter_id, bonus,
                )
                bonuses.append({"inviterId": inviter_id, "level": level, "bonus": bonus})
                
    return {"bonuses": bonuses} if bonuses else None


async def get_top_referrers(limit: int = 10) -> list[dict]:
    rows = await pool.fetch(
        """SELECT COALESCE(first_name, username, 'ID ' || telegram_id) AS name,
                  invited_count AS invited, ref_earned AS earned
             FROM profiles WHERE invited_count > 0
            ORDER BY invited_count DESC, ref_earned DESC LIMIT $1""",
        limit,
    )
    return [dict(r) for r in rows]


# ──────────────────────────── промокоды ────────────────────────────

async def get_promos() -> list[dict]:
    rows = await pool.fetch("SELECT id, code, discount, active FROM promos ORDER BY id")
    return [dict(r) for r in rows]


async def add_promo(code: str, discount: int) -> dict:
    row = await pool.fetchrow(
        """INSERT INTO promos (code, discount, active) VALUES ($1,$2,TRUE)
           ON CONFLICT (code) DO UPDATE SET discount = EXCLUDED.discount, active = TRUE
           RETURNING id, code, discount, active""",
        str(code).upper(), int(discount),
    )
    return dict(row)


async def toggle_promo(pid: int) -> dict | None:
    row = await pool.fetchrow(
        "UPDATE promos SET active = NOT active WHERE id = $1 RETURNING id, code, discount, active",
        pid,
    )
    return dict(row) if row else None


async def delete_promo(pid: int) -> None:
    await pool.execute("DELETE FROM promos WHERE id = $1", pid)


async def check_promo(code: str) -> dict | None:
    row = await pool.fetchrow(
        "SELECT id, code, discount, active FROM promos WHERE code = $1 AND active = TRUE",
        str(code).upper(),
    )
    return dict(row) if row else None


# ──────────────────────────── статистика ────────────────────────────

async def get_stats() -> dict:
    rows = await pool.fetch(
        """SELECT created_at, total FROM orders
            WHERE status <> 'Отменён' AND created_at >= now() - interval '8 days'"""
    )

    today = datetime.now(SHOP_TZ)
    days, labels = [], []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        days.append(d.strftime("%d.%m.%Y"))
        labels.append(WEEKDAYS_RU[d.weekday()])

    revenue = [0] * 7
    counts = [0] * 7
    for r in rows:
        key = fmt_date(r["created_at"])
        if key in days:
            idx = days.index(key)
            revenue[idx] += r["total"]
            counts[idx] += 1

    total_revenue = sum(revenue)
    total_orders = sum(counts)
    return {
        "revenueByDay": revenue,
        "ordersByDay": counts,
        "labels": labels,
        "totalRevenue": total_revenue,
        "totalOrders": total_orders,
        "avgCheck": round(total_revenue / total_orders) if total_orders else 0,
    }



# ──────────────────────────── кеш на Redis ────────────────────────────
#
# Декоратор @cache_response вешается на любой aiohttp-хендлер: ответ
# складывается в Redis на ttl секунд, повторные запросы обслуживаются
# из кеша без обращения к PostgreSQL. Это снимает нагрузку с базы,
# когда каталог одновременно запрашивают тысячи клиентов мини-аппа.
#
# ВАЖНО: Redis — опционален. Если REDIS_URL не задан или Redis лёг,
# всё работает напрямую с базой, просто без кеша.
#
# Инвалидация — осознанная и только через админку: после изменения
# товаров (add/update/delete) вызывается schedule_products_cache_invalidation(),
# которая запускает сброс ключей в фоне через asyncio.create_task.

CATALOG_CACHE_PREFIX = "cache:products"


def catalog_cache_key(is_liquid: str | None) -> str:
    return f"{CATALOG_CACHE_PREFIX}:{is_liquid or 'all'}"


def cache_response(ttl: int = 60, key_func=None):
    """Декоратор для aiohttp-хендлеров: кладёт JSON-ответ в Redis.

    key_func(request) -> str — ключ кеша (например, с учётом query-параметров).
    Без key_func ключ строится из метода, пути и query string.
    В кеш попадают только ответы со статусом 200.
    """

    def decorator(handler):
        @functools.wraps(handler)
        async def wrapper(request: web.Request):
            if redis is None:  # кеш выключен — сразу в базу
                return await handler(request)

            key = key_func(request) if key_func else f"cache:{request.method}:{request.path_qs}"
            try:
                cached = await redis.get(key)
            except Exception as e:
                log.warning("Redis GET не удался, иду в БД: %s", e)
                cached = None
            if cached is not None:
                return web.Response(text=cached, content_type="application/json",
                                    headers={"X-Cache": "HIT"})

            response = await handler(request)

            body = getattr(response, "text", None)
            if response.status == 200 and body:
                try:
                    await redis.set(key, body, ex=ttl)
                except Exception as e:
                    log.warning("Redis SET не удался: %s", e)
            return response

        return wrapper

    return decorator


async def invalidate_products_cache() -> None:
    """Сбрасывает кеш каталога. Варианты ключей известны заранее,
    поэтому точечный delete — без SCAN по всей базе Redis."""
    if redis is None:
        return
    keys = [catalog_cache_key(v) for v in (None, "0", "1", "true", "false")]
    try:
        await redis.delete(*keys)
        log.info("Кеш каталога инвалидирован (%d ключей)", len(keys))
    except Exception as e:
        log.warning("Не смог сбросить кеш каталога: %s", e)


def schedule_products_cache_invalidation() -> None:
    """Инвалидация в фоне: админ не ждёт лишних миллисекунд ответа."""
    asyncio.create_task(invalidate_products_cache())


# ──────────────────────────── HTTP API ────────────────────────────

def validate_init_data(init_data: str, bot_token: str) -> bool:
    try:
        parsed_data = dict(parse_qsl(init_data))
        if 'hash' not in parsed_data:
            return False
        hash_val = parsed_data.pop('hash')
        data_check_string = '\n'.join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        return calculated_hash == hash_val
    except Exception:
        return False

def is_admin(request: web.Request) -> bool:
    init_data = request.headers.get("X-Telegram-Init-Data")
    if init_data and validate_init_data(init_data, BOT_TOKEN):
        parsed_data = dict(parse_qsl(init_data))
        user_data = json.loads(parsed_data.get('user', '{}'))
        user_id = str(user_data.get('id', ''))
        return user_id in ADMIN_IDS

    code = request.headers.get("x-admin-code") or request.query.get("admin_code")
    return code == ADMIN_CODE


def admin_only(handler):
    async def wrapper(request: web.Request):
        if not is_admin(request):
            return web.json_response({"error": "Неверный код администратора"}, status=401)
        return await handler(request)
    return wrapper



_redis_url = os.getenv("REDIS_URL", "")
redis_client = aioredis.from_url(_redis_url, decode_responses=True) if _redis_url else None


@web.middleware
async def cors_middleware(request: web.Request, handler):
    origin = request.headers.get("Origin", "")
    if request.method == "OPTIONS":
        resp = web.Response(status=204)
    else:
        resp = await handler(request)
    resp.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Telegram-Init-Data, x-admin-code, Bypass-Tunnel-Reminder, ngrok-skip-browser-warning"
    return resp

@web.middleware
async def rate_limiting_middleware(request: web.Request, handler):
    limit = 100
    window = 60
    identifier = request.query.get("user_id") or request.remote or "unknown"
    redis_key = f"rate_limit:{identifier}"
    try:
        if redis_client:
            current_requests = await redis_client.incr(redis_key)
            if current_requests == 1:
                await redis_client.expire(redis_key, window)
            if current_requests > limit:
                return web.json_response({"error": "Too Many Requests (DDoS/Spam protection active)"}, status=429)
    except Exception:
        pass
    return await handler(request)

@web.middleware
async def error_middleware(request: web.Request, handler):
    """Любая необработанная ошибка отдаётся как 500, а не роняет сервер."""
    try:
        return await handler(request)
    except web.HTTPException:
        raise
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)
    except Exception as e:
        log.exception("Ошибка %s %s: %s", request.method, request.path, e)
        return web.json_response({"error": "Ошибка сервера"}, status=500)


async def read_json(request: web.Request) -> dict:
    try:
        data = await request.json()
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


@cache_response(
    ttl=CACHE_TTL_CATALOG,
    key_func=lambda r: catalog_cache_key(r.query.get("is_liquid")),
)
async def h_products(request):
    return web.json_response(await get_products(request.query.get("is_liquid")), dumps=dumps)


async def h_cities(request):
    rows = await pool.fetch("SELECT id, name FROM cities ORDER BY name")
    return web.json_response([dict(r) for r in rows])


async def h_categories(request):
    rows = await pool.fetch("SELECT id, name FROM categories ORDER BY name")
    return web.json_response([dict(r) for r in rows])


async def h_reviews(request):
    rows = await pool.fetch("SELECT id, rating, text, date FROM reviews ORDER BY id")
    return web.json_response([dict(r) for r in rows])


async def h_cart_get(request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "user_id обязателен"}, status=400)
    return web.json_response(await get_cart(user_id))


async def h_cart_post(request):
    body = await read_json(request)
    user_id, product_id, action = body.get("user_id"), body.get("product_id"), body.get("action")
    if not user_id or not product_id or action not in ("add", "remove"):
        return web.json_response({"error": "Некорректные данные"}, status=400)
    try:
        return web.json_response(await mutate_cart(user_id, product_id, action))
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)


async def h_orders(request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "user_id обязателен"}, status=400)
    return web.json_response(await get_orders(user_id))


async def h_profile(request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "user_id обязателен"}, status=400)
    profile = await get_profile(user_id, request.query.get("first_name"), request.query.get("username"))
    profile["ref_link"] = f"https://t.me/{BOT_USERNAME}?start=ref_{user_id}"
    return web.json_response(profile)


async def h_topup(request):
    # ДЕМО: баланс зачисляется сразу, без реальной оплаты.
    # Перед запуском подключите эквайринг (Monobank, LiqPay, ЮKassa) и зачисляйте
    # баланс только из вебхука платёжной системы, а не из этого маршрута.
    body = await read_json(request)
    user_id, amount = body.get("user_id"), body.get("amount")
    if not user_id or not amount or float(amount) <= 0:
        return web.json_response({"error": "Некорректная сумма"}, status=400)
    profile = await add_balance(user_id, amount)
    return web.json_response({"ok": True, "balance": profile["balance"], "method": body.get("method")})


async def h_promo_check(request):
    promo = await check_promo(request.query.get("code", ""))
    if not promo:
        return web.json_response({"valid": False})
    return web.json_response({"valid": True, "discount": promo["discount"], "code": promo["code"]})


async def h_checkout(request):
    body = await read_json(request)
    user_id = body.get("user_id")
    if not user_id:
        return web.json_response({"error": "user_id обязателен"}, status=400)
    try:
        order = await create_order(
            user_id, body.get("delivery_method"), body.get("city"), body.get("promo_code")
        )
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)

    asyncio.create_task(notify_admins_new_order(order))
    return web.json_response({"order_id": order["id"], "total": order["total"]})


async def h_referral_register(request):
    body = await read_json(request)
    inviter_id, user_id = body.get("inviter_id"), body.get("user_id")
    if not inviter_id or not user_id:
        return web.json_response({"error": "inviter_id и user_id обязательны"}, status=400)
    inviter = await register_referral(inviter_id, user_id)
    return web.json_response({"ok": True, "inviter": inviter})


@admin_only
async def h_admin_products(request):
    return web.json_response(await get_products(), dumps=dumps)


@admin_only
async def h_admin_product_add(request):
    product = await add_product(await read_json(request))
    schedule_products_cache_invalidation()
    return web.json_response(product, dumps=dumps)


@admin_only
async def h_admin_product_update(request):
    updated = await update_product(int(request.match_info["id"]), await read_json(request))
    if not updated:
        return web.json_response({"error": "Товар не найден"}, status=404)
    schedule_products_cache_invalidation()
    return web.json_response(updated, dumps=dumps)


@admin_only
async def h_admin_product_delete(request):
    await delete_product(int(request.match_info["id"]))
    schedule_products_cache_invalidation()
    return web.json_response({"ok": True})


@admin_only
async def h_admin_upload(request):
    """Приём фото товара из админки — сохраняем в public/uploads/."""
    reader = await request.multipart()
    field = await reader.next()
    while field is not None and field.name != "photo":
        field = await reader.next()
    if field is None:
        return web.json_response({"error": "Файл не получен"}, status=400)

    content_type = field.headers.get("Content-Type", "")
    if not content_type.startswith("image/"):
        return web.json_response({"error": "Файл должен быть изображением"}, status=400)

    ext = os.path.splitext(field.filename or "")[1] or ".jpg"
    if ext.lower() not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        ext = ".jpg"
    filename = f"product_{uuid.uuid4().hex}{ext}"
    path = UPLOADS_DIR / filename

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    size = 0
    with open(path, "wb") as f:
        while chunk := await field.read_chunk():
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                f.close()
                path.unlink(missing_ok=True)
                return web.json_response({"error": "Файл больше 8 МБ"}, status=400)
            f.write(chunk)

    return web.json_response({"url": f"/uploads/{filename}"})


@admin_only

@admin_only
async def h_admin_export_orders(request):
    orders = await get_all_orders()
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(["ID заказа", "Дата", "User ID", "Сумма", "Статус", "Способ доставки", "Город", "Промокод", "Товары"])
    for order in orders:
        items = ", ".join(f"{item['name']} × {item['qty']} ({item['price']}€)" for item in order["items"])
        writer.writerow([order["id"], order["created_at"], order["user_id"], order["total"], order["status"], order["delivery_method"] or "", order["city"] or "", order["promo_code"] or "", items])
    csv_bytes = ("\ufeff" + output.getvalue()).encode("utf-8")
    return web.Response(body=csv_bytes, content_type="text/csv", headers={"Content-Disposition": 'attachment; filename="orders.csv"', "Cache-Control": "no-store"})

@admin_only
async def h_admin_orders(request):
    return web.json_response(await get_all_orders())


@admin_only
async def h_admin_order_status(request):
    body = await read_json(request)
    status = body.get("status")
    order = await update_order_status(int(request.match_info["id"]), status)
    if not order:
        return web.json_response({"error": "Заказ не найден"}, status=404)

    # Бонус пригласившему начисляется один раз на заказ — даже если статус
    # переключали туда-обратно несколько раз.
    if status == "Выполнен":
        try:
            reward = await reward_referral(order["user_id"], order["total"], REFERRAL_PERCENT, order["id"])
            if reward:
                await notify_referral_bonus(reward, order["id"])
        except Exception as e:
            log.error("Рефералка: %s", e)

    asyncio.create_task(notify_customer_status(order))
    return web.json_response(order)


@admin_only
async def h_admin_promos(request):
    return web.json_response(await get_promos())


@admin_only
async def h_admin_promo_add(request):
    body = await read_json(request)
    if not body.get("code") or not body.get("discount"):
        return web.json_response({"error": "Укажите код и скидку"}, status=400)
    return web.json_response(await add_promo(body["code"], body["discount"]))


@admin_only
async def h_admin_promo_toggle(request):
    promo = await toggle_promo(int(request.match_info["id"]))
    if not promo:
        return web.json_response({"error": "Промокод не найден"}, status=404)
    return web.json_response(promo)


@admin_only
async def h_admin_promo_delete(request):
    await delete_promo(int(request.match_info["id"]))
    return web.json_response({"ok": True})


@admin_only
async def h_admin_stats(request):
    return web.json_response(await get_stats())


@admin_only
async def h_admin_referrals(request):
    return web.json_response(await get_top_referrers(20))


# ── справочники: категории товаров и города самовывоза ──────────
# Обе таблицы устроены одинаково (id + уникальное имя), поэтому
# обработчики общие, а конкретная таблица приходит параметром.

async def _dict_list(table: str) -> list[dict]:
    rows = await pool.fetch(f"SELECT id, name FROM {table} ORDER BY name")
    return [dict(r) for r in rows]


async def _dict_add(table: str, name: str) -> dict | None:
    name = (name or "").strip()
    if not name:
        raise ValueError("Название не может быть пустым")
    if len(name) > 60:
        raise ValueError("Слишком длинное название")
    row = await pool.fetchrow(
        f"""INSERT INTO {table} (name) VALUES ($1)
            ON CONFLICT (name) DO NOTHING RETURNING id, name""",
        name,
    )
    if row is None:
        raise ValueError("Такая запись уже есть")
    return dict(row)


@admin_only
async def h_admin_categories(request):
    return web.json_response(await _dict_list("categories"))


@admin_only
async def h_admin_category_add(request):
    body = await read_json(request)
    return web.json_response(await _dict_add("categories", body.get("name")))


@admin_only
async def h_admin_category_delete(request):
    cid = int(request.match_info["id"])
    name = await pool.fetchval("SELECT name FROM categories WHERE id = $1", cid)
    if name is None:
        return web.json_response({"error": "Категория не найдена"}, status=404)
    # У товаров этой категории просто очищаем поле — сами товары остаются.
    async with pool.acquire() as c:
        async with c.transaction():
            await c.execute("UPDATE products SET category = '' WHERE category = $1", name)
            await c.execute("DELETE FROM categories WHERE id = $1", cid)
    return web.json_response({"ok": True})


@admin_only
async def h_admin_cities(request):
    return web.json_response(await _dict_list("cities"))


@admin_only
async def h_admin_city_add(request):
    body = await read_json(request)
    return web.json_response(await _dict_add("cities", body.get("name")))


@admin_only
async def h_admin_city_delete(request):
    cid = int(request.match_info["id"])
    deleted = await pool.execute("DELETE FROM cities WHERE id = $1", cid)
    if deleted.endswith("0"):
        return web.json_response({"error": "Город не найден"}, status=404)
    return web.json_response({"ok": True})


async def h_admin_verify(request):
    body = await read_json(request)
    return web.json_response({"ok": body.get("code", "") == ADMIN_CODE})



async def h_product_recommendations(request):
    try:
        product_id = int(request.match_info["id"])
    except ValueError:
        return web.json_response({"error": "Некоректний ID товару"}, status=400)
    query = """
        SELECT p.id, p.name, p.price, p.category, p.photo, COUNT(oi2.id) AS co_purchases
        FROM order_items oi1
        JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id != oi2.product_id
        JOIN products p ON p.id = oi2.product_id
        WHERE oi1.product_id = $1
        GROUP BY p.id ORDER BY co_purchases DESC LIMIT 3
    """
    rows = await pool.fetch(query, product_id)
    return web.json_response([dict(r) for r in rows], dumps=dumps)

async def h_health(request):
    await pool.fetchval("SELECT 1")
    return web.json_response({"ok": True})


async def h_index(request):
    return web.FileResponse(PUBLIC_DIR / "index.html")


def dumps(obj) -> str:
    """json.dumps, умеющий в datetime (в товарах есть created_at)."""
    return json.dumps(obj, ensure_ascii=False, default=lambda o: o.isoformat())


def build_app() -> web.Application:
    app = web.Application(middlewares=[cors_middleware, error_middleware, rate_limiting_middleware], client_max_size=MAX_UPLOAD_BYTES + 1024)
    app.add_routes([
        web.get("/api/products", h_products),
        web.get("/api/products/{id}/recommendations", h_product_recommendations),
        web.get("/api/cities", h_cities),
        web.get("/api/categories", h_categories),
        web.get("/api/reviews", h_reviews),
        web.get("/api/cart", h_cart_get),
        web.post("/api/cart", h_cart_post),
        web.get("/api/orders", h_orders),
        web.get("/api/profile", h_profile),
        web.post("/api/topup", h_topup),
        web.get("/api/promo/check", h_promo_check),
        web.post("/api/checkout", h_checkout),
        web.post("/api/referral/register", h_referral_register),
        web.get("/api/health", h_health),

        web.get("/api/admin/products", h_admin_products),
        web.post("/api/admin/products", h_admin_product_add),
        web.put("/api/admin/products/{id}", h_admin_product_update),
        web.delete("/api/admin/products/{id}", h_admin_product_delete),
        web.post("/api/admin/upload", h_admin_upload),
        web.get("/api/admin/orders", h_admin_orders),
        web.get("/api/admin/export/orders", h_admin_export_orders),
        web.patch("/api/admin/orders/{id}", h_admin_order_status),
        web.get("/api/admin/promo", h_admin_promos),
        web.post("/api/admin/promo", h_admin_promo_add),
        web.patch("/api/admin/promo/{id}", h_admin_promo_toggle),
        web.delete("/api/admin/promo/{id}", h_admin_promo_delete),
        web.get("/api/admin/stats", h_admin_stats),
        web.get("/api/admin/referrals", h_admin_referrals),
        web.get("/api/admin/categories", h_admin_categories),
        web.post("/api/admin/categories", h_admin_category_add),
        web.delete("/api/admin/categories/{id}", h_admin_category_delete),
        web.get("/api/admin/cities", h_admin_cities),
        web.post("/api/admin/cities", h_admin_city_add),
        web.delete("/api/admin/cities/{id}", h_admin_city_delete),
        web.post("/api/admin/verify", h_admin_verify),

        web.get("/", h_index),
    ])
    if PUBLIC_DIR.exists():
        app.router.add_static("/", PUBLIC_DIR, show_index=False)
    return app


# ──────────────────────────── бот ────────────────────────────

bot = None  # заполняется в main(), если задан BOT_TOKEN


async def notify_admins_new_order(order: dict) -> None:
    if not bot or not ADMIN_IDS:
        return
    lines = [f"🛒 Новый заказ №{order['id']} на {order['total']}€"]
    for i in order["items"]:
        lines.append(f"• {i['name']} × {i['qty']}")
    if order.get("city"):
        lines.append(f"Город: {order['city']}")
    if order.get("delivery_method"):
        lines.append(f"Доставка: {order['delivery_method']}")
    lines.append(f"Покупатель: {order['user_id']}")
    text = "\n".join(lines)
    for admin_id in ADMIN_IDS:
        try:
            await bot.send_message(admin_id, text)
        except Exception as e:
            log.warning("Не смог написать админу %s: %s", admin_id, e)


async def notify_customer_status(order: dict) -> None:
    if not bot:
        return
    try:
        await bot.send_message(
            order["user_id"], f"Заказ №{order['id']}: статус изменён на «{order['status']}»"
        )
    except Exception:
        pass  # пользователь мог заблокировать бота — это не ошибка


async def notify_referral_bonus(reward: dict, order_id: int) -> None:
    if not bot:
        return
    try:
        await bot.send_message(
            reward["inviterId"],
            f"💸 Реферальный бонус {reward['bonus']}€ за заказ №{order_id} приглашённого друга",
        )
    except Exception:
        pass


def build_dispatcher():
    from aiogram import Dispatcher, F
    from aiogram.filters import CommandStart, CommandObject
    from aiogram.types import (
        InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo,
    )

    dp = Dispatcher()

    def shop_keyboard() -> InlineKeyboardMarkup | None:
        if not WEBAPP_URL:
            return None
        return InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="🛍 Открыть магазин", web_app=WebAppInfo(url=WEBAPP_URL))
        ]])

    @dp.message(CommandStart())
    async def cmd_start(message: Message, command: CommandObject):
        user = message.from_user
        await get_profile(str(user.id), user.first_name, user.username)

        # Реферальная ссылка вида t.me/бот?start=ref_123
        payload = command.args or ""
        if payload.startswith("ref_"):
            inviter_id = payload[4:]
            if inviter_id.isdigit():
                inviter = await register_referral(inviter_id, str(user.id))
                if inviter:
                    log.info("Реферал: %s пригласил %s", inviter_id, user.id)

        await message.answer(
            f"Привет, {user.first_name or 'друг'}! 👋\n\n"
            "Это магазин Smoke Lab. Открывай каталог кнопкой ниже — "
            "там корзина, заказы, баланс и твоя реферальная ссылка."
            + ("" if WEBAPP_URL else "\n\n⚠️ Не задан WEBAPP_URL — кнопка магазина недоступна."),
            reply_markup=shop_keyboard(),
        )

    @dp.message(F.text == "/balance")
    async def cmd_balance(message: Message):
        profile = await get_profile(str(message.from_user.id))
        await message.answer(
            f"Баланс: {profile['balance']}€\n"
            f"Приглашено друзей: {profile['invited_count']}\n"
            f"Заработано с рефералов: {profile['ref_earned']}€\n\n"
            f"Твоя ссылка: https://t.me/{BOT_USERNAME}?start=ref_{message.from_user.id}"
        )

    @dp.message(F.text == "/myorders")
    async def cmd_orders(message: Message):
        orders = await get_orders(str(message.from_user.id))
        if not orders:
            await message.answer("Заказов пока нет.", reply_markup=shop_keyboard())
            return
        lines = ["Твои последние заказы:"]
        for o in orders[:10]:
            lines.append(f"№{o['id']} · {o['date']} · {o['total']}€ · {o['status']}")
        await message.answer("\n".join(lines), reply_markup=shop_keyboard())

    return dp


# ──────────────── перенос старых данных из data/db.json ────────────────

def parse_ru_date(value: str) -> datetime:
    """'20.08.2026' → datetime (полдень, чтобы не съезжало из-за часового пояса)."""
    if value:
        m = re.match(r"^(\d{1,2})\.(\d{1,2})\.(\d{4})$", str(value))
        if m:
            return datetime(int(m[3]), int(m[2]), int(m[1]), 12, 0, tzinfo=SHOP_TZ)
    return datetime.now(SHOP_TZ)


async def import_json(file_path: str, force: bool = False) -> None:
    """Перенос из старого файлового хранилища. Одна транзакция: при ошибке
    база останется нетронутой, исходный db.json не меняется."""
    global pool
    path = Path(file_path)
    if not path.exists():
        log.error("Файл не найден: %s", path)
        sys.exit(1)

    data = json.loads(path.read_text(encoding="utf-8"))
    pool = await connect_db()
    await init_db(seed=False)

    done = await pool.fetchval("SELECT value FROM meta WHERE key = 'imported_json'")
    if done and not force:
        print(f"Перенос уже выполнялся {done}. Повторно: python bot.py import-json --force")
        await pool.close()
        return

    counts = dict(products=0, cities=0, reviews=0, promos=0, profiles=0, carts=0, orders=0)

    async with pool.acquire() as c:
        async with c.transaction():
            for p in data.get("products", []):
                r = await c.execute(
                    """INSERT INTO products (id, name, description, price, category,
                                             is_liquid, is_hit, stock, photo)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING""",
                    p["id"], p["name"], p.get("description") or "", int(p.get("price") or 0),
                    p.get("category") or "", bool(p.get("is_liquid")), bool(p.get("is_hit")),
                    p.get("stock") is not False, p.get("photo"),
                )
                counts["products"] += 0 if r.endswith("0") else 1

            for city in data.get("cities", []):
                r = await c.execute(
                    "INSERT INTO cities (id, name) VALUES ($1,$2) ON CONFLICT DO NOTHING",
                    city["id"], city["name"],
                )
                counts["cities"] += 0 if r.endswith("0") else 1

            for rev in data.get("reviews", []):
                r = await c.execute(
                    "INSERT INTO reviews (id, rating, text, date) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING",
                    rev["id"], rev["rating"], rev.get("text") or "", rev.get("date") or "",
                )
                counts["reviews"] += 0 if r.endswith("0") else 1

            for promo in data.get("promos", []):
                r = await c.execute(
                    "INSERT INTO promos (id, code, discount, active) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING",
                    promo["id"], str(promo["code"]).upper(), promo["discount"],
                    promo.get("active") is not False,
                )
                counts["promos"] += 0 if r.endswith("0") else 1

            # Профили в два прохода: сначала все записи, потом связи invited_by,
            # иначе внешний ключ упрётся в ещё не созданного пригласившего.
            profiles = list(data.get("profiles", {}).items())
            for uid, p in profiles:
                r = await c.execute(
                    """INSERT INTO profiles (telegram_id, first_name, username,
                                             balance, invited_count, ref_earned)
                       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (telegram_id) DO NOTHING""",
                    str(uid), p.get("first_name"), p.get("username"),
                    round(p.get("balance") or 0), int(p.get("invited_count") or 0),
                    round(p.get("ref_earned") or 0),
                )
                counts["profiles"] += 0 if r.endswith("0") else 1

            for uid, p in profiles:
                if not p.get("invited_by"):
                    continue
                await c.execute(
                    "INSERT INTO profiles (telegram_id) VALUES ($1) ON CONFLICT DO NOTHING",
                    str(p["invited_by"]),
                )
                await c.execute(
                    "UPDATE profiles SET invited_by = $2 WHERE telegram_id = $1 AND invited_by IS NULL",
                    str(uid), str(p["invited_by"]),
                )

            for uid, cart in (data.get("carts") or {}).items():
                for item in (cart or {}).get("items", []):
                    if not await c.fetchval("SELECT 1 FROM products WHERE id = $1", item["product_id"]):
                        continue  # товар давно удалён — пропускаем строку корзины
                    r = await c.execute(
                        """INSERT INTO cart_items (user_id, product_id, qty) VALUES ($1,$2,$3)
                           ON CONFLICT (user_id, product_id) DO NOTHING""",
                        str(uid), item["product_id"], max(1, int(item.get("qty") or 1)),
                    )
                    counts["carts"] += 0 if r.endswith("0") else 1

            for o in data.get("orders", []):
                r = await c.execute(
                    """INSERT INTO orders (id, user_id, total, status, delivery_method,
                                           city, promo_code, created_at)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING""",
                    o["id"], str(o["user_id"]), round(o.get("total") or 0), o.get("status") or "Новый",
                    o.get("delivery_method"), o.get("city"), o.get("promo_code"),
                    parse_ru_date(o.get("date")),
                )
                if r.endswith("0"):
                    continue
                counts["orders"] += 1
                for item in o.get("items", []):
                    await c.execute(
                        """INSERT INTO order_items (order_id, product_id, name, price, qty)
                           VALUES ($1,$2,$3,$4,$5)""",
                        o["id"], item.get("product_id"), item["name"],
                        round(item.get("price") or 0), int(item.get("qty") or 1),
                    )

            # Сдвигаем счётчики id, чтобы новые записи не конфликтовали с перенесёнными
            for table, start in [("products", 1), ("cities", 1), ("reviews", 1),
                                 ("promos", 1), ("orders", 1001), ("order_items", 1)]:
                await c.execute(
                    f"""SELECT setval(pg_get_serial_sequence('{table}', 'id'),
                               GREATEST((SELECT COALESCE(MAX(id), 0) FROM {table}), {start - 1}))"""
                )

            await c.execute(
                "INSERT INTO meta (key, value) VALUES ('seeded', now()::text) ON CONFLICT (key) DO NOTHING"
            )
            await c.execute(
                """INSERT INTO meta (key, value) VALUES ('imported_json', now()::text)
                   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"""
            )

    print("Перенос завершён:")
    for key, title in [("products", "товаров"), ("cities", "городов"), ("reviews", "отзывов"),
                       ("promos", "промокодов"), ("profiles", "профилей"),
                       ("carts", "позиций в корзинах"), ("orders", "заказов")]:
        print(f"  {title:22} {counts[key]}")
    print(f"\nИсходный {path.name} не изменён — сохраните его как бэкап.")
    await pool.close()


# ──────────────────────────── запуск ────────────────────────────

async def run() -> None:
    global pool, bot, redis

    pool = await connect_db()
    await init_db()
    log.info("Подключение к PostgreSQL установлено")

    if REDIS_URL:
        try:
            redis = aioredis.from_url(REDIS_URL, decode_responses=True, max_connections=20)
            await redis.ping()
            log.info("Redis подключён: %s", REDIS_URL)
        except Exception as e:
            log.warning("Redis недоступен (%s) — работаем без кеша", e)
            redis = None
    else:
        log.info("REDIS_URL не задан — кеш каталога выключен")

    if ADMIN_CODE == "0000":
        log.warning("Админ-код по умолчанию 0000 — смените переменную ADMIN_CODE!")

    runner = web.AppRunner(build_app())
    await runner.setup()
    await web.TCPSite(runner, "0.0.0.0", PORT).start()
    log.info("Сервер запущен на порту %s", PORT)

    if not BOT_TOKEN:
        log.warning("BOT_TOKEN не задан — работает только веб-часть, бот выключен")
        await asyncio.Event().wait()
        return

    from aiogram import Bot
    from aiogram.client.default import DefaultBotProperties

    bot = Bot(BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
    dp = build_dispatcher()
    me = await bot.get_me()
    log.info("Бот запущен: @%s", me.username)

    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()
        await runner.cleanup()
        if redis is not None:
            try:
                await redis.aclose()
            except AttributeError:  # legacy aioredis
                await redis.close()
        await pool.close()


def main() -> None:
    args = sys.argv[1:]

    if args and args[0] == "import-json":
        rest = [a for a in args[1:] if not a.startswith("--")]
        file_path = rest[0] if rest else str(BASE_DIR / "data" / "db.json")
        asyncio.run(import_json(file_path, force="--force" in args))
        return

    try:
        asyncio.run(run())
    except (KeyboardInterrupt, SystemExit):
        log.info("Остановлено")


if __name__ == "__main__":
    main()
