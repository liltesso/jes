function adminProductsScreen() {
  if (state.adminEditing) return adminProductForm(state.adminEditing);
  return `
    <div style="padding:20px;">
      <button class="btn btn-primary" style="margin-bottom:16px;" onclick="state.adminEditing = {isNew:true, id: null, nameObj:{ru:'', de:''}, descObj:{ru:'', de:''}, price:'', old_price:'', category:'', stock:true, is_hit:false, photo:null}; renderAdmin();">+ Добавить товар</button>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${PRODUCTS.map(p => `
          <div class="card" style="display:flex;gap:12px;padding:12px;align-items:center;">
            <div style="width:56px;height:56px;border-radius:12px;overflow:hidden;flex-shrink:0;background:${gradFor(p.id)};display:flex;align-items:center;justify-content:center;">
              ${p.photo ? `<img src="${getPhoto(p.photo)}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:22px;">🧴</span>`}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${getName(p)}</div>
              <div style="color:rgba(255,255,255,0.4);font-size:12.5px;">${p.price}€ · ${p.stock ? "в наличии" : "нет в наличии"}</div>
            </div>
            <button onclick="adminEditProduct(${p.id})" style="width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.08);border:none;color:#fff;flex-shrink:0;">✎</button>
            <button onclick="adminDeleteProduct(${p.id})" style="width:34px;height:34px;border-radius:10px;background:rgba(248,113,113,0.15);border:none;color:#f87171;flex-shrink:0;">🗑</button>
          </div>
        `).join("") || `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px 0;">Товаров пока нет</div>`}
      </div>
    </div>
  `;
}

function adminEditProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (p) { 
    state.adminEditing = Object.assign({}, p);
    try { state.adminEditing.nameObj = typeof p.name === 'string' ? JSON.parse(p.name) : p.name; } catch(e) { state.adminEditing.nameObj = {ru: p.name||'', de:''}; }
    try { state.adminEditing.descObj = typeof p.description === 'string' ? JSON.parse(p.description) : p.description; } catch(e) { state.adminEditing.descObj = {ru: p.description||'', de:''}; }
    if (!state.adminEditing.nameObj) state.adminEditing.nameObj = {ru:'', de:''};
    if (!state.adminEditing.descObj) state.adminEditing.descObj = {ru:'', de:''};
    renderAdmin(); 
  }
}

async function adminDeleteProduct(id) {
  if (!confirm("Удалить товар?")) return;
  try {
    await adminApi(`/api/admin/products/${id}`, { method: "DELETE" });
    await loadCatalog();
    renderAdmin();
  } catch (e) { alert("Не получилось удалить: " + e.message); }
}

function adminProductForm(p) {
  return `
    <div style="padding:20px;">
      <div style="font-weight:800;font-size:18px;margin-bottom:16px;">${p.isNew ? "Новый товар" : "Редактировать товар"}</div>

      <div style="margin-bottom:14px;">
        <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">Фото товара</div>
        <label style="display:block;cursor:pointer;">
          <div style="height:160px;border-radius:16px;overflow:hidden;background:${gradFor(p.id||1)};display:flex;align-items:center;justify-content:center;border:1px dashed rgba(255,255,255,0.25);">
            ${p.photo ? `<img src="${getPhoto(p.photo)}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="text-align:center;color:rgba(255,255,255,0.5);font-size:13px;">📷 Загрузить фото</div>`}
          </div>
          <input type="file" accept="image/*" style="display:none;" onchange="adminPhotoSelected(event)">
        </label>
        <div id="photoUploadStatus" style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="card" style="padding:12px 16px;"><input placeholder="Название (RU)" value="${(p.nameObj||{}).ru||""}" oninput="state.adminEditing.nameObj.ru=this.value" style="width:100%;font-size:14.5px;"></div>
        <div class="card" style="padding:12px 16px;"><input placeholder="Название (DE)" value="${(p.nameObj||{}).de||""}" oninput="state.adminEditing.nameObj.de=this.value" style="width:100%;font-size:14.5px;"></div>
        <div class="card" style="padding:12px 16px;"><input placeholder="Описание (RU)" value="${(p.descObj||{}).ru||""}" oninput="state.adminEditing.descObj.ru=this.value" style="width:100%;font-size:14.5px;"></div>
        <div class="card" style="padding:12px 16px;"><input placeholder="Описание (DE)" value="${(p.descObj||{}).de||""}" oninput="state.adminEditing.descObj.de=this.value" style="width:100%;font-size:14.5px;"></div>
        <div style="display:flex;gap:10px;">
          <div class="card" style="padding:12px 16px;flex:1;"><input type="number" placeholder="Цена €" value="${p.price||""}" oninput="state.adminEditing.price=this.value" style="width:100%;font-size:14.5px;"></div>
          <div class="card" style="padding:12px 16px;flex:1;">
            <select onchange="state.adminEditing.category=this.value" style="width:100%;font-size:14.5px;background:transparent;border:none;outline:none;color:#fff;font-family:inherit;">
              <option value="" style="background:#18101f;" ${!p.category ? "selected" : ""}>Без категории</option>
              ${categoryOptions(p.category)}
            </select>
          </div>
        </div>
        <div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14.5px;">Жидкость (для фильтра каталога)</span>
          <input type="checkbox" ${p.is_liquid ? "checked" : ""} onchange="state.adminEditing.is_liquid=this.checked" style="width:20px;height:20px;">
        </div>
        <div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14.5px;">В наличии</span>
          <input type="checkbox" ${p.stock ? "checked" : ""} onchange="state.adminEditing.stock=this.checked" style="width:20px;height:20px;">
        </div>
        <div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14.5px;">Хит продаж</span>
          <input type="checkbox" ${p.is_hit ? "checked" : ""} onchange="state.adminEditing.is_hit=this.checked" style="width:20px;height:20px;">
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
        <button class="btn btn-primary" onclick="adminSaveProduct()">Сохранить</button>
        <button class="btn btn-outline" onclick="state.adminEditing=null;renderAdmin();">${t("cancel")}</button>
      </div>
    </div>
  `;
}

async function adminPhotoSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  // мгновенный локальный превью, пока идёт загрузка на сервер
  const localPreview = URL.createObjectURL(file);
  state.adminEditing.photo = localPreview;
  renderAdmin();
  const statusEl = document.getElementById("photoUploadStatus");
  if (statusEl) statusEl.textContent = "Загрузка фото…";
  try {
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch(window.BACKEND_URL + "/api/admin/upload", { 
      method: "POST", 
      headers: { 
        "x-admin-code": ADMIN_CODE,
        "Bypass-Tunnel-Reminder": "true",
        "ngrok-skip-browser-warning": "true"
      }, 
      body: formData 
    });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || "Ошибка загрузки");
        const data = await res.json();
    state.adminEditing.photo = data.url;
    renderAdmin();
    setTimeout(() => { window.scrollTo(0, 0); if (typeof tg !== 'undefined') tg.expand(); }, 100);
  } catch (err) {
    alert("Не удалось загрузить фото: " + err.message);
    setTimeout(() => { window.scrollTo(0, 0); if (typeof tg !== 'undefined') tg.expand(); }, 100);
  }
}

async function adminSaveProduct() {
  if (state.isSaving) return;
  state.isSaving = true;
  const p = state.adminEditing;
  if (!p.nameObj || !p.nameObj.ru || !p.price) { alert("Укажите название (RU) и цену"); return; }
  const payload = { ...p, name: p.nameObj, description: p.descObj, price: Number(p.price), old_price: Number(p.old_price||0) };
  try {
    if (p.isNew) await adminApi("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    else await adminApi(`/api/admin/products/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await loadCatalog();
    state.adminEditing = null;
    renderAdmin();
  } catch (e) {
    alert("Не получилось сохранить: " + e.message);
  } finally {
    state.isSaving = false;
  }
}

// Список названий для <select> в карточке товара. Если у товара стоит
// категория, которой больше нет в справочнике, она всё равно показывается,
// чтобы редактирование не затирало её молча.

function categoryOptions(current) {
  // c.code is the actual value saved in the product, c.name is {ru, de}
  // But wait, the previous code pushed c.name as the value?
  // Let's check how product category is stored. 
  // It is stored as a string (category code or name).
  // If ADMIN_CATEGORIES has c.code and c.name:
  const cats = ADMIN_CATEGORIES.map(c => ({ val: c.code, label: typeof c.name === 'object' ? getName(c) : c.name }));
  if (current && !cats.find(c => c.val === current)) cats.push({ val: current, label: current });
  return cats.map(c =>
    `<option value="${escapeAttr(c.val)}" style="background:#18101f;" ${c.val === current ? "selected" : ""}>${c.label}</option>`
  ).join("");
}

function escapeAttr(v) {
  return String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// Категории и города устроены одинаково, поэтому экран общий.