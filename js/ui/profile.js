const TOPUP_METHODS = [];

function renderProfile() {
  if (!USER_ID || !PROFILE) {
    return `
      <div style="padding-top:8px;">
        <div class="section-title"><h2>${t("profile_title")}</h2><p>${t("profile_subtitle")}</p></div>
        <div class="px5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px 0;font-size:14.5px;">
          ${t("profile_tg_req")}
        </div>
      </div>
    `;
  }
  if (state.topupStep === "form") {
    return renderTopup();
  }

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userName = tgUser?.first_name || t("client") || "Клиент";
  const userPhoto = tgUser?.photo_url 
    ? `<img src="${tgUser.photo_url}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #c026d3;">`
    : `<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#c026d3,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;">👤</div>`;

  return `
    <div style="padding-top:8px;padding-bottom:16px;">
      <div class="section-title"><h2>${t("profile_title")}</h2><p>${t("profile_subtitle")}</p></div>
      <div class="card" style="margin:0 20px 20px;padding:28px 24px;text-align:center;">
        <div style="margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">${userPhoto}</div>
        <div style="font-weight:700;font-size:17px;">${userName}</div>
        <div style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:4px;">ID ${PROFILE.telegram_id}</div>
      </div>
      <div class="px5" style="display:flex;flex-direction:column;gap:12px;">
        <div class="card" style="padding:16px 20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:rgba(255,255,255,0.6);font-size:14.5px;">💰 ${t("balance")}</span>
            <b>${PROFILE.balance}€</b>
          </div>
          <button class="btn btn-primary" style="margin-top:12px;padding:10px;font-size:14px;" onclick="state.topupStep='form';render()">${t("topup")}</button>
        </div>
        <div class="card" style="padding:16px 20px;display:flex;justify-content:space-between;"><span style="color:rgba(255,255,255,0.6);font-size:14.5px;">👥 ${t("invited")}</span><b>${PROFILE.invited_count}</b></div>
        <div class="card" style="padding:16px 20px;">
          <div style="color:rgba(255,255,255,0.6);font-size:14.5px;margin-bottom:8px;">🔗 ${t("ref_link")}</div>
          <div style="color:#e879f9;font-size:13px;word-break:break-all;">${PROFILE.ref_link}</div>
        </div>
      </div>
      
    </div>
  `;
}

// ─────────────────── пополнение баланса ───────────────────



function renderTopup() {
  const amounts = [20, 50, 80, 100];
  return `
    <div style="padding-top:8px;padding-bottom:16px;">
      <div class="section-title"><h2>${t("topup_title")}</h2><p>${t("topup_subtitle")}</p></div>

      <div class="px5" style="margin-bottom:20px;">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px;">${t("topup_amount")}</div>
        <div class="card"><input id="topupAmountInput" type="number" inputmode="numeric" placeholder="${t("topup_ph")}" value="${state.topupAmount}" style="width:100%;padding:14px 16px;font-size:14.5px;" oninput="state.topupAmount=this.value"></div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          ${amounts.map(a => `<button class="btn ${String(state.topupAmount)===String(a) ? 'btn-primary' : 'btn-outline'}" style="opacity:1;flex:1;min-width:64px;padding:8px;font-size:13.5px;" onclick="state.topupAmount='${a}';render()">${a}€</button>`).join("")}
        </div>
      </div>

      

      <div class="px5" style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-primary" onclick="submitTopup()" ${(!state.topupAmount || Number(state.topupAmount)<=0) ? "disabled style='opacity:0.4;'" : ""}>${t("topup_btn")} ${state.topupAmount || 0}€</button>
        <button class="btn btn-outline" onclick="state.topupStep=null;state.topupAmount='';state.topupMethod=null;render()">${t("cancel")}</button>
      </div>
      
    </div>
  `;
}

