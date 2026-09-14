// ─────────────────── screens ───────────────────

function renderHome() {
  const featured = PRODUCTS.slice(0, 2);
  return `
    <div style="padding-top:8px;padding-bottom:24px;">
      <div class="px5" style="display:flex;justify-content:center;padding-bottom:20px;">
        <div style="width:132px;height:132px;border-radius:28px;overflow:hidden;box-shadow:0 16px 40px rgba(161,59,224,0.45);border:1px solid rgba(255,255,255,0.15);">
          <img src="${LOGO_URI}" style="width:100%;height:100%;object-fit:cover;">
        </div>
      </div>

      ${featured.length ? `
      <div class="px5" style="display:flex;justify-content:center;gap:16px;padding-bottom:24px;">
        ${featured.map((p, i) => `
          <div style="width:112px;height:172px;${i===1 ? "margin-top:16px;" : ""}border-radius:18px;overflow:hidden;position:relative;box-shadow:0 12px 32px rgba(161,59,224,0.3);">
            ${p.photo
              ? `<img data-src="${getPhoto(p.photo)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.background='${gradFor(p.id)}';this.remove();">`
              : `<div style="width:100%;height:100%;background:${gradFor(p.id)};display:flex;align-items:center;justify-content:center;font-size:34px;">🧴</div>`}
            <div style="position:absolute;bottom:0;left:0;right:0;padding:10px 10px 8px;background:linear-gradient(0deg,rgba(0,0,0,0.75),transparent);font-size:11.5px;font-weight:700;">${getName(p)}</div>
          </div>
        `).join("")}
      </div>` : ""}

      <div class="card px5" style="margin:0 20px 24px;padding:32px 24px;text-align:center;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-50%;left:50%;transform:translateX(-50%);width:240px;height:240px;background:radial-gradient(circle,rgba(192,38,211,0.25),transparent 70%);pointer-events:none;"></div>
        <div style="font-size:12px;font-weight:700;letter-spacing:0.25em;color:#e879f9;margin-bottom:10px;">SMOKE • LAB</div>
        <div style="font-size:26px;font-weight:800;letter-spacing:0.02em;">${t("best_shop")}</div>
        <div style="color:rgba(255,255,255,0.4);font-size:15px;margin-top:8px;">${t("best_shop_desc")}</div>
      </div>

      <div class="px5" style="margin-bottom:32px;">
        <button class="btn btn-primary" onclick="setTab('catalog')">${t("order_button")}</button>
      </div>

      <div class="card" style="margin:0 20px 24px;padding:24px 20px;">
        <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;">${t("info_text")}</p>
      </div>

      <div class="card" style="margin:0 20px 32px;padding:24px 20px;">
        <div style="font-size:22px;font-weight:800;">${t("payment_title")}</div>
        <div style="height:3px;width:64px;border-radius:2px;background:linear-gradient(90deg,#e6399b,#5b4bf0);margin:12px 0;"></div>
        <p style="color:rgba(255,255,255,0.5);font-size:14.5px;margin-bottom:16px;">${t("payment_desc")}</p>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="card" style="padding:14px 16px;font-weight:600;font-size:15px;">${t("cash")}</div>
          <div class="card" style="padding:14px 16px;font-weight:600;font-size:15px;">${t("card")}</div>
        </div>
      </div>

      <div class="px5" style="margin-bottom:16px;font-size:22px;font-weight:800;">${t("reviews_title")}</div>
      <div class="px5" style="display:flex;flex-direction:column;gap:16px;margin-bottom:32px;">
        ${REVIEWS.length ? REVIEWS.map(r => `
          <div class="card" style="padding:16px 20px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
              <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#c026d3,#7c3aed);display:flex;align-items:center;justify-content:center;font-weight:700;">★</div>
              <div class="stars">${starsSvg().repeat(r.rating)}<span style="color:rgba(255,255,255,0.4);font-size:12px;margin-left:4px;">${r.rating}.0</span></div>
            </div>
            <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.5;margin-bottom:8px;">${r.text}</p>
            <div style="color:rgba(255,255,255,0.3);font-size:12px;">${r.date ? r.date.slice(0,10) : ""}</div>
          </div>
        `).join("") : `<div style="color:rgba(255,255,255,0.3);font-size:14px;">${t("reviews_empty")}</div>`}
      </div>

      <div class="card" style="margin:0 20px;padding:28px 24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <img src="${LOGO_URI}" style="width:32px;height:32px;border-radius:8px;object-fit:cover;">
          <div style="font-size:22px;font-weight:800;letter-spacing:0.03em;">SMOKE LAB</div>
        </div>
        <div style="color:rgba(255,255,255,0.4);font-size:13.5px;margin-top:8px;text-transform:uppercase;line-height:1.4;">Nordrhein-Westfalen<br>Deutschland</div>
        <div style="font-weight:600;font-size:15px;margin-top:16px;">💬 Smoke Lab Club</div>
        <div style="font-size:20px;font-weight:800;margin:24px 0 12px;">${t("nav_title")}</div>
        <div style="display:flex;flex-direction:column;gap:10px;color:rgba(255,255,255,0.8);font-size:15px;font-weight:600;text-transform:uppercase;">
          <div onclick="setTab('home')">Главная</div>
          <div>${t("nav_about")}</div>
          <div>${t("nav_reviews")}</div>
          <div>${t("nav_tg")}</div>
        </div>
        <div class="card" style="margin-top:24px;padding:14px 16px;">
          <div style="color:rgba(255,255,255,0.4);font-size:13px;">© SMOKE LAB / 2026</div>
          <div style="color:#c026d3;font-weight:700;font-size:14px;margin-top:4px;">${t("better_title")}</div>
        </div>
      </div>
    </div>
  `;
}

