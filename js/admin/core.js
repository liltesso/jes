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
let ADMIN_SETTINGS = {};
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
    if (id === "settings") ADMIN_SETTINGS = await adminApi("/api/admin/settings");
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
  { id: "broadcast", label: "Рассылка", icon: "✉️" },
  { id: "promo", label: "Промокоды", icon: "🏷" },
  { id: "referral", label: "Рефералка", icon: "👥" },
  { id: "settings", label: "Реквизиты", icon: "⚙️" },
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
    if (state.adminTab === "broadcast") content = adminBroadcastScreen();
    if (state.adminTab === "promo") content = adminPromoScreen();
    if (state.adminTab === "referral") content = adminReferralScreen();
    if (state.adminTab === "settings") content = adminSettingsScreen();
  }

  el.innerHTML = `
    <div class="tg-header">
      <span class="close" onclick="closeAdmin()">Закрыть</span>
      <div class="title"><div class="txt"><b>Админ-панель</b><span>MARSHAL</span></div></div>
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