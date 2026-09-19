function renderPayment(type, amount, id, cardNumber, lang = 'ru') {
  const translations = {
    ru: {
      order: (id) => `Оплата заказа #${id}`,
      topup: 'Пополнение баланса',
      cardLabel: 'Номер карты',
      copy: 'Копировать',
      copied: 'Скопировано ✓',
      timeLabel: 'Время на оплату',
      timeUp: 'Время истекло',
      button: 'Я перевёл средства',
      buttonClicked: 'Спасибо! Проверяем оплату...',
      currency: '€'
    },
    de: {
      order: (id) => `Bezahlung der Bestellung #${id}`,
      topup: 'Kontoaufladung',
      cardLabel: 'Kartennummer',
      copy: 'Kopieren',
      copied: 'Kopiert ✓',
      timeLabel: 'Verbleibende Zeit',
      timeUp: 'Zeit abgelaufen',
      button: 'Ich habe das Geld überwiesen',
      buttonClicked: 'Danke! Zahlung wird geprüft...',
      currency: '€'
    }
  };

  const t = translations[lang] || translations.ru;
  const title = type === 'order' ? t.order(id) : t.topup;

  const locales = { ru: 'ru-RU', de: 'de-DE' };
  const formattedAmount = new Intl.NumberFormat(locales[lang] || 'ru-RU').format(amount);
  const formattedCard = cardNumber.replace(/(.{4})/g, '$1 ').trim();
  const timerId = `timer-${Date.now()}`;
  const containerId = `payment-${Date.now()}`;

  const html = `
    <div id="${containerId}" style="
      max-width: 420px;
      margin: 20px auto;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 20px;
      padding: 32px 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #ffffff;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.08);
      animation: fadeIn 0.3s ease;
    ">
      <h2 style="
        margin: 0 0 24px 0;
        font-size: 18px;
        font-weight: 500;
        color: #a0a0c0;
        text-align: center;
        letter-spacing: 0.3px;
      ">${title}</h2>

      <div style="
        text-align: center;
        margin-bottom: 28px;
      ">
        <div style="
          font-size: 42px;
          font-weight: 700;
          background: linear-gradient(90deg, #6c5ce7, #00cec9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">${formattedAmount} ${t.currency}</div>
      </div>

      <div style="
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 14px;
        padding: 18px 20px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div>
          <div style="font-size: 12px; color: #8888a0; margin-bottom: 6px;">${t.cardLabel}</div>
          <div id="${containerId}-card" style="font-size: 18px; font-weight: 600; letter-spacing: 1px;">${formattedCard}</div>
        </div>
        <button onclick="
          navigator.clipboard.writeText('${cardNumber}');
          this.innerText = '${t.copied}';
          this.style.color = '#00cec9';
          setTimeout(() => { this.innerText = '${t.copy}'; this.style.color = '#6c5ce7'; }, 2000);
        " style="
          background: rgba(108,92,231,0.15);
          border: 1px solid rgba(108,92,231,0.4);
          color: #6c5ce7;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">${t.copy}</button>
      </div>

      <div style="
        text-align: center;
        margin-bottom: 28px;
        padding: 14px;
        background: rgba(255,255,255,0.03);
        border-radius: 12px;
      ">
        <div style="font-size: 12px; color: #8888a0; margin-bottom: 6px;">${t.timeLabel}</div>
        <div id="${timerId}" style="
          font-size: 28px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: #ffffff;
        ">15:00</div>
      </div>

      <button onclick="
        this.innerText = '${t.buttonClicked}';
        this.disabled = true;
        this.style.opacity = '0.6';
        this.style.cursor = 'default';
        if (window.onPaymentConfirmed) window.onPaymentConfirmed();
      " style="
        width: 100%;
        padding: 16px;
        background: linear-gradient(90deg, #6c5ce7, #5849c2);
        border: none;
        border-radius: 14px;
        color: #ffffff;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(108,92,231,0.35);
        transition: transform 0.15s;
      " onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
        ${t.button}
      </button>

      <button onclick="state.tab='profile'; render();" style="
        width: 100%;
        margin-top: 12px;
        padding: 14px;
        background: transparent;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 14px;
        color: rgba(255,255,255,0.6);
        font-size: 14px;
        cursor: pointer;
      ">
        ${CURRENT_LANG === 'de' ? 'Zurück zum Profil' : 'Вернуться в профиль'}
      </button>
    </div>

    <script>
      (function() {
        let secondsLeft = 15 * 60;
        const el = document.getElementById('${timerId}');
        if (!el) return;
        const interval = setInterval(() => {
          secondsLeft--;
          if (secondsLeft < 0) {
            clearInterval(interval);
            const e = document.getElementById('${timerId}');
            if (e) {
              e.innerText = '${t.timeUp}';
              e.style.color = '#ff6b6b';
            }
            return;
          }
          const e = document.getElementById('${timerId}');
          if (!e) { clearInterval(interval); return; }
          const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
          const s = (secondsLeft % 60).toString().padStart(2, '0');
          e.innerText = m + ':' + s;
        }, 1000);
      })();
    </script>
  `;

  return html;
}

window.onPaymentConfirmed = async () => {
    // We can call an API here if we want to change status to "PAYMENT_REVIEW",
    // but the admin already got the notification with buttons!
    // So we just show haptic feedback.
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }
};
