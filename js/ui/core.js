function render() {
  const screen = document.getElementById("screen");
  const scrollPos = screen.scrollTop;
  if (state.tab === "home") screen.innerHTML = renderHome();
  if (state.tab === "catalog") screen.innerHTML = renderCatalog();
  if (state.tab === "product") screen.innerHTML = renderProduct();
  if (state.tab === "cart") screen.innerHTML = renderCart();
  if (state.tab === "profile") screen.innerHTML = renderProfile();
  if (state.tab === "history") screen.innerHTML = renderHistory();
  if (state.tab === "order_success") screen.innerHTML = renderOrderSuccess();
  if (state.tab === "payment") screen.innerHTML = renderPayment(state.paymentData.type, state.paymentData.amount, state.paymentData.id, state.paymentData.card, CURRENT_LANG);
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

function showSkeleton() {
  const screen = document.getElementById("screen");
  screen.innerHTML = `
    <div style="padding:20px;">
      <div class="skeleton-block" style="width:132px;height:132px;border-radius:50%;margin:0 auto 24px;"></div>
      <div class="skeleton-block" style="height:120px;margin-bottom:20px;"></div>
      <div class="skeleton-block" style="height:52px;margin-bottom:24px;"></div>
      <div class="skeleton-block" style="height:90px;margin-bottom:16px;"></div>
      <div class="skeleton-block" style="height:90px;"></div>
    </div>
  `;
}

// ─────────────────── actions ───────────────────

function renderTabbar() {
  document.getElementById("tabbar").innerHTML = TABS.map(tab => `
    <button class="tab nav-btn ${state.tab === tab.id ? "active" : ""}" data-tab="${tab.id}">
      <span class="icon-wrap" style="font-size:19px;">
        ${tab.icon}
        ${tab.id === "cart" && cartCount() > 0 ? `<span class="cart-badge">${cartCount()}</span>` : ""}
      </span>
      <span>${t(tab.id)}</span>
    </button>
  `).join("");

  document.querySelectorAll('#tabbar .nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          if (typeof haptic === 'function') haptic('light');
          const tabId = e.currentTarget.getAttribute('data-tab');
          if (typeof window.setTab === 'function') {
              window.setTab(tabId);
          } else {
              state.tab = tabId;
              render();
          }
      });
  });
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