function productCard(p) {
  const qty = cartQtyFor(p.id);
  const placeholder = `<div style="height:180px;border-radius:16px;background:${gradFor(p.id)};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,0.15),transparent 60%);"></div>
      <span style="font-size:44px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));">🧴</span>
    </div>`;
  const photoBlock = p.photo
    ? `<img data-src="${getPhoto(p.photo)}" style="width:100%;height:180px;object-fit:cover;border-radius:16px;box-shadow:0 8px 20px rgba(0,0,0,0.3);" onerror="this.outerHTML=${JSON.stringify(placeholder).replace(/"/g, "&quot;")};">`
    : placeholder;
  return `
    <div class="card" style="margin:0 20px 20px;overflow:hidden;">
      <div style="padding:16px 16px 0;display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="display:flex;gap:6px;">${badges(p)}</div>
        <div style="width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">♡</div>
      </div>
      <div style="padding:12px 16px 0;">${photoBlock}</div>
      <div style="padding:12px 16px 16px;">
        <div style="font-weight:700;font-size:17px;margin-bottom:6px;">${getName(p)}</div>
        ${p.description ? `<div style="color:rgba(255,255,255,0.4);font-size:13px;margin-bottom:10px;">${getDesc(p)}</div>` : ""}
        <div style="margin-bottom:12px;">${stockPill(p.stock)}</div>
        <div style="color:#e879f9;font-size:22px;font-weight:800;margin-bottom:12px;">${p.price}€</div>
        ${p.stock ? `
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button class="btn btn-primary" onclick="addToCart(${p.id})">${qty > 0 ? `Добавлено · ${qty}` : "Добавить"}</button>
            <button class="btn btn-green" onclick="addToCart(${p.id});setTab('cart')">${t("buy_now")}</button>
          </div>
        ` : `<button class="btn btn-outline" disabled>${t("out_of_stock")}</button>`}
      </div>
    </div>
  `;
}

