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