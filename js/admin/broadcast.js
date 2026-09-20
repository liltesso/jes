function adminBroadcastScreen() {
  return `
    <div style="padding:20px;">
      <h2 style="margin:0 0 16px;font-size:18px;">Рассылка всем пользователям</h2>
      <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:16px;">
        Это сообщение придет в бот всем пользователям, которые когда-либо запускали его. Используйте HTML для форматирования.
      </div>
      <textarea id="broadcastMsg" rows="6" placeholder="Введите текст рассылки... (например: 🔥 Новое поступление!)" style="width:100%;padding:12px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:14px;resize:vertical;margin-bottom:16px;"></textarea>
      <button onclick="sendBroadcast()" style="width:100%;padding:14px;background:linear-gradient(135deg, #c026d3, #7c3aed);border:none;border-radius:12px;color:#fff;font-weight:bold;cursor:pointer;">Отправить рассылку</button>
    </div>
  `;
}

async function sendBroadcast() {
  const msg = document.getElementById("broadcastMsg").value.trim();
  if (!msg) {
    alert("Введите текст рассылки!");
    return;
  }
  if (!confirm("Вы уверены, что хотите отправить это сообщение всем пользователям?")) return;
  
  try {
    const res = await adminApi("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    alert(`Успешно отправлено! Доставлено: ${res.sent} пользователям.`);
    document.getElementById("broadcastMsg").value = "";
  } catch (e) {
    alert("Ошибка рассылки: " + e.message);
  }
}
