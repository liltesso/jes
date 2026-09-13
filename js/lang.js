// Script block 2
// ─────────────────── i18n & Core Helpers ───────────────────
let CURRENT_LANG = new URLSearchParams(window.location.search).get('lang') || localStorage.getItem('lang') || 'ru';
localStorage.setItem('lang', CURRENT_LANG);

const TRANSLATIONS = {
  ru: {
    home: "Главная", catalog: "Товары", cart: "Корзина", profile: "Профиль", history: "История",
    best_shop: "ЛУЧШИЙ МАГАЗИН", best_shop_desc: "прямо под рукой", order_button: "ЗАКАЗАТЬ",
    info_text: "Проверенные товары, аккуратная упаковка и нормальное состояние при получении.",
    payment_title: "ОПЛАТА", payment_desc: "Принимаем разные варианты оплаты. Детали уточняются при оформлении.",
    cash: "💵 Наличные", card: "💳 Банковская карта",
    reviews_title: "ОТЗЫВЫ ПОКУПАТЕЛЕЙ", reviews_empty: "Пока нет отзывов",
    nav_title: "НАВИГАЦИЯ", nav_about: "О нас", nav_reviews: "Отзывы", nav_tg: "Наш Telegram",
    better_title: "МЫ ПРОСТО ЛУЧШЕ ДРУГИХ",
    catalog_title: "Каталог", catalog_subtitle: "Товары в наличии", search_placeholder: "Поиск товара...", catalog_empty: "Ничего не найдено",
    cart_title: "Корзина", cart_subtitle: "Проверь заказ и примени промокод",
    cart_tg_req: "Откройте магазин через кнопку в боте Telegram — тогда корзина и заказы будут привязаны к вашему аккаунту.",
    cart_empty: "Корзина пустая",
    checkout_action: "Оформить заказ", checkout_title: "Оформление", checkout_subtitle: "Выберите способ получения",
    pickup: "🚶 Самовывоз", delivery: "🚚 Доставка", pickup_city: "Город самовывоза", delivery_addr: "Адрес доставки",
    addr_placeholder: "Улица, дом, квартира", confirm_order: "Подтвердить заказ", cancel: "Отмена",
    promo_title: "Промокод", promo_apply: "Применить", sum: "Сумма", discount: "Скидка", total: "Итого:",
    profile_title: "Профиль", profile_subtitle: "Ваши данные и бонусы",
    profile_tg_req: "Откройте магазин через кнопку в боте Telegram, чтобы увидеть профиль.",
    balance: "Баланс / бонусы", topup: "Пополнить баланс", invited: "Приглашено", ref_link: "Реферальная ссылка",
    history_title: "История", history_subtitle: "Ваши заказы",
    history_tg_req: "Откройте магазин через кнопку в боте Telegram, чтобы увидеть историю заказов.",
    history_empty: "Заказов пока нет",
    added: "Добавлено", add: "Добавить", buy_now: "Купить сейчас", out_of_stock: "Нет в наличии",
    in_stock_pill: "Есть в наличии", out_of_stock_pill: "Нет в наличии",
    all_cats: "Все", offline_msg: "Вы в офлайне. Заказы недоступны."
  },
  de: {
    home: "Start", catalog: "Produkte", cart: "Warenkorb", profile: "Profil", history: "Verlauf",
    best_shop: "DER BESTE SHOP", best_shop_desc: "immer griffbereit", order_button: "BESTELLEN",
    info_text: "Geprüfte Produkte, sorgfältige Verpackung und perfekter Zustand bei Lieferung.",
    payment_title: "ZAHLUNG", payment_desc: "Wir akzeptieren verschiedene Zahlungsmethoden. Details beim Checkout.",
    cash: "💵 Bargeld", card: "💳 Bankkarte",
    reviews_title: "KUNDENBEWERTUNGEN", reviews_empty: "Noch keine Bewertungen",
    nav_title: "NAVIGATION", nav_about: "Über uns", nav_reviews: "Bewertungen", nav_tg: "Unser Telegram",
    better_title: "WIR SIND EINFACH BESSER",
    catalog_title: "Katalog", catalog_subtitle: "Verfügbare Produkte", search_placeholder: "Produkt suchen...", catalog_empty: "Nichts gefunden",
    cart_title: "Warenkorb", cart_subtitle: "Bestellung prüfen und Rabattcode anwenden",
    cart_tg_req: "Öffnen Sie den Shop über den Telegram-Bot, um den Warenkorb und Ihre Bestellungen zu verknüpfen.",
    cart_empty: "Warenkorb ist leer",
    checkout_action: "Bestellung aufgeben", checkout_title: "Bestellvorgang", checkout_subtitle: "Empfangsmethode wählen",
    pickup: "🚶 Abholung", delivery: "🚚 Lieferung", pickup_city: "Abholort", delivery_addr: "Lieferadresse",
    addr_placeholder: "Straße, Hausnummer, Wohnung", confirm_order: "Bestellung bestätigen", cancel: "Abbrechen",
    promo_title: "Rabattcode", promo_apply: "Anwenden", sum: "Summe", discount: "Rabatt", total: "Gesamt:",
    profile_title: "Profil", profile_subtitle: "Ihre Daten und Boni",
    profile_tg_req: "Öffnen Sie den Shop über den Telegram-Bot, um Ihr Profil zu sehen.",
    balance: "Guthaben / Boni", topup: "Guthaben aufladen", invited: "Eingeladen", ref_link: "Empfehlungslink",
    history_title: "Verlauf", history_subtitle: "Ihre Bestellungen",
    history_tg_req: "Öffnen Sie den Shop über den Telegram-Bot, um Ihren Bestellverlauf zu sehen.",
    history_empty: "Noch keine Bestellungen",
    added: "Hinzugefügt", add: "Hinzufügen", buy_now: "Jetzt kaufen", out_of_stock: "Nicht auf Lager",
    in_stock_pill: "Auf Lager", out_of_stock_pill: "Nicht auf Lager",
    all_cats: "Alle", offline_msg: "Sie sind offline. Bestellungen nicht möglich."
  }
};

function t(key) {
  const lang = CURRENT_LANG || 'ru';
  if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) return TRANSLATIONS[lang][key];
  if (TRANSLATIONS.ru && TRANSLATIONS.ru[key]) return TRANSLATIONS.ru[key];
  return key;
}

function toggleLang() {
  CURRENT_LANG = (CURRENT_LANG === 'ru' ? 'de' : 'ru');
  localStorage.setItem('lang', CURRENT_LANG);
  updateLangBtn();
  renderTabbar();
  render();
}

function updateLangBtn() {
  const btn = document.getElementById('langSwitchBtn');
  if (btn) btn.innerText = CURRENT_LANG === 'ru' ? '🇷🇺 RU' : '🇩🇪 DE';
  const offText = document.getElementById('offline-banner-text');
  if (offText) offText.innerText = t('offline_msg');
}

