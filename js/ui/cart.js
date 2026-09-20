
function renderCart() {
  if (!USER_ID) {
    return `
      <div style="padding-top:8px;">
        <div class="section-title"><h2>${t("cart_title")}</h2><p>${t("cart_subtitle")}</p></div>
        <div class="px5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px 0;font-size:14.5px;">
          ${t("cart_tg_req")}
        </div>
      </div>
    `;
  }

  const items = cartData.items || [];
  let total = items.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const discountedTotal = state.appliedPromo ? Math.round(total * (1 - state.appliedPromo.discount / 100)) : total;

  if (items.length === 0) {
    state.checkoutStep = null;
    return `
      <div style="padding-top:8px;padding-bottom:16px;">
        <div class="section-title"><h2>${t("cart_title")}</h2><p>${t("cart_subtitle")}</p></div>
        <div style="text-align:center;padding:60px 0;">
          <div style="font-size:42px;margin-bottom:12px;opacity:0.5;">🛒</div>
          <div style="color:rgba(255,255,255,0.35);font-size:15px;margin-bottom:30px;">${t("cart_empty")}</div>
          ${getReferralCTA()}
        </div>
      </div>
    `;
  }

  if (state.checkoutStep === "delivery") return renderStepDelivery();
  if (state.checkoutStep === "payment") return renderStepPayment();
  if (state.checkoutStep === "confirm") return renderStepConfirm(items, total, discountedTotal);

  const FREE_SHIPPING_THRESHOLD = 75;
  const progress = Math.min(100, (discountedTotal / FREE_SHIPPING_THRESHOLD) * 100);
  const leftForFree = FREE_SHIPPING_THRESHOLD - discountedTotal;
  const cartIds = items.map(i => i.product_id);
  const crossSells = PRODUCTS.filter(p => !cartIds.includes(p.id) && p.stock > 0).sort(() => Math.random() - 0.5).slice(0, 4);

  return `
    <div style="padding-top:8px;padding-bottom:16px;animation:fadeIn 0.3s ease;">
      <div class="section-title" style="margin-bottom:16px;">
        <h2>${t("cart_title")}</h2>
        <p>${items.length} ${CURRENT_LANG === 'de' ? 'Artikel' : 'товар(ов)'} — ${discountedTotal}€</p>
      </div>

      <div class="px5" style="margin-bottom:20px;">
        <div class="card" style="padding:16px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;">
            <span>🚚 ${t("free_shipping")}</span>
            <span style="color:${progress===100?'#34d67f':'#e879f9'};">${progress===100 ? t("free_shipping_done") : `${leftForFree}€`}</span>
          </div>
          <div style="width:100%;height:6px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">
            <div style="width:${progress}%;height:100%;background:${progress===100?'#34d67f':'linear-gradient(90deg,#c026d3,#7c3aed)'};transition:width 0.4s ease;"></div>
          </div>
        </div>
      </div>

      <div class="px5" style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        ${items.map(i => `
          <div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div style="font-weight:600;font-size:14.5px;padding-right:12px;line-height:1.3;">${getName(i)}</div>
              <div style="color:rgba(255,255,255,0.4);font-size:13px;white-space:nowrap;">${i.price}€ / ${CURRENT_LANG==='de'?'Stk':'шт'}</div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border-radius:10px;padding:4px;">
                <button onclick="removeFromCart(${i.product_id})" style="width:32px;height:32px;border:none;background:rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;">-</button>
                <span style="font-weight:700;font-size:15px;min-width:24px;text-align:center;">${i.qty}</span>
                <button onclick="addToCart(${i.product_id})" style="width:32px;height:32px;border:none;background:linear-gradient(135deg,#c026d3,#7c3aed);border-radius:8px;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;">+</button>
              </div>
              <div style="color:#e879f9;font-weight:800;font-size:16px;">${i.price*i.qty}€</div>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="card" style="margin:0 20px 16px;padding:20px;">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px;">${t("promo_title")}</div>
        <div style="display:flex;gap:8px;">
          <input id="promoInput" placeholder="${t("promo_input")}" value="${state.promoCode||""}" oninput="state.promoCode=this.value" style="flex:1;border-radius:12px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);padding:12px 16px;font-size:14.5px;">
          <button class="btn btn-outline" style="padding:0 16px;" onclick="applyPromo()">✅</button>
        </div>
        ${state.appliedPromo ? `<div style="color:#34d67f;font-size:13px;margin-top:10px;">✅ ${t("promo_applied")}: -${state.appliedPromo.discount}%</div>` : ""}
      </div>

      <div class="card" style="margin:0 20px 24px;padding:16px 20px;">
        ${state.appliedPromo ? `
          <div style="display:flex;justify-content:space-between;font-size:14px;color:rgba(255,255,255,0.4);margin-bottom:6px;"><span>${t("sum")}</span><span>${total}€</span></div>
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#34d67f;margin-bottom:10px;"><span>${t("discount")} ${state.appliedPromo.discount}%</span><span>-${Math.round(total*state.appliedPromo.discount/100)}€</span></div>
        ` : ""}
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:17px;font-weight:600;">${t("total")}</span>
          <span style="font-size:22px;font-weight:900;color:#fff;">${discountedTotal}€</span>
        </div>
      </div>

      ${crossSells.length ? `
        <div style="margin-bottom:24px;">
          <div style="padding:0 20px;font-weight:800;font-size:16px;margin-bottom:12px;">${t("bought_together")} 🔥</div>
          <div class="no-scroll" style="display:flex;gap:12px;overflow-x:auto;padding:0 20px 10px;scroll-snap-type:x mandatory;">
            ${crossSells.map(p => `
              <div class="card" style="min-width:140px;padding:12px;border-radius:12px;scroll-snap-align:start;display:flex;flex-direction:column;align-items:center;text-align:center;">
                <div style="height:70px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">
                  ${p.photo ? `<div style="position:relative;width:60px;height:60px;border-radius:8px;overflow:hidden;"><div class="skeleton-block" style="position:absolute;inset:0;z-index:1;"></div><img src="${getPhoto(p.photo)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:2;opacity:0;transition:opacity 0.3s;" onerror="this.onerror=null; this.src='/placeholder.jpg';" onload="this.style.opacity=1;this.previousElementSibling.style.display='none';"></div>` : `<div style="font-size:24px;">🧴</div>`}
                </div>
                <div style="font-size:12px;font-weight:600;line-height:1.2;margin-bottom:4px;height:28px;overflow:hidden;">${getName(p)}</div>
                <div style="color:#e879f9;font-weight:800;font-size:13px;margin-bottom:8px;">${p.price}€</div>
                <button class="btn btn-primary" style="padding:4px 12px;font-size:11px;width:100%;" onclick="addToCart(${p.id})">${t("add")}</button>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <div class="px5">
        <button class="btn btn-primary" style="width:100%;padding:14px;font-size:16px;font-weight:800;" onclick="state.checkoutStep='payment';render()">${t("checkout_action")} 🚀</button>
      </div>
    </div>
  `;
}

function getStepper(stepIndex) {
  const steps = [t("cart_title"), t("delivery"), t("payment"), t("confirm")];
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding:0 20px;">
      ${steps.map((s, i) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;">
          <div style="width:24px;height:24px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;${i<=stepIndex?'background:#c026d3;color:#fff;':'background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);'}">
            ${i+1}
          </div>
          <div style="font-size:10px;font-weight:600;color:${i<=stepIndex?'#c026d3':'rgba(255,255,255,0.4)'};text-transform:uppercase;text-align:center;">${s}</div>
        </div>
        ${i < steps.length-1 ? `<div style="height:2px;flex:1;background:${i<stepIndex?'#c026d3':'rgba(255,255,255,0.1)'};margin-bottom:16px;"></div>` : ''}
      `).join("")}
    </div>
  `;
}

function renderStepDelivery() {
  return `
    <div style="padding-top:16px;padding-bottom:24px;animation:fadeIn 0.3s ease;">
      ${getStepper(1)}
      <div class="px5" style="margin-bottom:20px;">
        <h3 style="margin:0 0 16px 0;font-size:18px;">${t("checkout_subtitle")}</h3>
        <div style="display:flex;gap:12px;margin-bottom:20px;">
          <div class="card" style="flex:1;padding:16px;text-align:center;cursor:pointer;border:2px solid ${state.delivery==='pickup'?'#c026d3':'transparent'};" onclick="state.delivery='pickup';render()">
            <div style="font-size:24px;margin-bottom:8px;">📦</div>
            <div style="font-weight:700;font-size:14px;">${t("pickup")}</div>
          </div>
          <div class="card" style="flex:1;padding:16px;text-align:center;cursor:pointer;border:2px solid ${state.delivery==='delivery'?'#c026d3':'transparent'};" onclick="state.delivery='delivery';render()">
            <div style="font-size:24px;margin-bottom:8px;">🚚</div>
            <div style="font-weight:700;font-size:14px;">${CURRENT_LANG==='de'?'Post / Kurier':'Почта / Курьер'}</div>
          </div>
        </div>
        ${state.delivery==="pickup" ? `
          <div style="animation:fadeIn 0.3s ease;">
            <div style="font-weight:700;font-size:14px;margin-bottom:10px;">${t("pickup_city")}:</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${CITIES.map(c => `<button class="btn ${state.city===c.name?'btn-primary':'btn-outline'}" onclick="state.city='${c.name}';render()">${c.name}</button>`).join("") || `<div style="color:rgba(255,255,255,0.3);font-size:13px;">${t("cities_empty")}</div>`}
            </div>
          </div>
        ` : ""}
        ${state.delivery==="delivery" ? `
          <div style="animation:fadeIn 0.3s ease;">
            <div style="font-weight:700;font-size:14px;margin-bottom:10px;">${t("delivery_addr")}:</div>
            <div class="card"><input id="addrInput" placeholder="${t("addr_placeholder")}" value="${state.city||''}" style="width:100%;padding:14px 16px;font-size:14.5px;" oninput="state.city=this.value"></div>
          </div>
        ` : ""}
      </div>
      <div class="px5" style="display:flex;gap:12px;">
        <button class="btn btn-outline" style="flex:1;" onclick="state.checkoutStep='payment';render()">${t("back")}</button>
        <button class="btn btn-primary" style="flex:2;" ${(!state.delivery||!state.city)?"disabled style='opacity:0.4;'":""} onclick="state.checkoutStep='confirm';render()">${CURRENT_LANG==='de'?'Weiter':'Далее'}</button>
      </div>
    </div>
  `;
}

function renderStepPayment() {
  const items = cartData.items || [];
  const total = items.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const discountedTotal = state.appliedPromo ? Math.round(total * (1 - state.appliedPromo.discount / 100)) : total;
  const balance = (typeof PROFILE !== 'undefined' && PROFILE) ? (PROFILE.balance || 0) : 0;
  const hasEnough = balance >= discountedTotal;

  return `
    <div style="padding-top:16px;padding-bottom:24px;animation:fadeIn 0.3s ease;">
      ${getStepper(2)}
      <div class="px5" style="margin-bottom:24px;">
        <h3 style="margin:0 0 16px 0;font-size:18px;">${t("payment_method_label")}</h3>
        <div style="display:flex;flex-direction:column;gap:12px;">

          <div class="card" style="padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer;border:2px solid ${state.payment==='balance'?'#c026d3':'transparent'};" onclick="
            if (!${hasEnough}) {
                alert('Недостатньо коштів на балансі! Будь ласка, поповніть рахунок.');
                state.tab = 'profile';
                state.checkoutStep = null;
                render();
                return;
            }
            state.payment='balance';
            render();
          ">
            <div style="font-size:24px;">💰</div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:15px;">С баланса бота</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.4);">Ваш баланс: ${balance}€</div>
            </div>
            ${!hasEnough ? `<div style="font-size:11px;color:#ef4444;font-weight:600;background:rgba(239,68,68,0.1);padding:4px 8px;border-radius:6px;">Не вистачає</div>` : ''}
          </div>

          <div class="card" style="padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer;border:2px solid ${state.payment==='cash'?'#c026d3':'transparent'};" onclick="state.payment='cash';render()">
            <div style="font-size:24px;">💵</div>
            <div>
              <div style="font-weight:700;font-size:15px;">${t("cash")}</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.4);">${t("pay_cash")}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="px5" style="display:flex;gap:12px;">
        <button class="btn btn-outline" style="flex:1;" onclick="state.checkoutStep=null;render()">${t("back")}</button>
        <button class="btn btn-primary" style="flex:2;" ${!state.payment?"disabled style='opacity:0.4;'":""} onclick="state.checkoutStep='delivery';render()">${CURRENT_LANG==='de'?'Weiter':'Далее'}</button>
      </div>
    </div>
  `;
}


function renderStepConfirm(items, total, discountedTotal) {
  return `
    <div style="padding-top:16px;padding-bottom:24px;animation:fadeIn 0.3s ease;">
      ${getStepper(3)}
      <div class="px5" style="margin-bottom:24px;">
        <h3 style="margin:0 0 16px 0;font-size:18px;">${t("checkout_title")}</h3>
        <div class="card" style="padding:16px;margin-bottom:16px;">
          <div style="font-weight:700;font-size:14px;color:#c026d3;margin-bottom:8px;">${t("cart_title")} (${items.length})</div>
          ${items.map(i => `
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
              <span style="color:rgba(255,255,255,0.8);">${getName(i)} <b style="color:#fff;">x${i.qty}</b></span>
              <span style="font-weight:700;">${i.price*i.qty}€</span>
            </div>
          `).join("")}
          <div style="height:1px;background:rgba(255,255,255,0.1);margin:12px 0;"></div>
          <div style="display:flex;justify-content:space-between;font-weight:800;font-size:16px;">
            <span>${t("total")}</span>
            <span style="color:#34d67f;">${discountedTotal}€</span>
          </div>
        </div>
        <div class="card" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:14px;color:#c026d3;margin-bottom:2px;">${t("delivery")}</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.8);">${state.delivery==='pickup'?t("pickup"):(CURRENT_LANG==='de'?'Post/Kurier':'Почта')} — ${state.city}</div>
            </div>
            <span onclick="state.checkoutStep='delivery';render()" style="font-size:12px;color:rgba(255,255,255,0.4);text-decoration:underline;cursor:pointer;">${CURRENT_LANG==='de'?'Ändern':'Изменить'}</span>
          </div>
          <div style="height:1px;background:rgba(255,255,255,0.1);"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:14px;color:#c026d3;margin-bottom:2px;">${t("payment")}</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.8);">${(state.payment||'').toUpperCase()}</div>
            </div>
            <span onclick="state.checkoutStep='payment';render()" style="font-size:12px;color:rgba(255,255,255,0.4);text-decoration:underline;cursor:pointer;">${CURRENT_LANG==='de'?'Ändern':'Изменить'}</span>
          </div>
        </div>
      </div>
      <div class="px5" style="display:flex;gap:12px;">
        <button class="btn btn-outline" style="flex:1;" onclick="state.checkoutStep='delivery';render()">${t("back")}</button>
        <button class="btn btn-primary" style="flex:2;" onclick="submitCheckout()">${t("confirm_order")} 🚀</button>
      </div>
    </div>
  `;
}

function renderOrderSuccess() {
  const orderId = state.paymentData ? state.paymentData.id : '???';
  return `
    <div style="padding-top:40px;padding-bottom:16px;text-align:center;animation:fadeIn 0.3s ease;">
      <div style="font-size:64px;margin-bottom:16px;">🎉</div>
      <h2 style="font-size:24px;font-weight:800;margin-bottom:8px;">${CURRENT_LANG==='de'?'Vielen Dank!':'Спасибо!'}</h2>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;margin-bottom:32px;line-height:1.5;padding:0 20px;">
        ${CURRENT_LANG==='de'?'Ihre Bestellung #'+orderId+' wurde erfolgreich aufgegeben und wird bearbeitet.':'Ваш заказ #'+orderId+' успешно оформлен и передан в обработку.'}
      </p>
      
      <div class="px5" style="display:flex;flex-direction:column;gap:12px;">
        <button class="btn btn-primary" style="width:100%;padding:14px;font-size:16px;" onclick="state.tab='history';render()">${CURRENT_LANG==='de'?'Bestellverlauf':'История заказов'}</button>
        <button class="btn btn-outline" style="width:100%;padding:14px;font-size:16px;" onclick="state.tab='home';render()">${CURRENT_LANG==='de'?'Zur Startseite':'На главную'}</button>
      </div>
    </div>
  `;
}