function renderCatalog() {
  const filtered = PRODUCTS.filter(p =>
    (state.catFilter === t("all_cats") || p.category === state.catFilter) &&
    getName(p).toLowerCase().includes(state.query.toLowerCase())
  );
  return `
    <div style="padding-top:8px;padding-bottom:16px;">
      <div class="section-title"><h2>${t("catalog_title")}</h2><p>${t("catalog_subtitle")}</p></div>
      <div class="px5" style="margin-bottom:16px;">
        <div class="card" style="display:flex;align-items:center;gap:10px;padding:14px 16px;">
          <span style="opacity:0.3;">🔎</span>
          <input id="searchInput" placeholder="${t('search_placeholder')}" value="${state.query}" style="width:100%;font-size:14.5px;" oninput="state.query=this.value;renderScreenPreserveFocus('searchInput')">
        </div>
      </div>
      <div class="px5 no-scroll" style="display:flex;gap:10px;margin-bottom:20px;overflow-x:auto;">
        ${CATEGORIES.map(c => `
          <button onclick="state.catFilter='${c}';render()" style="flex-shrink:0;white-space:nowrap;border-radius:999px;padding:10px 16px;font-size:14px;font-weight:700;border:1px solid ${state.catFilter===c ? "#fff" : "rgba(255,255,255,0.15)"};background:${state.catFilter===c ? "#fff" : "transparent"};color:${state.catFilter===c ? "#000" : "rgba(255,255,255,0.7)"};">${c}</button>
        `).join("")}
      </div>
      ${filtered.map(productCard).join("") || `<div style="text-align:center;padding:50px 0;"><div style="font-size:38px;margin-bottom:12px;opacity:0.5;">🔍</div><div style="color:rgba(255,255,255,0.35);font-size:14.5px;">${t("catalog_empty")}</div></div>`}
    </div>
  `;
}

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

  const items = cartData.items;
  const total = cartData.total;
  const discountedTotal = state.appliedPromo ? Math.round(total * (1 - state.appliedPromo.discount / 100)) : total;

  if (state.checkoutStep === "delivery") {
    return `
      <div style="padding-top:8px;padding-bottom:16px;">
        <div class="section-title"><h2>${t("checkout_title")}</h2><p>${t("checkout_subtitle")}</p></div>
        <div class="px5" style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
          <button class="btn ${state.delivery==='pickup' ? 'btn-primary' : 'btn-outline'}" style="opacity:1;" onclick="state.delivery='pickup';render()">${t("pickup")}</button>
          <button class="btn ${state.delivery==='delivery' ? 'btn-primary' : 'btn-outline'}" style="opacity:1;" onclick="state.delivery='delivery';render()">${t("delivery")}</button>
        </div>
        ${state.delivery === "pickup" ? `
          <div class="px5" style="margin-bottom:20px;">
            <div style="font-weight:700;font-size:15px;margin-bottom:10px;">${t("pickup_city")}</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${CITIES.map(c => `<button class="btn ${state.city===c.name ? 'btn-primary' : 'btn-outline'}" style="opacity:1;" onclick="state.city='${c.name}';render()">${c.name}</button>`).join("") || '<div style="color:rgba(255,255,255,0.3);font-size:13px;">Города пока не настроены</div>'}
            </div>
          </div>
        ` : ""}
        ${state.delivery === "delivery" ? `
          <div class="px5" style="margin-bottom:20px;">
            <div style="font-weight:700;font-size:15px;margin-bottom:10px;">${t("delivery_addr")}</div>
            <div class="card"><input id="addrInput" placeholder="${t('addr_placeholder')}" style="width:100%;padding:14px 16px;font-size:14.5px;" oninput="state.city=this.value"></div>
          </div>
        ` : ""}
        <div class="px5" style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-primary" onclick="submitCheckout()" ${(!state.delivery || !state.city) ? "disabled style='opacity:0.4;'" : ""}>${t("confirm_order")} · ${discountedTotal}€</button>
          <button class="btn btn-outline" onclick="state.checkoutStep=null;render()">${t("cancel")}</button>
        </div>
      </div>
    `;
  }

  return `
    <div style="padding-top:8px;padding-bottom:16px;">
      <div class="section-title"><h2>${t("cart_title")}</h2><p>${t("cart_subtitle")}</p></div>
      ${items.length === 0
        ? `<div style="text-align:center;padding:60px 0;"><div style="font-size:42px;margin-bottom:12px;opacity:0.5;">🛒</div><div style="color:rgba(255,255,255,0.35);font-size:15px;">${t("cart_empty")}</div></div>`
        : `<div class="px5" style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
            ${items.map(i => `
              <div class="card" style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;">
                <div><div style="font-weight:600;font-size:14.5px;">${getName(i)}</div><div style="color:rgba(255,255,255,0.4);font-size:13px;">x${i.qty}</div></div>
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="color:#e879f9;font-weight:700;font-size:15px;">${i.price*i.qty}€</div>
                  <span onclick="removeFromCart(${i.product_id})" style="color:rgba(255,255,255,0.3);font-size:13px;cursor:pointer;">✕</span>
                </div>
              </div>
            `).join("")}
          </div>`
      }
      <div class="card px5" style="margin:0 20px 16px;padding:20px;">
        <div style="font-weight:700;font-size:15px;margin-bottom:12px;">Промокод</div>
        <input id="promoInput" placeholder="Например SMOKE10" value="${state.promoCode || ""}" oninput="state.promoCode=this.value" style="width:100%;border-radius:12px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);padding:12px 16px;font-size:14.5px;margin-bottom:12px;">
        <button class="btn btn-primary" onclick="applyPromo()">${t("promo_apply")}</button>
        ${state.appliedPromo ? `<div style="color:#34d67f;font-size:13px;margin-top:10px;">✓ Промокод ${state.appliedPromo.code} применён: -${state.appliedPromo.discount}%</div>` : ""}
      </div>
      <div class="card" style="margin:0 20px 20px;padding:16px 20px;">
        ${state.appliedPromo ? `
          <div style="display:flex;justify-content:space-between;font-size:14px;color:rgba(255,255,255,0.4);margin-bottom:6px;"><span>${t("sum")}</span><span>${total}€</span></div>
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#34d67f;margin-bottom:10px;"><span>Скидка ${state.appliedPromo.discount}%</span><span>-${Math.round(total*state.appliedPromo.discount/100)}€</span></div>
        ` : ""}
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:17px;font-weight:600;">${t("total")}</span>
          <span style="font-size:22px;font-weight:800;">${discountedTotal}€</span>
        </div>
      </div>
      <div class="px5"><button class="btn btn-primary" ${items.length===0 ? "disabled style='opacity:0.4;'" : ""} onclick="state.checkoutStep='delivery';render()">${t("checkout_action")}</button></div>
    </div>
  `;
}

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

  return `
    <div style="padding-top:8px;padding-bottom:16px;">
      <div class="section-title"><h2>${t("profile_title")}</h2><p>${t("profile_subtitle")}</p></div>
      <div class="card" style="margin:0 20px 20px;padding:28px 24px;text-align:center;">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#c026d3,#7c3aed);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;">👤</div>
        <div style="font-weight:700;font-size:17px;">Клиент Smoke Lab</div>
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

const TOPUP_METHODS = [
  { id: "mono", name: "Monobank", icon: "🖤", hint: "Оплата картой Monobank" },
  { id: "privat", name: "Приват24", icon: "💚", hint: "Оплата через Приват24" },
  { id: "visa_mc", name: "Visa / Mastercard", icon: "💳", hint: "Любая карта другого банка" },
  { id: "other", name: "Другой банк", icon: "🏦", hint: "Любой банк из списка при оплате" },
];

function renderTopup() {
  const amounts = [100, 250, 500, 1000, 2000];
  return `
    <div style="padding-top:8px;padding-bottom:16px;">
      <div class="section-title"><h2>Пополнение баланса</h2><p>Выберите сумму и способ оплаты</p></div>

      <div class="px5" style="margin-bottom:20px;">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px;">Сумма пополнения</div>
        <div class="card"><input id="topupAmountInput" type="number" inputmode="numeric" placeholder="Введите сумму, €" value="${state.topupAmount}" style="width:100%;padding:14px 16px;font-size:14.5px;" oninput="state.topupAmount=this.value"></div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          ${amounts.map(a => `<button class="btn ${String(state.topupAmount)===String(a) ? 'btn-primary' : 'btn-outline'}" style="opacity:1;flex:1;min-width:64px;padding:8px;font-size:13.5px;" onclick="state.topupAmount='${a}';render()">${a}€</button>`).join("")}
        </div>
      </div>

      <div class="px5" style="margin-bottom:8px;">
        <div style="font-weight:700;font-size:15px;margin-bottom:10px;">Способ оплаты</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${TOPUP_METHODS.map(m => `
            <button class="card" style="display:flex;align-items:center;gap:14px;padding:14px 16px;text-align:left;border:1px solid ${state.topupMethod===m.id ? '#c026d3' : 'rgba(255,255,255,0.1)'};background:${state.topupMethod===m.id ? 'rgba(192,38,211,0.12)' : 'rgba(255,255,255,0.03)'};" onclick="state.topupMethod='${m.id}';render()">
              <span style="font-size:22px;">${m.icon}</span>
              <span style="flex:1;">
                <div style="font-weight:600;font-size:14.5px;">${m.name}</div>
                <div style="color:rgba(255,255,255,0.4);font-size:12.5px;margin-top:2px;">${m.hint}</div>
              </span>
              <span style="width:20px;height:20px;border-radius:50%;border:2px solid ${state.topupMethod===m.id ? '#c026d3' : 'rgba(255,255,255,0.25)'};display:flex;align-items:center;justify-content:center;">
                ${state.topupMethod===m.id ? '<span style="width:10px;height:10px;border-radius:50%;background:#c026d3;display:block;"></span>' : ''}
              </span>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="px5" style="margin:12px 0 20px;">
        <div style="color:rgba(255,255,255,0.45);font-size:12.5px;line-height:1.5;padding:0 4px;">
          Не нашли свой банк в списке? Не переживайте — выбирайте любой из вариантов, оплата всё равно пройдёт корректно любой картой.
        </div>
      </div>

      <div class="px5" style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-primary" onclick="submitTopup()" ${(!state.topupAmount || Number(state.topupAmount)<=0 || !state.topupMethod) ? "disabled style='opacity:0.4;'" : ""}>Пополнить на ${state.topupAmount || 0}€</button>
        <button class="btn btn-outline" onclick="state.topupStep=null;state.topupAmount='';state.topupMethod=null;render()">${t("cancel")}</button>
      </div>
    </div>
  `;
}

async function submitTopup() {
  // ВАЖНО: сервер сейчас зачисляет баланс сразу же (см. /api/topup в server.js) — это заглушка для теста.
  // Перед реальным запуском подключите настоящий приём платежей (Monobank Acquiring, LiqPay, ЮKassa и т.п.)
  // и зачисляйте баланс только после подтверждения оплаты от платёжной системы (по вебхуку), а не здесь.
  try {
    const res = await api("/api/topup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID, amount: Number(state.topupAmount), method: state.topupMethod }),
    });
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
    alert(`✅ Баланс пополнен на ${state.topupAmount}€. Текущий баланс: ${res.balance}€`);
    state.topupStep = null; state.topupAmount = ""; state.topupMethod = null;
    await loadProfile();
    render();
  } catch (e) {
    alert("Не удалось пополнить баланс. Попробуйте снова.");
  }
}

