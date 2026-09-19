function adminSettingsScreen() {
  const m = ADMIN_SETTINGS.mono_req || {};
  const s = ADMIN_SETTINGS.sparkasse_req || {};
  const t = ADMIN_SETTINGS.manager_tg || {};
  const r = ADMIN_SETTINGS.eur_uah_rate || {};
  
  
  return `
    <div style="padding:20px;">
      <h3 style="margin:0 0 10px 0;font-size:22px;text-align:center;">Настройки оплат</h3>
      <div style="text-align:center; font-size:12px; color:rgba(255,255,255,0.4); margin-bottom:20px;">
        Свайпайте карточки вправо/влево ↔
      </div>
      
      <div class="no-scroll" style="display:flex; gap:16px; overflow-x:auto; scroll-snap-type: x mandatory; margin-bottom: 24px; padding-bottom: 10px;">
        
        <div class="card" style="min-width:85%; flex-shrink:0; scroll-snap-align: center; padding:20px; display:flex; flex-direction:column; justify-content:center;">
          <h4 style="margin:0 0 15px 0;color:#c026d3;">Курс Евро (€ -> ₴)</h4>
          <p style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:15px;">Установите актуальный курс для конвертации валют (если используется).</p>
          <input type="number" id="adm_eur_rate" class="input" value="${r.rate || ''}" placeholder="Например: 45.0" style="margin-bottom:10px;">
        </div>
        
        <div class="card" style="min-width:85%; flex-shrink:0; scroll-snap-align: center; padding:20px; display:flex; flex-direction:column; justify-content:center;">
          <h4 style="margin:0 0 15px 0;color:#c026d3;">Monobank</h4>
          <p style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:15px;">Реквизиты для оплаты на карту (Украина).</p>
          <input type="text" id="adm_mono_card" class="input" value="${m.card || ''}" placeholder="Номер карты" style="margin-bottom:10px;">
          <input type="text" id="adm_mono_name" class="input" value="${m.name || ''}" placeholder="Имя получателя" style="margin-bottom:10px;">
        </div>

        <div class="card" style="min-width:85%; flex-shrink:0; scroll-snap-align: center; padding:20px; display:flex; flex-direction:column; justify-content:center;">
          <h4 style="margin:0 0 15px 0;color:#c026d3;">Sparkasse</h4>
          <p style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:15px;">Реквизиты для оплаты IBAN (Европа).</p>
          <input type="text" id="adm_spar_iban" class="input" value="${s.iban || ''}" placeholder="IBAN" style="margin-bottom:10px;">
          <input type="text" id="adm_spar_name" class="input" value="${s.name || ''}" placeholder="Имя получателя" style="margin-bottom:10px;">
          <input type="text" id="adm_spar_bic" class="input" value="${s.bic || ''}" placeholder="BIC" style="margin-bottom:10px;">
        </div>

        <div class="card" style="min-width:85%; flex-shrink:0; scroll-snap-align: center; padding:20px; display:flex; flex-direction:column; justify-content:center;">
          <h4 style="margin:0 0 15px 0;color:#c026d3;">Telegram Менеджера</h4>
          <p style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:15px;">Куда клиентам скидывать чеки об оплате.</p>
          <input type="text" id="adm_man_tg" class="input" value="${t.username || ''}" placeholder="Без @, например: smokelab_manager">
        </div>

      </div>

      <button class="btn btn-primary" style="width:100%; padding:14px; font-size:16px;" onclick="saveAdminSettings()">Сохранить настройки</button>
    </div>
  `;

}

async function saveAdminSettings() {
  const payload = {
    eur_uah_rate: { rate: parseFloat(document.getElementById("adm_eur_rate").value) || 0 },
    mono_req: { card: document.getElementById("adm_mono_card").value, name: document.getElementById("adm_mono_name").value },
    sparkasse_req: { iban: document.getElementById("adm_spar_iban").value, name: document.getElementById("adm_spar_name").value, bic: document.getElementById("adm_spar_bic").value },
    manager_tg: { username: document.getElementById("adm_man_tg").value }
  };
  try {
    await adminApi("/api/admin/settings/save", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    alert("Настройки успешно сохранены!");
    setAdminTab("settings");
  } catch(e) {
    alert("Ошибка сохранения настроек");
  }
}