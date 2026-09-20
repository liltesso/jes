
function renderHome() {
  return `
    <div style="padding-bottom:100px;overflow-x:hidden;animation:fadeIn 0.4s ease-out;">
      <section class="hero" id="top" style="padding-bottom:20px;">
        <div style="position:relative; height: 420px; width: 100%;">
          <div class="logo-card">
            <h1 class="logo">
                <span class="svoy">SMOKE</span>
                <span class="shop">LAB</span>
            </h1>
          </div>
          
          <div class="bubble b1">${t("chat1")}</div>
          <div class="bubble b2">${t("chat2")}</div>
          <div class="bubble b3">${t("chat3")}</div>
          
          <div class="product-hero liquid-hero" style="cursor:pointer; top: 160px; height: 260px;" onclick="setTab('catalog')">
            <div class="liquid-hero-glow"></div>
            <img loading="lazy" src="${window.HERO_IMAGE}" style="width:70%;height:70%;object-fit:contain;filter:drop-shadow(0 20px 40px rgba(192,38,211,0.7));position:relative;z-index:1;">
          </div>
        </div>

        <div class="hero-card" style="margin: 20px 20px 24px;">
          <h2 style="font-size: 28px; margin-bottom: 8px; color: #fff;">${t("best_shop")}</h2>
          <p style="color: #b998c9; font-size: 16px; line-height: 1.4;">${t("best_shop_desc")}</p>
        </div>
        <button class="order-big" style="margin: 0 20px 30px; width: calc(100% - 40px); background: linear-gradient(90deg, #c026d3, #7c3aed); color: white; border: none; padding: 16px; border-radius: 16px; font-size: 18px; font-weight: 900; box-shadow: 0 10px 30px rgba(192, 38, 211, 0.4);" onclick="setTab('catalog')">${t("go_catalog") || "КАТАЛОГ"}</button>
      </section>

      <section class="about" id="about" style="padding: 0 20px;">
        <div class="big-title"><span>MARSHAL</span><h2>НЕМНОГО О НАС</h2></div>
        <div class="info-card">
          <h3>КТО МЫ?</h3><div class="line"></div>
          <p>MARSHAL — топовый магазин жидкостей, pod-систем, одноразовых устройств и картриджей. Мы постоянно обновляем ассортимент и предлагаем только лучшую продукцию.</p>
        </div>
        <div class="info-card">
          <h3>НАШИ ПЛЮСЫ</h3><div class="line"></div>
          <div class="adv-grid">
            <div><h4>УСЛОВИЯ</h4><p>Прозрачные цены без скрытых наценок. Всё понятно до оформления заказа.</p></div>
            <div><h4>АВТОРСКИЙ ВЫБОР</h4><p>Мы сами тестируем продукцию, чтобы предлагать только лучшие вкусы и девайсы.</p></div>
            <div><h4>ГАРАНТИЯ КАЧЕСТВА</h4><p>Проверенные товары, аккуратная упаковка и идеальное состояние при получении.</p></div>
          </div>
        </div>
      </section>

      <section class="split-section" style="padding: 0 20px;">
        <div class="info-card">
          <h3>ОПЛАТА</h3><div class="line"></div>
          <p>Принимаем разные варианты оплаты. Детали уточняются при оформлении.</p>
          <div class="pay-card">💵 Наличные</div>
          <div class="pay-card">💳 Перевод на Карту</div>
        </div>
        <div class="info-card">
          <h3>ТЕХ. ПОДДЕРЖКА</h3><div class="line"></div>
          <p>Остались вопросы? Пиши, дадим ответ на каждый.</p>
          <button class="main-btn" style="width:100%;margin-top:10px;padding:14px;background:#c026d3;color:#fff;border-radius:12px;font-weight:bold;border:none;box-shadow: 0 4px 15px rgba(192, 38, 211, 0.4);" onclick="window.open('https://t.me/marshal_support', '_blank')">ЗАДАТЬ ВОПРОС</button>
        </div>
      </section>

      <section class="reviews" id="reviews" style="padding: 0 20px;">
        <div class="big-title"><span>MARSHAL</span><h2>ОТЗЫВЫ ПОКУПАТЕЛЕЙ</h2></div>
        
        <div class="no-scroll" style="display:flex; gap:16px; overflow-x:auto; padding-bottom: 20px; scroll-snap-type:x mandatory; margin-bottom:20px;">

            <div class="card" style="min-width:260px; max-width:260px; scroll-snap-align:start; padding:16px; border-radius:16px; flex-shrink:0; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #c026d3, #7c3aed); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px;">А</div>
                <div>
                  <div style="font-weight:700; font-size:14px;">Алексей</div>
                  <div style="color:#f59e0b; font-size:12px;">★★★★★</div>
                </div>
              </div>
              <div style="font-size:13px; color:rgba(255,255,255,0.7); line-height:1.5;">
                Отличный шоп! Заказываю жижи уже третий раз, доставка всегда вовремя. Качество на высоте 🔥
              </div>
            </div>

            <div class="card" style="min-width:260px; max-width:260px; scroll-snap-align:start; padding:16px; border-radius:16px; flex-shrink:0; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #3b82f6, #2dd4bf); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px;">М</div>
                <div>
                  <div style="font-weight:700; font-size:14px;">Максим</div>
                  <div style="color:#f59e0b; font-size:12px;">★★★★★</div>
                </div>
              </div>
              <div style="font-size:13px; color:rgba(255,255,255,0.7); line-height:1.5;">
                Лучший ассортимент, который я видел. Цены радуют, а главное оригинальная продукция. Рекомендую!
              </div>
            </div>

            <div class="card" style="min-width:260px; max-width:260px; scroll-snap-align:start; padding:16px; border-radius:16px; flex-shrink:0; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #ec4899, #f43f5e); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px;">Д</div>
                <div>
                  <div style="font-weight:700; font-size:14px;">Дарья</div>
                  <div style="color:#f59e0b; font-size:12px;">★★★★★</div>
                </div>
              </div>
              <div style="font-size:13px; color:rgba(255,255,255,0.7); line-height:1.5;">
                Очень приятный саппорт, помогли выбрать вкус. Упаковка топ, всё дошло целым. Спасибо ❤️
              </div>
            </div>

            <div class="card" style="min-width:260px; max-width:260px; scroll-snap-align:start; padding:16px; border-radius:16px; flex-shrink:0; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #10b981, #059669); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px;">В</div>
                <div>
                  <div style="font-weight:700; font-size:14px;">Владислав</div>
                  <div style="color:#f59e0b; font-size:12px;">★★★★★</div>
                </div>
              </div>
              <div style="font-size:13px; color:rgba(255,255,255,0.7); line-height:1.5;">
                Пушка! Замовив премку, приїхало на наступний день. Смак просто космос, буду замовляти ще!
              </div>
            </div>

            <div class="card" style="min-width:260px; max-width:260px; scroll-snap-align:start; padding:16px; border-radius:16px; flex-shrink:0; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #f59e0b, #d97706); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px;">І</div>
                <div>
                  <div style="font-weight:700; font-size:14px;">Ігор</div>
                  <div style="color:#f59e0b; font-size:12px;">★★★★★</div>
                </div>
              </div>
              <div style="font-size:13px; color:rgba(255,255,255,0.7); line-height:1.5;">
                Сервіс 10/10. Менеджер швидко відповів, допоміг розібратися з рідинами. Однозначно мій фаворит серед шопів.
              </div>
            </div>

            <div class="card" style="min-width:260px; max-width:260px; scroll-snap-align:start; padding:16px; border-radius:16px; flex-shrink:0; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #6366f1, #4f46e5); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px;">А</div>
                <div>
                  <div style="font-weight:700; font-size:14px;">Анна</div>
                  <div style="color:#f59e0b; font-size:12px;">★★★★★</div>
                </div>
              </div>
              <div style="font-size:13px; color:rgba(255,255,255,0.7); line-height:1.5;">
                Дуже зручно через телеграм замовляти! І система знижок порадувала, вже назбирала собі на кешбек :)
              </div>
            </div>

        </div>
      </section>

      <section class="numbers" style="padding: 0 20px;">
        <div class="stat"><span>📦</span><b>500+</b><p>Успешных заказов</p></div>
        <div class="stat"><span>⭐</span><b>99%</b><p>Положительных отзывов</p></div>
        <div class="stat"><span>💬</span><b>24/7</b><p>Поддержка</p></div>
        <div class="stat"><span>⚡</span><b>10 мин</b><p>Среднее время ответа</p></div>
      </section>

      <section class="trust-strip" aria-label="Преимущества магазина" style="padding: 0 20px; margin-bottom: 40px;">
        <div class="trust-item"><b>⚡ Быстрая обработка</b><span>Заказы быстро попадают администраторам и не теряются.</span></div>
        <div class="trust-item"><b>🔐 Telegram Авторизация</b><span>Без входа никто не сможет оформить заказ от твоего имени.</span></div>
        <div class="trust-item"><b>📦 Живое наличие</b><span>Остатки обновляются после оформления заказа.</span></div>
      </section>

    </div>
  `;
}
