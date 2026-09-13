// ─────────────────── admin panel ───────────────────
// Все данные админки (товары/заказы/промокоды/статистика/рефералы) теперь читаются
// и сохраняются через реальный API вашего сервера (/api/admin/...), а не только в браузере.
// Доступ защищён кодом администратора (ADMIN_CODE на сервере, по умолчанию 0000) —
// для боевого использования замените на проверку telegram user id (profile.is_admin).

let ADMIN_CODE = null;   // код, введённый администратором — используется в заголовке x-admin-code
let ADMIN_PROMOS = [];
let ADMIN_REFERRALS = [];
let ADMIN_ORDERS = [];
let ADMIN_CATEGORIES = [];
let ADMIN_CITIES = [];
let ADMIN_STATS = { revenueByDay: [0,0,0,0,0,0,0], ordersByDay: [0,0,0,0,0,0,0], labels: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"], totalRevenue: 0, totalOrders: 0, avgCheck: 0 };

async function adminApi(path, opts) {
  const url = window.BACKEND_URL + path;
  const res = await fetch(url, {
    ...opts,
    headers: { 
      ...(opts && opts.headers), 
      "x-admin-code": ADMIN_CODE,
      "Bypass-Tunnel-Reminder": "true",
      "ngrok-skip-browser-warning": "true"
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Ошибка сервера");
  return res.json();
}

async function openAdminGate() {
  if (state.adminOpen) { closeAdmin(); return; }
  const pin = prompt("Код администратора:");
  if (pin === null) return;
  try {
    const check = await api("/api/admin/verify", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: pin }),
    });
    if (!check.ok) { alert("Неверный код администратора"); return; }
  } catch (e) {
    alert("Не удалось связаться с сервером. Убедитесь, что backend запущен.");
    return;
  }
  ADMIN_CODE = pin;
  state.adminOpen = true;
  state.adminTab = "products";
  state.adminEditing = null;
  document.getElementById("adminOverlay").style.display = "flex";
  await setAdminTab("products");
}

function closeAdmin() {
  state.adminOpen = false;
  document.getElementById("adminOverlay").style.display = "none";
}

async function setAdminTab(id) {
  state.adminTab = id;
  state.adminEditing = null;
  renderAdmin(true);
  try {
    if (id === "products") { await loadCatalog(); ADMIN_CATEGORIES = await adminApi("/api/admin/categories"); }
    if (id === "categories") ADMIN_CATEGORIES = await adminApi("/api/admin/categories");
    if (id === "cities") ADMIN_CITIES = await adminApi("/api/admin/cities");
    if (id === "orders") ADMIN_ORDERS = await adminApi("/api/admin/orders");
    if (id === "promo") ADMIN_PROMOS = await adminApi("/api/admin/promo");
    if (id === "stats") ADMIN_STATS = await adminApi("/api/admin/stats");
    if (id === "referral") ADMIN_REFERRALS = await adminApi("/api/admin/referrals");
  } catch (e) {
    console.error(e);
  }
  renderAdmin();
}

const ADMIN_TABS = [
  { id: "products", label: "Товары", icon: "🛍" },
  { id: "categories", label: "Категории", icon: "🗂" },
  { id: "cities", label: "Города", icon: "📍" },
  { id: "orders", label: "Заказы", icon: "📦" },
  { id: "stats", label: "Статистика", icon: "📊" },
  { id: "promo", label: "Промокоды", icon: "🏷" },
  { id: "referral", label: "Рефералка", icon: "👥" },
];

function renderAdmin(loading) {
  const el = document.getElementById("adminOverlay");
  let content = loading ? `<div style="padding:60px 20px;text-align:center;color:rgba(255,255,255,0.3);">Загрузка…</div>` : "";
  if (!loading) {
    if (state.adminTab === "products") content = adminProductsScreen();
    if (state.adminTab === "categories") content = adminCategoriesScreen();
    if (state.adminTab === "cities") content = adminCitiesScreen();
    if (state.adminTab === "orders") content = adminOrdersScreen();
    if (state.adminTab === "stats") content = adminStatsScreen();
    if (state.adminTab === "promo") content = adminPromoScreen();
    if (state.adminTab === "referral") content = adminReferralScreen();
  }

  el.innerHTML = `
    <div class="tg-header">
      <span class="close" onclick="closeAdmin()">Закрыть</span>
      <div class="title"><div class="txt"><b>Админ-панель</b><span>Smoke Lab</span></div></div>
      <div style="width:28px;"></div>
    </div>
    <div class="px5 no-scroll" style="display:flex;gap:8px;padding:14px 20px;overflow-x:auto;background:rgba(17,17,22,0.6);border-bottom:1px solid rgba(255,255,255,0.06);">
      ${ADMIN_TABS.map(t => `
        <button onclick="setAdminTab('${t.id}')" style="flex-shrink:0;white-space:nowrap;border-radius:999px;padding:9px 14px;font-size:13px;font-weight:700;border:1px solid ${state.adminTab===t.id ? "#c026d3" : "rgba(255,255,255,0.15)"};background:${state.adminTab===t.id ? "linear-gradient(90deg,#c026d3,#7c3aed)" : "transparent"};color:#fff;cursor:pointer;">${t.icon} ${t.label}</button>
      `).join("")}
    </div>
    <div class="no-scroll" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;">${content}</div>
  `;
}

function adminProductsScreen() {
  if (state.adminEditing) return adminProductForm(state.adminEditing);
  return `
    <div style="padding:20px;">
      <button class="btn btn-primary" style="margin-bottom:16px;" onclick="state.adminEditing = {isNew:true, id: null, nameObj:{ru:'', de:''}, descObj:{ru:'', de:''}, price:'', category:'', stock:true, is_hit:false, photo:null}; renderAdmin();">+ Добавить товар</button>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${PRODUCTS.map(p => `
          <div class="card" style="display:flex;gap:12px;padding:12px;align-items:center;">
            <div style="width:56px;height:56px;border-radius:12px;overflow:hidden;flex-shrink:0;background:${gradFor(p.id)};display:flex;align-items:center;justify-content:center;">
              ${p.photo ? `<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:22px;">🧴</span>`}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${getName(p)}</div>
              <div style="color:rgba(255,255,255,0.4);font-size:12.5px;">${p.price}€ · ${p.stock ? "в наличии" : "нет в наличии"}</div>
            </div>
            <button onclick="adminEditProduct(${p.id})" style="width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.08);border:none;color:#fff;flex-shrink:0;">✎</button>
            <button onclick="adminDeleteProduct(${p.id})" style="width:34px;height:34px;border-radius:10px;background:rgba(248,113,113,0.15);border:none;color:#f87171;flex-shrink:0;">🗑</button>
          </div>
        `).join("") || `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px 0;">Товаров пока нет</div>`}
      </div>
    </div>
  `;
}

function adminEditProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (p) { 
    state.adminEditing = Object.assign({}, p);
    try { state.adminEditing.nameObj = typeof p.name === 'string' ? JSON.parse(p.name) : p.name; } catch(e) { state.adminEditing.nameObj = {ru: p.name||'', de:''}; }
    try { state.adminEditing.descObj = typeof p.description === 'string' ? JSON.parse(p.description) : p.description; } catch(e) { state.adminEditing.descObj = {ru: p.description||'', de:''}; }
    if (!state.adminEditing.nameObj) state.adminEditing.nameObj = {ru:'', de:''};
    if (!state.adminEditing.descObj) state.adminEditing.descObj = {ru:'', de:''};
    renderAdmin(); 
  }
}

async function adminDeleteProduct(id) {
  if (!confirm("Удалить товар?")) return;
  try {
    await adminApi(`/api/admin/products/${id}`, { method: "DELETE" });
    await loadCatalog();
    renderAdmin();
  } catch (e) { alert("Не получилось удалить: " + e.message); }
}

function adminProductForm(p) {
  return `
    <div style="padding:20px;">
      <div style="font-weight:800;font-size:18px;margin-bottom:16px;">${p.isNew ? "Новый товар" : "Редактировать товар"}</div>

      <div style="margin-bottom:14px;">
        <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">Фото товара</div>
        <label style="display:block;cursor:pointer;">
          <div style="height:160px;border-radius:16px;overflow:hidden;background:${gradFor(p.id||1)};display:flex;align-items:center;justify-content:center;border:1px dashed rgba(255,255,255,0.25);">
            ${p.photo ? `<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="text-align:center;color:rgba(255,255,255,0.5);font-size:13px;">📷 Загрузить фото</div>`}
          </div>
          <input type="file" accept="image/*" style="display:none;" onchange="adminPhotoSelected(event)">
        </label>
        <div id="photoUploadStatus" style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="card" style="padding:12px 16px;"><input placeholder="Название (RU)" value="${(p.nameObj||{}).ru||""}" oninput="state.adminEditing.nameObj.ru=this.value" style="width:100%;font-size:14.5px;"></div>
        <div class="card" style="padding:12px 16px;"><input placeholder="Название (DE)" value="${(p.nameObj||{}).de||""}" oninput="state.adminEditing.nameObj.de=this.value" style="width:100%;font-size:14.5px;"></div>
        <div class="card" style="padding:12px 16px;"><input placeholder="Описание (RU)" value="${(p.descObj||{}).ru||""}" oninput="state.adminEditing.descObj.ru=this.value" style="width:100%;font-size:14.5px;"></div>
        <div class="card" style="padding:12px 16px;"><input placeholder="Описание (DE)" value="${(p.descObj||{}).de||""}" oninput="state.adminEditing.descObj.de=this.value" style="width:100%;font-size:14.5px;"></div>
        <div style="display:flex;gap:10px;">
          <div class="card" style="padding:12px 16px;flex:1;"><input type="number" placeholder="Цена €" value="${p.price||""}" oninput="state.adminEditing.price=this.value" style="width:100%;font-size:14.5px;"></div>
          <div class="card" style="padding:12px 16px;flex:1;">
            <select onchange="state.adminEditing.category=this.value" style="width:100%;font-size:14.5px;background:transparent;border:none;outline:none;color:#fff;font-family:inherit;">
              <option value="" style="background:#18101f;" ${!p.category ? "selected" : ""}>Без категории</option>
              ${categoryOptions(p.category)}
            </select>
          </div>
        </div>
        <div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14.5px;">Жидкость (для фильтра каталога)</span>
          <input type="checkbox" ${p.is_liquid ? "checked" : ""} onchange="state.adminEditing.is_liquid=this.checked" style="width:20px;height:20px;">
        </div>
        <div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14.5px;">В наличии</span>
          <input type="checkbox" ${p.stock ? "checked" : ""} onchange="state.adminEditing.stock=this.checked" style="width:20px;height:20px;">
        </div>
        <div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14.5px;">Хит продаж</span>
          <input type="checkbox" ${p.is_hit ? "checked" : ""} onchange="state.adminEditing.is_hit=this.checked" style="width:20px;height:20px;">
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
        <button class="btn btn-primary" onclick="adminSaveProduct()">Сохранить</button>
        <button class="btn btn-outline" onclick="state.adminEditing=null;renderAdmin();">${t("cancel")}</button>
      </div>
    </div>
  `;
}

async function adminPhotoSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  // мгновенный локальный превью, пока идёт загрузка на сервер
  const localPreview = URL.createObjectURL(file);
  state.adminEditing.photo = localPreview;
  renderAdmin();
  const statusEl = document.getElementById("photoUploadStatus");
  if (statusEl) statusEl.textContent = "Загрузка фото…";
  try {
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch("/api/admin/upload", { method: "POST", headers: { "x-admin-code": ADMIN_CODE }, body: formData });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || "Ошибка загрузки");
    const data = await res.json();
    state.adminEditing.photo = data.url;
    renderAdmin();
  } catch (err) {
    alert("Не удалось загрузить фото: " + err.message);
  }
}

async function adminSaveProduct() {
  const p = state.adminEditing;
  if (!p.nameObj || !p.nameObj.ru || !p.price) { alert("Укажите название (RU) и цену"); return; }
  const payload = { ...p, name: p.nameObj, description: p.descObj, price: Number(p.price) };
  try {
    if (p.isNew) await adminApi("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    else await adminApi(`/api/admin/products/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await loadCatalog();
    state.adminEditing = null;
    renderAdmin();
  } catch (e) {
    alert("Не получилось сохранить: " + e.message);
  }
}

