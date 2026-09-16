function adminPromoScreen() {
  return `
    <div style="padding:20px;">
      <button class="btn btn-primary" style="margin-bottom:16px;" onclick="adminAddPromo()">+ Добавить промокод</button>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${ADMIN_PROMOS.map(pr => `
                    <div class="card" style="display:flex;align-items:center;gap:12px;padding:14px 16px;">
            <div style="flex:1;">
              <div style="font-weight:700;font-size:15px;letter-spacing:1px;">${pr.code}</div>
              <div style="color:rgba(255,255,255,0.4);font-size:12.5px;margin-top:2px;">-${pr.discount}% скидка</div>
            </div>
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