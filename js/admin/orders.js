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
          <div style="font-size:13px; color:#fff; margin-bottom:10px; padding:8px; background:rgba(0,0,0,0.2); border-radius:8px;">
            ${(o.items || []).map(i => {
               let n = i.name || ("Товар #" + i.product_id);
               if (typeof n === 'string' && n.startsWith('{')) { try { n = JSON.parse(n); } catch(e){} }
               if (typeof n === 'object') n = n.ru || n.de || '';
               return `<div style="margin-bottom:4px;">- ${n} <b>x${i.qty}</b> (${i.price}€)</div>`;
            }).join("")}
          </div>
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