function renderHome() {
  const cats = CATEGORY_LIST || [];
  const newItems = PRODUCTS.filter(p => p.is_new).slice(0, 10);
  const hits = PRODUCTS.filter(p => p.is_hit).slice(0, 10);

  return `
    <div style="padding-bottom:100px;overflow-x:hidden;">
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
            <img src="/uploads/hero_bottles.png" style="width:70%;height:70%;object-fit:contain;filter:drop-shadow(0 20px 40px rgba(192,38,211,0.7));position:relative;z-index:1;" onerror="this.outerHTML='<div style=\'font-size:120px;position:relative;z-index:1;text-align:center;line-height:260px;filter:drop-shadow(0 20px 40px rgba(192,38,211,0.7));\'>💨</div>'">
          </div>
        </div>
        
        <div class="hero-card" style="background: linear-gradient(135deg, rgba(192,38,211,0.2) 0%, rgba(124,58,237,0.2) 100%); border: 1px solid rgba(192,38,211,0.3); border-radius: 20px; padding: 24px; text-align: center; margin: 20px 20px 24px;">
          <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 8px; color: #fff;">${t("best_shop")}</h2>
          <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 20px; line-height: 1.4;">${t("best_shop_desc")}</p>
          <button class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 16px; font-weight: 800; border-radius: 14px; box-shadow: 0 4px 15px rgba(192,38,211,0.3);" onclick="setTab('catalog')">${t("go_catalog") || "Перейти в каталог 🚀"}</button>
        </div>
        
        <!-- Категории (Быстрый доступ) -->
        ${cats.length ? `
        <div style="margin-bottom: 28px;">
          <div style="padding:0 20px;margin-bottom:12px;font-size:16px;font-weight:800;">${t("cat_title") || "Категории"}</div>
          <div class="no-scroll" style="display:flex;gap:12px;overflow-x:auto;padding:0 20px 10px;scroll-snap-type:x mandatory;">
            ${cats.map((c, idx) => `
              <div class="card" style="min-width:120px; padding:16px; border-radius:16px; text-align:center; scroll-snap-align:start; cursor:pointer; background:rgba(255,255,255,0.05);" onclick="state.catFilter='${c}'; setTab('catalog');">
                <div style="font-size:24px; margin-bottom:8px;">${['💨','🔋','🍓','🧊','🔥'][idx%5]}</div>
                <div style="font-size:13px; font-weight:700;">${c}</div>
              </div>
            `).join("")}
          </div>
        </div>
        ` : ""}
        
      </section>

      ${newItems.length ? `
        <div style="margin-bottom: 28px;">
          <div style="padding:0 20px;margin-bottom:12px;font-size:16px;font-weight:800;">${t("new_arrivals") || "Новинки 🔥"}</div>
          <div class="no-scroll" style="display:flex;gap:12px;overflow-x:auto;padding:0 20px 10px;scroll-snap-type:x mandatory;">
            ${newItems.map(p => `
              <div class="card" style="min-width:140px; padding:12px; border-radius:16px; scroll-snap-align:start; position:relative;" onclick="openProduct(${p.id})">
                <div style="position:absolute; top:8px; left:8px; background:#e879f9; color:#000; font-size:10px; font-weight:800; padding:2px 8px; border-radius:6px; z-index:2;">NEW</div>
                <div style="width:100%;aspect-ratio:1/1;border-radius:12px;background:${gradFor(p.id)};display:flex;align-items:center;justify-content:center;margin-bottom:10px;overflow:hidden;">
                  ${p.photo ? `<img src="${getPhoto(p.photo)}" style="width:80%;height:80%;object-fit:contain;filter:drop-shadow(0 8px 12px rgba(0,0,0,0.5));">` : `<div style="font-size:32px;opacity:0.8;">💨</div>`}
                </div>
                <div style="font-size:13px; font-weight:700; line-height:1.2; margin-bottom:6px; height:31px; overflow:hidden;">${getName(p)}</div>
                <div style="color:#e879f9; font-weight:800; font-size:14px;">${p.price}€</div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      ${hits.length ? `
        <div style="margin-bottom: 28px;">
          <div style="padding:0 20px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:16px;font-weight:800;">${t("hit_title") || "Хиты продаж 💎"}</div>
            <div style="font-size:13px;font-weight:700;color:#c026d3;cursor:pointer;" onclick="setTab('catalog')">${t("show_all") || "Смотреть все"}</div>
          </div>
          <div class="px5" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${hits.map(p => `
              <div class="card" style="padding:12px; border-radius:16px; position:relative;" onclick="openProduct(${p.id})">
                <div style="position:absolute; top:8px; left:8px; background:linear-gradient(90deg, #c026d3, #7c3aed); color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:6px; z-index:2;">ХИТ</div>
                <div style="width:100%;aspect-ratio:1/1;border-radius:12px;background:${gradFor(p.id)};display:flex;align-items:center;justify-content:center;margin-bottom:10px;overflow:hidden;">
                  ${p.photo ? `<img src="${getPhoto(p.photo)}" style="width:80%;height:80%;object-fit:contain;filter:drop-shadow(0 8px 12px rgba(0,0,0,0.5));">` : `<div style="font-size:32px;opacity:0.8;">💨</div>`}
                </div>
                <div style="font-size:13px; font-weight:700; line-height:1.2; margin-bottom:6px; height:31px; overflow:hidden;">${getName(p)}</div>
                <div style="color:#e879f9; font-weight:800; font-size:14px;">${p.price}€</div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
    </div>
  `;
}
