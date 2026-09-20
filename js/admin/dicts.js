function dictScreen({ items, addFn, delFn, addLabel, emptyText, hint }) {
  return `
    <div style="padding:20px;">
      <button class="btn btn-primary" style="margin-bottom:8px;" onclick="${addFn}()">${addLabel}</button>
      <div style="font-size:12.5px;color:rgba(255,255,255,0.4);margin-bottom:16px;line-height:1.45;">${hint}</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${items.map(it => `
                    <div class="card" style="display:flex;align-items:center;gap:12px;padding:14px 16px;">
            <div style="flex:1;font-weight:600;font-size:15px;">${(() => {
              let nm = it.name;
              if (typeof nm === 'string' && nm.startsWith('{')) {
                try { nm = JSON.parse(nm); } catch(e) {}
              }
              return typeof nm === 'object' ? (nm.ru || nm.de || '') : (nm || '');
            })()}</div>
            <button onclick="${delFn}(${it.id})" style="width:34px;height:34px;border-radius:10px;background:rgba(248,113,113,0.15);border:none;color:#f87171;flex-shrink:0;">🗑</button>
          </div>
        `).join("") || `<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px 0;">${emptyText}</div>`}
      </div>
    </div>
  `;
}

function adminCategoriesScreen() {
  if (state.isAddingCategory) {
    return `
      <div style="padding:20px;">
        <div style="font-weight:800;font-size:18px;margin-bottom:16px;">Новая категория</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="card" style="padding:12px 16px;"><input id="catNameRu" placeholder="Название (RU)" style="width:100%;font-size:14.5px;"></div>
          <div class="card" style="padding:12px 16px;"><input id="catNameDe" placeholder="Название (DE)" style="width:100%;font-size:14.5px;"></div>
          <button class="btn btn-primary" style="margin-top:10px;" onclick="saveNewCategory()">Сохранить</button>
          <button class="btn" style="margin-top:5px;background:rgba(255,255,255,0.1);" onclick="state.isAddingCategory=false;renderAdmin()">Отмена</button>
        </div>
      </div>
    `;
  }
  return dictScreen({
    items: ADMIN_CATEGORIES,
    addFn: "showAddCategoryForm",
    delFn: "adminDeleteCategory",
    addLabel: "+ Добавить категорию",
    emptyText: "Категорий пока нет",
    hint: "Категории появляются в фильтре каталога, как только в них есть хотя бы один товар. При удалении категории товары остаются — у них просто очищается это поле.",
  });
}

function showAddCategoryForm() {
  state.isAddingCategory = true;
  renderAdmin();
}

async function saveNewCategory() {
  const ru = document.getElementById("catNameRu").value.trim();
  const de = document.getElementById("catNameDe").value.trim();
  if (!ru) { alert("Укажите название (RU)"); return; }
  
  const payload = { name: { ru, de } };
  
  try {
    await adminApi("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.isAddingCategory = false;
    await reloadDict("categories");
    renderAdmin();
  } catch (e) {
    alert("Не удалось добавить: " + e.message);
  }
}

function adminCitiesScreen() {
  return dictScreen({
    items: ADMIN_CITIES,
    addFn: "adminAddCity",
    delFn: "adminDeleteCity",
    addLabel: "+ Добавить город",
    emptyText: "Городов пока нет",
    hint: "Покупатель выбирает город из этого списка при оформлении самовывоза.",
  });
}

async function adminAddDictItem(kind, promptText) {
  const name = prompt(promptText);
  if (name === null) return;
  if (!name.trim()) { alert("Название не может быть пустым"); return; }
  try {
    await adminApi(`/api/admin/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    await reloadDict(kind);
    renderAdmin();
  } catch (e) { alert("Не удалось добавить: " + e.message); }
}

async function adminDeleteDictItem(kind, id, confirmText) {
  if (!confirm(confirmText)) return;
  try {
    await adminApi(`/api/admin/${kind}/${id}`, { method: "DELETE" });
    await reloadDict(kind);
    renderAdmin();
  } catch (e) { alert("Ошибка: " + e.message); }
}

async function reloadDict(kind) {
  if (kind === "categories") ADMIN_CATEGORIES = await adminApi("/api/admin/categories");
  if (kind === "cities") {
    ADMIN_CITIES = await adminApi("/api/admin/cities");
    CITIES = ADMIN_CITIES;   // чтобы витрина сразу увидела изменения
  }
}

function adminAddCity() { return adminAddDictItem("cities", "Название города:"); }

function adminDeleteCategory(id) { return adminDeleteDictItem("categories", id, "Удалить категорию? Товары останутся, у них очистится категория."); }

function adminDeleteCity(id) { return adminDeleteDictItem("cities", id, "Удалить город из списка самовывоза?"); }