function renderHistory() {
  if (!USER_ID) {
    return `
      <div style="padding-top:8px;">
        <div class="section-title"><h2>${t("history_title")}</h2><p>${t("history_subtitle")}</p></div>
        <div class="px5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px 0;font-size:14.5px;">
          ${t("history_tg_req")}
        </div>
      </div>
    `;
  }
  const colors = { "Новый": "#facc15", "В обработке": "#38bdf8", "Отправлен/Готов": "#a78bfa", "Выполнен": "#34d67f", "Отменён": "#f87171" };
  return `
    <div style="padding-top:8px;padding-bottom:16px;">
      <div class="section-title"><h2>${t("history_title")}</h2><p>${t("history_subtitle")}</p></div>
      <div class="px5" style="display:flex;flex-direction:column;gap:12px;">
        ${ORDER_HISTORY.map(o => `
          <div class="card" style="padding:16px 20px;display:flex;justify-content:space-between;">
            <div><div style="font-weight:600;font-size:14.5px;">Заказ №${o.id}</div><div style="color:rgba(255,255,255,0.4);font-size:12.5px;margin-top:2px;">${o.date}</div></div>
            <div style="text-align:right;"><div style="font-weight:700;font-size:15px;">${o.total}€</div><div style="font-size:12.5px;font-weight:600;color:${colors[o.status] || '#fff'};">${o.status}</div></div>
          </div>
        `).join("") || `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px 0;font-size:14px;">${t("history_empty")}</div>`}
      </div>
    </div>
  `;
}

function renderTabbar() {
  document.getElementById("tabbar").innerHTML = TABS.map(tab => `
    <button class="tab ${state.tab === tab.id ? "active" : ""}" onclick="haptic('light');setTab('${tab.id}')">
      <span class="icon-wrap" style="font-size:19px;">
        ${tab.icon}
        ${tab.id === "cart" && cartCount() > 0 ? `<span class="cart-badge">${cartCount()}</span>` : ""}
      </span>
      <span>${t(tab.id)}</span>
    </button>
  `).join("");
}

// ─────────────────── ring background (кольца) ───────────────────

function renderRings() {
  const el = document.getElementById("ringsBg");
  let html = '<div class="glow"></div>';
  for (let r = 1; r <= 6; r++) {
    const size = r * 90;
    html += `<div class="ring" style="width:${size}px;height:${size}px;"></div>`;
  }
  el.innerHTML = html;
}

// ─────────────────── skeleton при первой загрузке ───────────────────

function showSkeleton() {
  const screen = document.getElementById("screen");
  screen.innerHTML = `
    <div style="padding:20px;">
      <div style="color:red;font-size:24px;text-align:center;padding:20px;">SKELETON ACTIVE</div><div class="skeleton-block" style="width:132px;height:132px;border-radius:28px;margin:0 auto 24px;"></div>
      <div class="skeleton-block" style="height:120px;margin-bottom:20px;"></div>
      <div class="skeleton-block" style="height:52px;margin-bottom:24px;"></div>
      <div class="skeleton-block" style="height:90px;margin-bottom:16px;"></div>
      <div class="skeleton-block" style="height:90px;"></div>
    </div>
  `;
}

// ─────────────────── actions ───────────────────

async function setTab(id) {
  state.tab = id;
  state.checkoutStep = null;
  if (id === "cart") await loadCart();
  if (id === "profile") await loadProfile();
  if (id === "history") await loadOrders();
  render();
}

async function applyPromo() {
  const code = (state.promoCode || "").trim();
  if (!code) return;
  try {
    const res = await api(`/api/promo/check?code=${encodeURIComponent(code)}`);
    if (!res.valid) {
      state.appliedPromo = null;
      alert("Такого промокода нет или он больше не активен");
    } else {
      state.appliedPromo = { code: res.code, discount: res.discount };
      if (tg) tg.HapticFeedback && tg.HapticFeedback.notificationOccurred("success");
    }
    render();
  } catch (e) {
    alert("Не удалось проверить промокод");
  }
}

async function submitCheckout() {
  try {
    const res = await api("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID, delivery_method: state.delivery, city: state.city, promo_code: state.appliedPromo ? state.appliedPromo.code : null }),
    });
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
    alert(`✅ Заказ №${res.order_id} оформлен на сумму ${res.total}€`);
    state.checkoutStep = null; state.delivery = null; state.city = null; state.promoCode = ""; state.appliedPromo = null;
    await loadCart();
    setTab("history");
  } catch (e) {
    alert("Не получилось оформить заказ. Проверьте наличие товаров и попробуйте снова.");
  }
}

// ─────────────────── render ───────────────────

function render() {
  const screen = document.getElementById("screen");
  const scrollPos = screen.scrollTop;
  if (state.tab === "home") screen.innerHTML = renderHome();
  if (state.tab === "catalog") screen.innerHTML = renderCatalog();
  if (state.tab === "cart") screen.innerHTML = renderCart();
  if (state.tab === "profile") screen.innerHTML = renderProfile();
  if (state.tab === "history") screen.innerHTML = renderHistory();
  renderTabbar();
  screen.scrollTop = (state._preserveScroll ? scrollPos : 0);
  state._preserveScroll = false;
  if (typeof loadNgrokImages === "function") setTimeout(loadNgrokImages, 50);
}

function renderScreenPreserveFocus(inputId) {
  state._preserveScroll = true;
  render();
  const el = document.getElementById(inputId);
  if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
}


// ─────────────────── старт ───────────────────

async function registerReferralIfNeeded() {
  // Если приложение открыто по реферальной ссылке (?startapp=ref_<id> в самой ссылке на бота),
  // Telegram передаёт этот параметр в initDataUnsafe.start_param — регистрируем приглашение.
  const startParam = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (!USER_ID || !startParam || !startParam.startsWith("ref_")) return;
  const inviterId = startParam.slice(4);
  if (!inviterId || inviterId === String(USER_ID)) return;
  try {
    await api("/api/referral/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviter_id: inviterId, user_id: USER_ID }),
    });
  } catch (e) { /* не критично, просто не засчитаем приглашение */ }
}