// Список названий для <select> в карточке товара. Если у товара стоит
// категория, которой больше нет в справочнике, она всё равно показывается,
// чтобы редактирование не затирало её молча.
function categoryOptions(current) {
  const names = ADMIN_CATEGORIES.map(c => c.name);
  if (current && !names.includes(current)) names.push(current);
  return names.map(n =>
    `<option value="${escapeAttr(n)}" style="background:#18101f;" ${n === current ? "selected" : ""}>${n}</option>`
  ).join("");
}

function escapeAttr(v) {
  return String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// Категории и города устроены одинаково, поэтому экран общий.
function dictScreen({ items, addFn, delFn, addLabel, emptyText, hint }) {
  return `
    <div style="padding:20px;">
      <button class="btn btn-primary" style="margin-bottom:8px;" onclick="${addFn}()">${addLabel}</button>
      <div style="font-size:12.5px;color:rgba(255,255,255,0.4);margin-bottom:16px;line-height:1.45;">${hint}</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${items.map(it => `
          <div class="card" style="display:flex;align-items:center;gap:12px;padding:14px 16px;">
            <div style="flex:1;font-weight:600;font-size:15px;">${it.name}</div>
            <button onclick="${delFn}(${it.id})" style="width:34px;height:34px;border-radius:10px;background:rgba(248,113,113,0.15);border:none;color:#f87171;flex-shrink:0;">🗑</button>
          </div>
        `).join("") || `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px 0;">${emptyText}</div>`}
      </div>
    </div>
  `;
}

function adminCategoriesScreen() {
  return dictScreen({
    items: ADMIN_CATEGORIES,
    addFn: "adminAddCategory",
    delFn: "adminDeleteCategory",
    addLabel: "+ Добавить категорию",
    emptyText: "Категорий пока нет",
    hint: "Категории появляются в фильтре каталога, как только в них есть хотя бы один товар. При удалении категории товары остаются — у них просто очищается это поле.",
  });
}

function adminCitiesScreen() {
  return dictScreen({
    items: ADMIN_CITIES,
    addFn: "adminAddCity",
    delFn: "adminDeleteCity",
    addLabel: "+ Добавить город",
    emptyText: "Городов пока нет",
    hint: "Покупатель выбирает город из этого списка при оформлении самовывоза.",
  });
}

async function adminAddDictItem(kind, promptText) {
  const name = prompt(promptText);
  if (name === null) return;
  if (!name.trim()) { alert("Название не может быть пустым"); return; }
  try {
    await adminApi(`/api/admin/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    await reloadDict(kind);
    renderAdmin();
  } catch (e) { alert("Не удалось добавить: " + e.message); }
}

