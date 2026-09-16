
function renderCart() {
  if (!USER_ID) {
    return `
      <div style="padding-top:8px;">
        <div class="section-title"><h2>${t("cart_title")}</h2><p>${t("cart_subtitle")}</p></div>
        <div class="px5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px 0;font-size:14.5px;">
          ${t("cart_tg_req") || "Требуется авторизация Telegram"}
        </div>
      </div>
    `;
  }

  const items = cartData.items || [];
  let total = items.reduce((acc, i) => acc + (i.price * i.qty), 0); // Recalculate robustly
  const discountedTotal = state.appliedPromo ? Math.round(total * (1 - state.appliedPromo.discount / 100)) : total;

  if (items.length === 0) {
    state.checkoutStep = null; // reset if empty
    return `
      <div style="padding-top:8px;padding-bottom:16px;">
        <div class="section-title"><h2>${t("cart_title")}</h2><p>${t("cart_subtitle")}</p></div>
        <div style="text-align:center;padding:60px 0;">
          <div style="font-size:42px;margin-bottom:12px;opacity:0.5;">🛒</div>
          <div style="color:rgba(255,255,255,0.35);font-size:15px;margin-bottom:30px;">${t("cart_empty") || "Ваша корзина пуста"}</div>
          ${getReferralCTA()}
        </div>
      </div>
    `;
  }

  // WIZARD STEPS
  if (state.checkoutStep === "delivery") return renderStepDelivery();
  if (state.checkoutStep === "payment") return renderStepPayment();
  if (state.checkoutStep === "confirm") return renderStepConfirm(items, total, discountedTotal);

  // --- MAIN SMART CART ---
  const FREE_SHIPPING_THRESHOLD = 75; // €
  const progress = Math.min(100, (discountedTotal / FREE_SHIPPING_THRESHOLD) * 100);
  const leftForFree = FREE_SHIPPING_THRESHOLD - discountedTotal;

  // Cross-sell items (products not in cart)
  const cartIds = items.map(i => i.product_id);
  const crossSells = PRODUCTS.filter(p => !cartIds.includes(p.id) && p.stock > 0).sort(() => Math.random() - 0.5).slice(0, 4);

  return `
    <div style="padding-top:8px;padding-bottom:16px;animation:fadeIn 0.3s ease;">
      <div class="section-title" style="margin-bottom:16px;">
        <h2>${t("cart_title") || "Корзина"}</h2>
        <p>${items.length} товара(ов) на сумму ${discountedTotal}€</p>
      </div>

      <!-- Progress Bar Free Shipping -->
      <div class="px5" style="margin-bottom:20px;">
        <div class="card" style="padding:16px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700;">
            <span>🚚 Бесплатная доставка</span>
            <span style="color:${progress === 100 ? '#34d67f' : '#e879f9'};">${progress === 100 ? 'Достигнута!' : `Ещё ${leftForFree}€`}</span>
          </div>
          <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
            <div style="width:${progress}%; height:100%; background:${progress === 100 ? '#34d67f' : 'linear-gradient(90deg, #c026d3, #7c3aed)'}; transition:width 0.4s ease;"></div>
          </div>
        </div>
      </div>

      <!-- Items List -->
      <div class="px5" style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        ${items.map(i => `
          <div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:12px; position:relative; overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div style="font-weight:600;font-size:14.5px;padding-right:12px;line-height:1.3;">${getName(i)}</div>
              <div style="color:rgba(255,255,255,0.4);font-size:13px;white-space:nowrap;">${i.price}€ / шт</div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border-radius:10px;padding:4px;">
                <button onclick="removeFromCart(${i.product_id})" style="width:32px;height:32px;border:none;background:rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;">-</button>
                <span style="font-weight:700;font-size:15px;min-width:24px;text-align:center;">${i.qty}</span>
                <button onclick="addToCart(${i.product_id})" style="width:32px;height:32px;border:none;background:linear-gradient(135deg, #c026d3, #7c3aed);border-radius:8px;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;">+</button>
              </div>
              <div style="color:#e879f9;font-weight:800;font-size:16px;">${i.price*i.qty}€</div>
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Promo Code -->
      <div class="card px5" style="margin:0 20px 16px;padding:20px;">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px;">Промокод (если есть)</div>
        <div style="display:flex; gap:8px;">
          <input id="promoInput" placeholder="Введите код" value="${state.promoCode || ""}" oninput="state.promoCode=this.value" style="flex:1; border-radius:12px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);padding:12px 16px;font-size:14.5px;">
          <button class="btn btn-outline" style="padding:0 16px;" onclick="applyPromo()">✅</button>
        </div>
        ${state.appliedPromo ? `<div style="color:#34d67f;font-size:13px;margin-top:10px;">✅ Скидка применена: -${state.appliedPromo.discount}%</div>` : ``}
      </div>

      <!-- Totals -->
      <div class="card" style="margin:0 20px 24px;padding:16px 20px;">
        ${state.appliedPromo ? `
          <div style="display:flex;justify-content:space-between;font-size:14px;color:rgba(255,255,255,0.4);margin-bottom:6px;"><span>Сумма</span><span>${total}€</span></div>
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#34d67f;margin-bottom:10px;"><span>Скидка ${state.appliedPromo.discount}%</span><span>-${Math.round(total*state.appliedPromo.discount/100)}€</span></div>
        ` : ""}
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:17px;font-weight:600;">К оплате</span>
          <span style="font-size:22px;font-weight:900;color:#fff;">${discountedTotal}€</span>
        </div>
      </div>

      <!-- Cross-sell Carousel -->
      ${crossSells.length > 0 ? `
        <div style="margin-bottom:24px;">
          <div style="padding:0 20px; font-weight:800; font-size:16px; margin-bottom:12px;">С этим часто покупают 🔥</div>
          <div class="no-scroll" style="display:flex;gap:12px;overflow-x:auto;padding:0 20px 10px;scroll-snap-type:x mandatory;">
            ${crossSells.map(p => {
              const bg = gradFor(p.id);
              const img = p.photo ? `<img src="${getPhoto(p.photo)}" style="height:60px;object-fit:contain;">` : `<div style="font-size:24px;">🧴</div>`;
              return `
                <div class="card" style="min-width:140px; padding:12px; border-radius:12px; scroll-snap-align:start; display:flex; flex-direction:column; align-items:center; text-align:center;">
                  <div style="height:70px; display:flex; align-items:center; justify-content:center; margin-bottom:8px;">${img}</div>
                  <div style="font-size:12px; font-weight:600; line-height:1.2; margin-bottom:4px; height:28px; overflow:hidden;">${getName(p)}</div>
                  <div style="color:#e879f9; font-weight:800; font-size:13px; margin-bottom:8px;">${p.price}€</div>
                  <button class="btn btn-primary" style="padding:4px 12px; font-size:11px; width:100%;" onclick="addToCart(${p.id})">Добавить</button>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      ` : ""}

      <div class="px5">
        <button class="btn btn-primary" style="width:100%; padding:14px; font-size:16px; font-weight:800;" onclick="state.checkoutStep='delivery';render()">Оформить заказ 🚀</button>
      </div>
    </div>
  `;
}

function getStepper(stepIndex) {
  const steps = ['Корзина', 'Доставка', 'Оплата', 'Подтверждение'];
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding:0 20px;">
      ${steps.map((s, i) => `
        <div style="display:flex; flex-direction:column; align-items:center; gap:6px; flex:1;">
          <div style="width:24px; height:24px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; ${i <= stepIndex ? 'background:#c026d3; color:#fff;' : 'background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.4);'}">
            ${i+1}
          </div>
          <div style="font-size:10px; font-weight:600; color:${i <= stepIndex ? '#c026d3' : 'rgba(255,255,255,0.4)'}; text-transform:uppercase; text-align:center;">${s}</div>
        </div>
        ${i < steps.length - 1 ? `<div style="height:2px; flex:1; background:${i < stepIndex ? '#c026d3' : 'rgba(255,255,255,0.1)'}; margin-bottom:16px;"></div>` : ''}
      `).join("")}
    </div>
  `;
}

function renderStepDelivery() {
  return `
    <div style="padding-top:16px;padding-bottom:24px;animation:fadeIn 0.3s ease;">
      ${getStepper(1)}
      
      <div class="px5" style="margin-bottom:20px;">
        <h3 style="margin:0 0 16px 0; font-size:18px;">Способ получения</h3>
        <div style="display:flex;gap:12px;margin-bottom:20px;">
          <div class="card" style="flex:1; padding:16px; text-align:center; cursor:pointer; border: 2px solid ${state.delivery==='pickup' ? '#c026d3' : 'transparent'};" onclick="state.delivery='pickup';render()">
            <div style="font-size:24px;margin-bottom:8px;">📦</div>
            <div style="font-weight:700;font-size:14px;">Самовывоз</div>
          </div>
          <div class="card" style="flex:1; padding:16px; text-align:center; cursor:pointer; border: 2px solid ${state.delivery==='delivery' ? '#c026d3' : 'transparent'};" onclick="state.delivery='delivery';render()">
            <div style="font-size:24px;margin-bottom:8px;">🚚</div>
            <div style="font-weight:700;font-size:14px;">Почта / Курьер</div>
          </div>
        </div>

        ${state.delivery === "pickup" ? `
          <div style="animation:fadeIn 0.3s ease;">
            <div style="font-weight:700;font-size:14px;margin-bottom:10px;">Выберите город для самовывоза:</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${CITIES.map(c => `<button class="btn ${state.city===c.name ? 'btn-primary' : 'btn-outline'}" onclick="state.city='${c.name}';render()">${c.name}</button>`).join("") || '<div style="color:rgba(255,255,255,0.3);font-size:13px;">Нет доступных городов</div>'}
            </div>
          </div>
        ` : ""}
        
        ${state.delivery === "delivery" ? `
          <div style="animation:fadeIn 0.3s ease;">
            <div style="font-weight:700;font-size:14px;margin-bottom:10px;">Адрес доставки:</div>
            <div class="card"><input id="addrInput" placeholder="Город, Отделение почты или Адрес" value="${state.city || ''}" style="width:100%;padding:14px 16px;font-size:14.5px;" oninput="state.city=this.value"></div>
          </div>
        ` : ""}
      </div>
      
      <div class="px5" style="display:flex; gap:12px;">
        <button class="btn btn-outline" style="flex:1;" onclick="state.checkoutStep=null;render()">Назад</button>
        <button class="btn btn-primary" style="flex:2;" ${(!state.delivery || !state.city) ? "disabled style='opacity:0.4;'" : ""} onclick="state.checkoutStep='payment';render()">Далее</button>
      </div>
    </div>
  `;
}

function renderStepPayment() {
  return `
    <div style="padding-top:16px;padding-bottom:24px;animation:fadeIn 0.3s ease;">
      ${getStepper(2)}
      
      <div class="px5" style="margin-bottom:24px;">
        <h3 style="margin:0 0 16px 0; font-size:18px;">Способ оплаты</h3>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="card" style="padding:16px; display:flex; align-items:center; gap:12px; cursor:pointer; border: 2px solid ${state.payment==='mono' ? '#c026d3' : 'transparent'};" onclick="state.payment='mono';render()">
            <div style="font-size:24px;">🐈</div>
            <div>
              <div style="font-weight:700;font-size:15px;">Monobank</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.4);">Перевод на карту (Украина)</div>
            </div>
          </div>
          
          <div class="card" style="padding:16px; display:flex; align-items:center; gap:12px; cursor:pointer; border: 2px solid ${state.payment==='sparkasse' ? '#c026d3' : 'transparent'};" onclick="state.payment='sparkasse';render()">
            <div style="font-size:24px;">🏦</div>
            <div>
              <div style="font-weight:700;font-size:15px;">Sparkasse / SEPA</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.4);">Банковский перевод IBAN (Европа)</div>
            </div>
          </div>

          <div class="card" style="padding:16px; display:flex; align-items:center; gap:12px; cursor:pointer; border: 2px solid ${state.payment==='cash' ? '#c026d3' : 'transparent'};" onclick="state.payment='cash';render()">
            <div style="font-size:24px;">💵</div>
            <div>
              <div style="font-weight:700;font-size:15px;">Наличные</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.4);">Оплата при получении</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="px5" style="display:flex; gap:12px;">
        <button class="btn btn-outline" style="flex:1;" onclick="state.checkoutStep='delivery';render()">Назад</button>
        <button class="btn btn-primary" style="flex:2;" ${(!state.payment) ? "disabled style='opacity:0.4;'" : ""} onclick="state.checkoutStep='confirm';render()">Подтвердить</button>
      </div>
    </div>
  `;
}

function renderStepConfirm(items, total, discountedTotal) {
  return `
    <div style="padding-top:16px;padding-bottom:24px;animation:fadeIn 0.3s ease;">
      ${getStepper(3)}
      
      <div class="px5" style="margin-bottom:24px;">
        <h3 style="margin:0 0 16px 0; font-size:18px;">Проверьте заказ</h3>
        
        <div class="card" style="padding:16px; margin-bottom:16px;">
          <div style="font-weight:700;font-size:14px;color:#c026d3;margin-bottom:8px;">Товары (${items.length})</div>
          ${items.map(i => `
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
              <span style="color:rgba(255,255,255,0.8);">${getName(i)} <b style="color:#fff;">x${i.qty}</b></span>
              <span style="font-weight:700;">${i.price*i.qty}€</span>
            </div>
          `).join("")}
          <div style="height:1px;background:rgba(255,255,255,0.1);margin:12px 0;"></div>
          <div style="display:flex;justify-content:space-between;font-weight:800;font-size:16px;">
            <span>До сплати:</span>
            <span style="color:#34d67f;">${discountedTotal}€</span>
          </div>
        </div>

        <div class="card" style="padding:16px; display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:14px;color:#c026d3;margin-bottom:2px;">Доставка</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.8);">${state.delivery === 'pickup' ? 'Самовывоз' : 'Пошта'} — ${state.city}</div>
            </div>
            <span onclick="state.checkoutStep='delivery';render()" style="font-size:12px;color:rgba(255,255,255,0.4);text-decoration:underline;cursor:pointer;">Изменить</span>
          </div>
          
          <div style="height:1px;background:rgba(255,255,255,0.1);"></div>

          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:14px;color:#c026d3;margin-bottom:2px;">Оплата</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.8);">${state.payment.toUpperCase()}</div>
            </div>
            <span onclick="state.checkoutStep='payment';render()" style="font-size:12px;color:rgba(255,255,255,0.4);text-decoration:underline;cursor:pointer;">Изменить</span>
          </div>
        </div>
      </div>
      
      <div class="px5" style="display:flex; gap:12px;">
        <button class="btn btn-outline" style="flex:1;" onclick="state.checkoutStep='payment';render()">Назад</button>
        <button class="btn btn-primary" style="flex:2;" onclick="submitCheckout()">Создать заказ 🚀</button>
      </div>
    </div>
  `;
}