function renderHistory() {
  if (!USER_ID) {
    return `
      <div style="padding-top:8px;">
        <div class="section-title"><h2>${t("history_title")}</h2><p>${t("history_subtitle")}</p></div>
      ${getReferralCTA()}
      <div class="px5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px 0;font-size:14.5px;">
          ${t("history_tg_req")}
        </div>
      </div>
    `;
  }
  
  const mapStatus = (s) => {
    if (s === "Новый") return t("status_new");
    if (s === "В обработке") return t("status_proc");
    if (s === "Отправлен/Готов") return t("status_sent");
    if (s === "Выполнен") return t("status_done");
    if (s === "Отменён") return t("status_canc");
    return s;
  };
  const colors = { [t("status_new")]: "#facc15", [t("status_proc")]: "#38bdf8", [t("status_sent")]: "#a78bfa", [t("status_done")]: "#34d67f", [t("status_canc")]: "#f87171" };
  return `
    <div style="padding-top:8px;padding-bottom:16px;">
      <div class="section-title"><h2>${t("history_title")}</h2><p>${t("history_subtitle")}</p></div>
      ${getReferralCTA()}
      <div class="px5" style="display:flex;flex-direction:column;gap:12px;">
        ${ORDER_HISTORY.map(o => `
          <div class="card" style="padding:16px 20px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;">
              <div><div style="font-weight:600;font-size:14.5px;">${t("order_num")}${o.id}</div><div style="color:rgba(255,255,255,0.4);font-size:12.5px;margin-top:2px;">${o.date}</div></div>
              <div style="text-align:right;"><div style="font-weight:700;font-size:15px;">${o.total}€</div><div style="font-size:12.5px;font-weight:600;color:${colors[t(o.status)] || colors[mapStatus(o.status)] || '#fff'};">${t(o.status) || mapStatus(o.status) || o.status}</div></div>
            </div>
            ${o.items ? `<div style="font-size: 14px; color: #fff; line-height: 1.4; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">${o.items}</div>` : ''}
            ${(o.status === 'Ожидает оплаты' || o.status === 'Новый') && o.payment_method === 'mono' && window.SETTINGS?.mono_req ? `
              <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;margin-top:4px;">
                <div style="font-size:13px;font-weight:700;color:#c026d3;margin-bottom:8px;">Оплата Monobank</div>
                <div style="font-size:14px;font-weight:600;user-select:all;margin-bottom:4px;">${window.SETTINGS.mono_req.card || ''}</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:12px;">${window.SETTINGS.mono_req.name || ''}</div>
                <button class="btn btn-primary" style="width:100%;font-size:13px;padding:8px;" onclick="window.open('https://t.me/${(window.SETTINGS.manager_tg?.username || '').replace('@','')}')">Отправить чек менеджеру</button>
              </div>
            ` : ''}
            ${(o.status === 'Ожидает оплаты' || o.status === 'Новый') && o.payment_method === 'sparkasse' && window.SETTINGS?.sparkasse_req ? `
              <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;margin-top:4px;">
                <div style="font-size:13px;font-weight:700;color:#c026d3;margin-bottom:8px;">Оплата Sparkasse</div>
                <div style="font-size:14px;font-weight:600;user-select:all;margin-bottom:4px;">IBAN: ${window.SETTINGS.sparkasse_req.iban || ''}</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:4px;">BIC: ${window.SETTINGS.sparkasse_req.bic || ''}</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:12px;">Получатель: ${window.SETTINGS.sparkasse_req.name || ''}</div>
                <button class="btn btn-primary" style="width:100%;font-size:13px;padding:8px;" onclick="window.open('https://t.me/${(window.SETTINGS.manager_tg?.username || '').replace('@','')}')">Отправить чек менеджеру</button>
              </div>
            ` : ''}
          </div>
        `).join("") || `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px 0;font-size:14px;">${t("history_empty")}</div>`}
      </div>
      <div class="card" style="margin:24px 20px 32px;padding:24px 20px;">
        <div style="font-size:20px;font-weight:800;margin-bottom:12px;">${t("review_leave")}</div>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.5;margin-bottom:16px;">${t("review_desc")}</p>
        <textarea id="reviewText" placeholder="${t("review_ph")}" style="width:100%;height:80px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;color:#fff;font-size:14px;margin-bottom:16px;resize:none;"></textarea>
        <button class="btn btn-primary" onclick="submitReview()" style="width:100%;">${t("review_btn")}</button>
      </div>
    </div>
  `;
}

function getReferralCTA() {
  if (!USER_ID) return "";
  return `
    <div class="card" style="margin: 0 20px 24px; padding: 24px 20px; text-align: center; background: linear-gradient(135deg, rgba(161,59,224,0.1), rgba(161,59,224,0.3)); border: 1px solid rgba(161,59,224,0.4);">
      <div style="font-size: 36px; margin-bottom: 12px;">💸</div>
      <div style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">${t("ref_cta_title")}</div>
      <div style="font-size: 13.5px; color: rgba(255,255,255,0.8); margin-bottom: 16px; line-height: 1.4;">${t("ref_cta_desc")}</div>
      <button class="btn btn-primary" onclick="setTab('profile')" style="width: 100%; font-size: 14px; font-weight: 800;">${t("ref_cta_btn")}</button>
    </div>
  `;
}

// ─────────────────── screens ───────────────────