async function adminDeleteDictItem(kind, id, confirmText) {
  if (!confirm(confirmText)) return;
  try {
    await adminApi(`/api/admin/${kind}/${id}`, { method: "DELETE" });
    await reloadDict(kind);
    renderAdmin();
  } catch (e) { alert("Ошибка: " + e.message); }
}

async function reloadDict(kind) {
  if (kind === "categories") ADMIN_CATEGORIES = await adminApi("/api/admin/categories");
  if (kind === "cities") {
    ADMIN_CITIES = await adminApi("/api/admin/cities");
    CITIES = ADMIN_CITIES;   // чтобы витрина сразу увидела изменения
  }
}

function adminAddCategory() { return adminAddDictItem("categories", "Название категории (например «Картриджи»):"); }
function adminAddCity() { return adminAddDictItem("cities", "Название города:"); }
function adminDeleteCategory(id) { return adminDeleteDictItem("categories", id, "Удалить категорию? Товары останутся, у них очистится категория."); }
function adminDeleteCity(id) { return adminDeleteDictItem("cities", id, "Удалить город из списка самовывоза?"); }

function adminOrdersScreen() {
  const statuses = ["Новый", "В обработке", "Отправлен/Готов", "Выполнен", "Отменён"];
  const colors = { "Новый": "#facc15", "В обработке": "#38bdf8", "Отправлен/Готов": "#a78bfa", "Выполнен": "#34d67f", "Отменён": "#f87171" };
  return `
    <div style="padding:20px;display:flex;flex-direction:column;gap:12px;">
      ${ADMIN_ORDERS.map(o => `
        <div class="card" style="padding:14px 16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <div style="font-weight:700;font-size:14.5px;">Заказ №${o.id} · клиент ${o.user_id}</div>
            <div style="font-weight:800;font-size:15px;">${o.total}€</div>
          </div>
          <div style="color:rgba(255,255,255,0.4);font-size:12.5px;margin-bottom:10px;">${o.date}${o.city ? " · " + o.city : ""}${o.promo_code ? " · промо " + o.promo_code : ""}</div>
          <select onchange="adminUpdateOrderStatus(${o.id}, this.value)" style="width:100%;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:${colors[o.status]||"#fff"};font-weight:700;font-size:13.5px;">
            ${statuses.map(s => `<option value="${s}" ${s===o.status?"selected":""} style="background:#18101f;">${s}</option>`).join("")}
          </select>
        </div>
      `).join("") || `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px 0;">${t("history_empty")}</div>`}
    </div>
  `;
}

async function adminUpdateOrderStatus(id, status) {
  try {
    await adminApi(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
    ADMIN_ORDERS = await adminApi("/api/admin/orders");
  } catch (e) { alert("Не удалось обновить статус: " + e.message); }
}

function adminStatsScreen() {
  const s = ADMIN_STATS;
  const maxRev = Math.max(1, ...s.revenueByDay);
  return `
    <div style="padding:20px;">
      <div style="display:flex;gap:10px;margin-bottom:20px;">
        <div class="card" style="flex:1;padding:16px;text-align:center;">
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:6px;">ВЫРУЧКА / 7Д</div>
          <div style="font-weight:800;font-size:16px;">${s.totalRevenue.toLocaleString("ru")}€</div>
        </div>
        <div class="card" style="flex:1;padding:16px;text-align:center;">
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:6px;">ЗАКАЗОВ</div>
          <div style="font-weight:800;font-size:16px;">${s.totalOrders}</div>
        </div>
        <div class="card" style="flex:1;padding:16px;text-align:center;">
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:6px;">СР. ЧЕК</div>
          <div style="font-weight:800;font-size:16px;">${s.avgCheck}€</div>
        </div>
      </div>
      <div class="card" style="padding:20px;margin-bottom:16px;">
        <div style="font-weight:700;font-size:14.5px;margin-bottom:16px;">Выручка по дням</div>
        <div style="display:flex;align-items:flex-end;gap:8px;height:120px;">
          ${s.revenueByDay.map((v,i) => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;justify-content:flex-end;height:100%;">
              <div style="width:100%;border-radius:6px 6px 0 0;background:linear-gradient(180deg,#e879f9,#7c3aed);height:${Math.round(v/maxRev*100)}px;min-height:${v>0?4:0}px;"></div>
              <span style="font-size:10.5px;color:rgba(255,255,255,0.4);">${s.labels[i]}</span>
            </div>
          `).join("")}
        </div>
      </div>
      <div style="color:rgba(255,255,255,0.3);font-size:11.5px;line-height:1.5;">
        Данные считаются по заказам за последние 7 дней (без отменённых).
      </div>
    </div>
  `;
}

function adminPromoScreen() {
  return `
    <div style="padding:20px;">
      <button class="btn btn-primary" style="margin-bottom:16px;" onclick="adminAddPromo()">+ Добавить промокод</button>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${ADMIN_PROMOS.map(pr => `
          <div class="card" style="display:flex;align-items:center;gap:12px;padding:14px 16px;">
            <div style="flex:1;">
              <div style="font-weight:700;font-size:15px;">${pr.code}</div>
              <div style="color:rgba(255,255,255,0.4);font-size:12.5px;">-${pr.discount}% скидка</div>
            </div>
            <label style="position:relative;width:44px;height:26px;flex-shrink:0;">
              <input type="checkbox" ${pr.active?"checked":""} onchange="adminTogglePromo(${pr.id})" style="opacity:0;width:100%;height:100%;position:absolute;margin:0;cursor:pointer;z-index:1;">
              <div style="width:100%;height:100%;border-radius:999px;background:${pr.active?"linear-gradient(90deg,#c026d3,#7c3aed)":"rgba(255,255,255,0.15)"};"></div>
              <div style="position:absolute;top:3px;left:${pr.active?"21px":"3px"};width:20px;height:20px;border-radius:50%;background:#fff;transition:0.2s;"></div>
            </label>
            <button onclick="adminDeletePromo(${pr.id})" style="width:34px;height:34px;border-radius:10px;background:rgba(248,113,113,0.15);border:none;color:#f87171;flex-shrink:0;">🗑</button>
          </div>
        `).join("") || `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px 0;">Промокодов пока нет</div>`}
      </div>
    </div>
  `;
}

async function adminAddPromo() {
  const code = prompt("Код промокода (например SUMMER15):");
  if (!code) return;
  const discount = Number(prompt("Скидка в %, например 10:"));
  if (!discount || discount <= 0) { alert("Некорректная скидка"); return; }
  try {
    await adminApi("/api/admin/promo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, discount }) });
    ADMIN_PROMOS = await adminApi("/api/admin/promo");
    renderAdmin();
  } catch (e) { alert("Не удалось добавить промокод: " + e.message); }
}
async function adminTogglePromo(id) {
  try {
    await adminApi(`/api/admin/promo/${id}`, { method: "PATCH" });
    ADMIN_PROMOS = await adminApi("/api/admin/promo");
    renderAdmin();
  } catch (e) { alert("Ошибка: " + e.message); }
}
async function adminDeletePromo(id) {
  try {
    await adminApi(`/api/admin/promo/${id}`, { method: "DELETE" });
    ADMIN_PROMOS = ADMIN_PROMOS.filter(p => p.id !== id);
    renderAdmin();
  } catch (e) { alert("Ошибка: " + e.message); }
}

function adminReferralScreen() {
  const totalInvited = ADMIN_REFERRALS.reduce((a,r)=>a+r.invited,0);
  const totalEarned = ADMIN_REFERRALS.reduce((a,r)=>a+r.earned,0);
  return `
    <div style="padding:20px;">
      <div style="display:flex;gap:10px;margin-bottom:20px;">
        <div class="card" style="flex:1;padding:16px;text-align:center;">
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:6px;">ПРИГЛАШЕНО</div>
          <div style="font-weight:800;font-size:17px;">${totalInvited}</div>
        </div>
        <div class="card" style="flex:1;padding:16px;text-align:center;">
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:6px;">БОНУСОВ ВЫДАНО</div>
          <div style="font-weight:800;font-size:17px;">${totalEarned}€</div>
        </div>
      </div>
      <div style="font-weight:700;font-size:14.5px;margin-bottom:10px;">Топ рефереров</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${ADMIN_REFERRALS.map((r,i) => `
          <div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 16px;">
            <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#c026d3,#7c3aed);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">${i+1}</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:14px;">${r.name}</div>
              <div style="color:rgba(255,255,255,0.4);font-size:12px;">${r.invited} приглашений</div>
            </div>
            <div style="font-weight:800;font-size:14.5px;color:#e879f9;">${r.earned}€</div>
          </div>
        `).join("") || `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:20px 0;">Пока никто не приглашал друзей</div>`}
      </div>
    </div>
  `;
}


// ─────────────────── tabbar ───────────────────

const TABS = [
  { id: "home", label: "Главная", icon: "🏠" },
  { id: "catalog", label: "Товары", icon: "🛍" },
  { id: "cart", label: "Корзина", icon: "🛒" },
  { id: "profile", label: "Профиль", icon: "👤" },
  { id: "history", label: "История", icon: "📦" },
];

