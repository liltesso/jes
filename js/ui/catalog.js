function renderCatalog() {
  const filtered = PRODUCTS.filter(p =>
    (state.catFilter === "ALL" || p.category === state.catFilter) &&
    getName(p).toLowerCase().includes(state.query.toLowerCase())
  );
  return `
    <div style="padding-top:8px;padding-bottom:16px;">
      <div class="section-title"><h2>${t("catalog_title")}</h2><p>${t("catalog_subtitle")}</p></div>
      <div class="px5" style="margin-bottom:16px;">
        <div class="card" style="display:flex;align-items:center;gap:10px;padding:14px 16px;">
          <span style="opacity:0.3;">🔎</span>
          <input id="searchInput" placeholder="${t('search_placeholder')}" value="${state.query}" style="width:100%;font-size:14.5px;" oninput="onSearchInput(this.value)">
        </div>
      </div>
      <div class="px5 no-scroll" style="display:flex;gap:10px;margin-bottom:20px;overflow-x:auto;">
        ${CATEGORIES.map(c => {
          const displayLabel = c === "ALL" ? t("all_cats") : c;
          return `<button onclick="state.catFilter='${c}';render()" style="flex-shrink:0;white-space:nowrap;border-radius:999px;padding:10px 16px;font-size:14px;font-weight:700;border:1px solid ${state.catFilter===c ? "#fff" : "rgba(255,255,255,0.15)"};background:${state.catFilter===c ? "#fff" : "transparent"};color:${state.catFilter===c ? "#000" : "rgba(255,255,255,0.7)"};">${displayLabel}</button>`;
        }).join("")}
      </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; padding:0 20px; margin-bottom:20px;">
        ${filtered.map(productCard).join("") || `<div style="grid-column: span 2; text-align:center;padding:50px 0;"><div style="font-size:38px;margin-bottom:12px;opacity:0.5;">🔍</div><div style="color:rgba(255,255,255,0.35);font-size:14.5px;">${t("catalog_empty")}</div></div>`}
      
    </div>
  `;
}

function productCard(p) {
  const qty = cartQtyFor(p.id);
  const placeholder = `<div style="width:100%;aspect-ratio:1/1;border-radius:12px;background:${gradFor(p.id)};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,0.15),transparent 60%);"></div>
      <span style="font-size:34px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));">🧴</span>
    </div>`;
  const photoBlock = p.photo
    ? `<div style="position:relative; width:100%; aspect-ratio:1/1; border-radius:12px; overflow:hidden;">
         <div class="skeleton-block" style="position:absolute; inset:0; z-index:1;"></div>
         <img loading="lazy" src="${getPhoto(p.photo)}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; z-index:2; opacity:0; transition: opacity 0.3s;" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/150?text=No+Image\';" onload="this.style.opacity=1; this.previousElementSibling.style.display='none';">
       </div>`
    : placeholder;
  return `
    <div class="card" style="display:flex;flex-direction:column;overflow:hidden;position:relative;">

      <div onclick="toggleWishlist(${p.id}, event)" style="position:absolute; top:8px; right:8px; z-index:5; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; cursor:pointer;">
        ${(window.getWishlist && getWishlist().includes(p.id)) ? '<span style="color:#ef4444;font-size:16px;">❤️</span>' : '<span style="color:#fff;font-size:16px;">🤍</span>'}
      </div>

      <div style="position:absolute; top:8px; left:8px; z-index:2; display:flex; gap:4px; flex-wrap:wrap; max-width:70%;">${badges(p)}</div>
      <div style="padding:10px 10px 0; cursor:pointer; position:relative;" onclick="openProduct(${p.id})">${photoBlock}</div>
      <div style="padding:10px; display:flex; flex-direction:column; flex:1;">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px;cursor:pointer;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;" onclick="openProduct(${p.id})">${getName(p)}</div>
        <div style="margin-bottom:8px;transform:scale(0.85);transform-origin:left;">${stockPill(p.stock)}</div>
        <button onclick="openProduct(${p.id})" style="width:100%;padding:6px;margin-bottom:8px;border-radius:8px;border:1px solid rgba(192,38,211,0.5);background:transparent;color:#e879f9;font-size:12px;font-weight:700;cursor:pointer;">${CURRENT_LANG==='de'?'Details':'Подробнее'}</button>
        <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:6px;">
          
          <div style="display:flex;flex-direction:column;gap:2px;">
            ${p.old_price > p.price ? `<div style="color:rgba(255,255,255,0.4);font-size:11px;text-decoration:line-through;">${p.old_price}€</div>` : ''}
            <div style="color:#e879f9;font-size:16px;font-weight:800;">${p.price}€</div>
          </div>

          ${p.stock ? `
            <button onclick="addToCart(${p.id})" style="width:36px;height:36px;border-radius:12px;border:none;background:linear-gradient(135deg, #c026d3, #7c3aed);color:#fff;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(192,38,211,0.3);flex-shrink:0;cursor:pointer;">
              ${qty > 0 ? '<span style=\"font-size:13px;\">' + qty + '</span>' : '+'}
            </button>
          ` : `<button disabled style="width:36px;height:36px;border-radius:12px;border:none;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3);font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">+</button>`}
        </div>
      </div>
      
    </div>
  `;
}

function renderProduct() {
  const p = state.activeProduct;
  if (!p) return `<div style="padding:20px;text-align:center;">${t("product_not_found")}</div>`;
  const qty = cartQtyFor(p.id);
  const bg = gradFor(p.id);
  
  let recsHtml = "";
  if (state.activeProductRecs) {
    if (state.activeProductRecs.length > 0) {
      recsHtml = `
        <div style="margin-top:32px;">
          <div style="font-size:18px;font-weight:800;margin-bottom:12px;padding:0 20px;">${t("bought_together")}</div>
          <div class="no-scroll" style="display:flex;gap:12px;overflow-x:auto;padding:0 20px 20px;scroll-snap-type:x mandatory;">
            ${state.activeProductRecs.map(rec => {
              const rQty = cartQtyFor(rec.id);
              const rBg = gradFor(rec.id);
              const img = rec.photo ? `<img loading="lazy" src="${getPhoto(rec.photo)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null; this.src='https://via.placeholder.com/150?text=No+Image';">` : `<div style="width:100%;height:100%;background:${rBg};display:flex;align-items:center;justify-content:center;font-size:30px;">🧴</div>`;
              return `
              <div class="card" style="min-width:140px;width:140px;flex-shrink:0;border-radius:16px;overflow:hidden;scroll-snap-align:start;display:flex;flex-direction:column;">
                <div style="height:120px;position:relative;" onclick="openProduct(${rec.id})">
                  ${img}
                  <div style="position:absolute;top:8px;left:8px;">${badges(rec)}</div>
                </div>
                <div style="padding:10px;flex:1;display:flex;flex-direction:column;">
                  <div style="font-size:13px;font-weight:700;line-height:1.2;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;" onclick="openProduct(${rec.id})">${getName(rec)}</div>
                  <div style="font-size:14px;font-weight:800;color:#e879f9;margin-bottom:8px;margin-top:auto;">${rec.price}€</div>
                  <button class="btn btn-primary" style="padding:6px;font-size:12px;width:100%;" onclick="addToCart(${rec.id})">${rQty > 0 ? `${t('added')} · ${rQty}` : t('add')}</button>
                </div>
              </div>`;
            }).join("")}
          </div>
        </div>
      `;
    }
  } else {
    recsHtml = `<div style="padding:20px;text-align:center;opacity:0.5;">...</div>`;
  }

  const placeholder = `<div style="width:100%;aspect-ratio:1/1;background:${bg};display:flex;align-items:center;justify-content:center;font-size:60px;">🧴</div>`;
  const imgBlock = p.photo ? `<img loading="lazy" src="${getPhoto(p.photo)}" style="width:100%;aspect-ratio:1/1;object-fit:contain;background:rgba(255,255,255,0.02);" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/150?text=No+Image\';">` : placeholder;

  return `
    <div style="padding-bottom:80px;position:relative;">
      <div onclick="setTab(state.prevTab || 'catalog')" style="position:absolute;top:16px;left:16px;z-index:10;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.5);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;">🔙</div>
      
      ${imgBlock}
      
      <div style="padding:20px;">
        <div style="display:flex;gap:6px;margin-bottom:12px;">${badges(p)}</div>
        <div style="font-size:24px;font-weight:800;margin-bottom:8px;">${getName(p)}</div>
        <div style="font-size:28px;font-weight:800;color:#e879f9;margin-bottom:16px;">${p.price}€</div>
        <div style="margin-bottom:20px;">${stockPill(p.stock)}</div>
        
        ${getDesc(p) ? `<div style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:24px;">${getDesc(p)}</div>` : ""}
        
        ${p.stock ? `
          <div style="display:flex;flex-direction:column;gap:12px;">
            <button class="btn btn-primary" style="height:54px;font-size:16px;" onclick="addToCart(${p.id})">${qty > 0 ? `${t('added')} · ${qty}` : t('add')}</button>
            <button class="btn btn-green" style="height:54px;font-size:16px;" onclick="addToCart(${p.id});setTab('cart')">${t('buy_now')}</button>
          </div>
        ` : `<button class="btn btn-outline" disabled style="width:100%;height:54px;opacity:0.5;">${t('out_of_stock')}</button>`}
      </div>

      ${recsHtml}
    </div>
  `;
}