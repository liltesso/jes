
let CURRENT_LANG = new URLSearchParams(window.location.search).get('lang') || localStorage.getItem('lang') || 'ru';

const TRANSLATIONS = {
  ru: {
    home: "Главная", catalog: "Каталог", cart: "Корзина", profile: "Профиль", history: "История",
    best_shop: "ЛУЧШИЙ МАГАЗИН", best_shop_desc: "прямо под рукой", order_button: "КАТАЛОГ",
    about_us: "НЕМНОГО О НАС",
    who_we_are: "КТО МЫ?",
    who_we_are_text: "SMOKE LAB — магазин жидкостей, pod-систем, одноразовых устройств. Мы быстро обрабатываем заказы и подбираем товары под твои предпочтения.",
    our_pluses: "НАШИ ПЛЮСЫ",
    conditions: "УСЛОВИЯ",
    conditions_text: "Прозрачные цены без скрытых наценок. Всё понятно до оформления заказа.",
    wholesale: "ОПТОВЫЕ ПАРТИИ",
    wholesale_text: "Работаем и с оптом. Объёмы и условия обсуждаются отдельно.",
    guarantee: "ГАРАНТИЯ КАЧЕСТВА",
    guarantee_text: "Проверенные товары, аккуратная упаковка и нормальное состояние при получении.",
    payment: "ОПЛАТА",
    payment_text: "Принимаем разные варианты оплаты. Детали уточняются при оформлении.",
    support: "ТЕХ. ПОДДЕРЖКА",
    support_text: "Остались вопросы? Пиши, дадим ответ на каждый.",
    reviews_title: "ОТЗЫВЫ ПОКУПАТЕЛЕЙ",
    review_1: "Заказ пришёл быстро, всё чётко. Упаковка аккуратная.",
    review_2: "Цены нормальные, качество топ. Уже не первый заказ.",
    review_3: "Поддержка ответила быстро, помогли выбрать вкус.",
    stats_orders: "Успешных заказов", stats_reviews: "Положительных отзывов", stats_support: "Среднее время ответа",
    footer_club: "SMOKE LAB", footer_geo: "GERMANY",
    nav_home: "ГЛАВНАЯ", nav_about: "О НАС", nav_reviews: "ОТЗЫВЫ", nav_telegram: "НАШ TELEGRAM",
    info_text: "Проверенные товары, аккуратная упаковка и нормальное состояние при получении.",
    payment_title: "ОПЛАТА", payment_desc: "Принимаем разные варианты оплаты. Детали уточняются при оформлении.",
    cash: "💵 Наличные", card: "💳 Карта",
    reviews_empty: "Пока нет отзывов",
    nav_title: "НАВИГАЦИЯ", nav_tg: "Наш Telegram",
    better_title: "МЫ ПРОСТО ЛУЧШЕ",
    catalog_title: "Каталог", catalog_subtitle: "Товары в наличии", search_placeholder: "Поиск товаров...", catalog_empty: "Ничего не найдено",
    cart_title: "Корзина", cart_subtitle: "Проверь заказ и примени промокод",
    cart_tg_req: "Откройте магазин через кнопку в боте Telegram, чтобы привязать корзину и заказы.",
    cart_empty: "Корзина пуста",
    checkout_action: "Оформить заказ", checkout_title: "Оформление", checkout_subtitle: "Выберите способ получения",
    pickup: "🚶 Самовывоз", delivery: "🚚 Доставка", pickup_city: "Город самовывоза", delivery_addr: "Адрес доставки",
    addr_placeholder: "Улица, дом, квартира", confirm_order: "Подтвердить заказ", cancel: "Отмена",
    promo_title: "Промокод", promo_apply: "Применить", sum: "Сумма", discount: "Скидка", total: "Итого:",
    profile_title: "Профиль", profile_subtitle: "Ваши данные и бонусы",
    profile_tg_req: "Откройте магазин через кнопку в боте Telegram, чтобы видеть свой профиль.",
    balance: "Баланс / бонусы", topup: "Пополнить баланс", invited: "Приглашено", ref_link: "Реферальная ссылка",
    history_title: "История", history_subtitle: "Ваши заказы",
    history_tg_req: "Откройте магазин через кнопку в боте Telegram, чтобы увидеть историю заказов.",
    history_empty: "Заказов пока нет",
    added: "Добавлено", add: "Добавить", buy_now: "В корзину", out_of_stock: "Нет в наличии",
    in_stock_pill: "Есть в наличии", out_of_stock_pill: "Нет в наличии",
    all_cats: "Все", offline_msg: "Вы в офлайне. Заказы недоступны.",
    topup_title: "Пополнение баланса", topup_subtitle: "Выберите сумму и способ оплаты",
    topup_amount: "Сумма пополнения", topup_method: "Способ оплаты", topup_btn: "Пополнить на",
    review_leave: "Оставить отзыв", review_desc: "Напиши коротко, что понравилось. Отзыв отправится на проверку и после одобрения появится на сайте и в боте.",
    review_ph: "Ваш отзыв...", review_btn: "Отправить отзыв",
    promo_input: "Например SMOKE10", promo_label: "Промокод", cities_empty: "Города пока не настроены",
    status_new: "Новый", status_proc: "В обработке", status_sent: "Отправлен/Готов", status_done: "Выполнен", status_canc: "Отменён",
    age_title: "Вам есть 18 лет?", age_desc: "На сайте представлена продукция только для совершеннолетних.", age_btn: "Да, мне есть 18",
        client: "Клиент Smoke Lab",
        back: "Назад", bought_together: "С этим товаром часто покупают",
    ref_cta_title: "Пригласи друга и получи 5€",
    ref_cta_desc: "За каждого друга, который оформит заказ, вы оба получите бонусы!",
    ref_cta_btn: "Пригласить",
    no_promo_hint: "Нет промокода? Получи бонус за друга!",
    product_not_found: "Товар не найден",
    other_bank: "Другой банк",
    payment_method_label: "Способ оплаты",
    pay_mono: "Monobank (UAH)",
    pay_sparkasse: "Sparkasse (EUR)",
    pay_cash: "Наличными при получении",
    pay_success: "Заказ оформлен!",
    pay_manual_desc: "Переведите сумму на эти реквизиты. Затем обязательно отправьте скриншот менеджеру.",
    pay_card: "Карта",
    pay_iban: "IBAN",
    pay_manager: "Менеджер",


    hits_title: "ХИТЫ ПРОДАЖ", hits_subtitle: "Самое популярное", all_cats: "Все товары",
    promo_applied: "применён", promo_discount: "Скидка",
    topup_ph: "Введите сумму, €",
    bank_not_found: "Не нашли свой банк в списке? Не переживайте — выбирайте любой из вариантов, оплата всё равно пройдёт корректно любой картой.",
    order_num: "Заказ №",
        alert_review_empty: "Введите текст отзыва",
    alert_review_success: "Отзыв отправлен на модерацию! Спасибо!",
    alert_review_error: "Ошибка при отправке отзыва",
    alert_topup_success: "Баланс пополнен на",
    alert_topup_curr: "Текущий баланс:",
    alert_topup_err: "Не удалось пополнить баланс. Попробуйте снова.",
    alert_promo_invalid: "Такого промокода нет или он больше не активен",
    alert_promo_err: "Не удалось проверить промокод",
    alert_order_success: "оформлен на сумму",
    alert_order_err: "Не получилось оформить заказ. Проверьте наличие товаров и попробуйте снова.",
    stat_5min: "5 мин",
    mono: "Оплата картой Monobank", privat: "Оплата через Приват24",
    visa: "Любая карта другого банка", other: "Любой банк из списка при оплате",
  },
  de: {
    home: "Start", catalog: "Katalog", cart: "Warenkorb", profile: "Profil", history: "Verlauf",
    best_shop: "DER BESTE SHOP", best_shop_desc: "immer griffbereit", order_button: "KATALOG",
    about_us: "ÜBER UNS",
    who_we_are: "WER WIR SIND?",
    who_we_are_text: "SMOKE LAB — ein Geschäft für E-Liquids, Pod-Systeme und Einweggeräte. Wir bearbeiten Bestellungen schnell und passen Produkte an deine Vorlieben an.",
    our_pluses: "UNSERE VORTEILE",
    conditions: "BEDINGUNGEN",
    conditions_text: "Transparente Preise ohne versteckte Aufschläge. Alles ist vor der Bestellung klar.",
    wholesale: "GROßHANDEL",
    wholesale_text: "Wir arbeiten auch mit Großhandel. Mengen und Konditionen werden separat besprochen.",
    guarantee: "QUALITÄTSGARANTIE",
    guarantee_text: "Geprüfte Waren, sorgfältige Verpackung und normaler Zustand bei Erhalt.",
    payment: "ZAHLUNG",
    payment_text: "Wir akzeptieren verschiedene Zahlungsmethoden. Details bei der Bestellung.",
    support: "SUPPORT",
    support_text: "Noch Fragen? Schreib uns, wir beantworten jede.",
    reviews_title: "KUNDENBEWERTUNGEN",
    review_1: "Bestellung kam schnell, alles perfekt. Verpackung ordentlich.",
    review_2: "Preise sind normal, Qualität top. Nicht die erste Bestellung.",
    review_3: "Support antwortete schnell, half bei der Geschmackswahl.",
    stats_orders: "Erfolgreiche Bestellungen", stats_reviews: "Positive Bewertungen", stats_support: "Durchschn. Antwortzeit",
    footer_club: "SMOKE LAB", footer_geo: "DEUTSCHLAND",
    nav_home: "STARTSEITE", nav_about: "ÜBER UNS", nav_reviews: "BEWERTUNGEN", nav_telegram: "UNSER TELEGRAM",
    info_text: "Geprüfte Produkte, sorgfältige Verpackung und perfekter Zustand bei Lieferung.",
    payment_title: "ZAHLUNG", payment_desc: "Wir akzeptieren verschiedene Zahlungsmethoden. Details beim Checkout.",
    cash: "💵 Bargeld", card: "💳 Bankkarte",
    reviews_empty: "Noch keine Bewertungen",
    nav_title: "NAVIGATION", nav_tg: "Unser Telegram",
    better_title: "WIR SIND EINFACH BESSER",
    catalog_title: "Katalog", catalog_subtitle: "Verfügbare Produkte", search_placeholder: "Produkt suchen...", catalog_empty: "Nichts gefunden",
    cart_title: "Warenkorb", cart_subtitle: "Bestellung prüfen und Rabattcode anwenden",
    cart_tg_req: "Öffnen Sie den Shop über den Telegram-Bot, um den Warenkorb und Ihre Bestellungen zu verknüpfen.",
    cart_empty: "Warenkorb ist leer",
    checkout_action: "Bestellung aufgeben", checkout_title: "Bestellvorgang", checkout_subtitle: "Empfangsmethode wählen",
    pickup: "🚶 Abholung", delivery: "🚚 Lieferung", pickup_city: "Abholort", delivery_addr: "Lieferadresse",
    addr_placeholder: "Straße, Hausnummer, Wohnung", confirm_order: "Bestellung bestätigen", cancel: "Abbrechen",
    promo_title: "Rabattcode", promo_apply: "Anwenden", sum: "Summe", discount: "Rabatt", total: "Gesamt:",
    profile_title: "Profil", profile_subtitle: "Ihre Daten und Boni",
    profile_tg_req: "Öffnen Sie den Shop über den Telegram-Bot, um Ihr Profil zu sehen.",
    balance: "Guthaben / Boni", topup: "Guthaben aufladen", invited: "Eingeladen", ref_link: "Empfehlungslink",
    history_title: "Verlauf", history_subtitle: "Ihre Bestellungen",
    history_tg_req: "Öffnen Sie den Shop über den Telegram-Bot, um Ihren Bestellverlauf zu sehen.",
    history_empty: "Noch keine Bestellungen",
    added: "Hinzugefügt", add: "Hinzufügen", buy_now: "In den Warenkorb", out_of_stock: "Nicht auf Lager",
    in_stock_pill: "Auf Lager", out_of_stock_pill: "Nicht auf Lager",
    all_cats: "Alle", offline_msg: "Sie sind offline. Bestellungen nicht möglich.",
    topup_title: "Guthaben aufladen", topup_subtitle: "Wählen Sie Betrag und Zahlungsmethode",
    topup_amount: "Aufladebetrag", topup_method: "Zahlungsmethode", topup_btn: "Aufladen mit",
    review_leave: "Bewertung hinterlassen", review_desc: "Schreibe kurz, was dir gefallen hat. Die Bewertung wird geprüft und nach Freigabe auf der Website und im Bot veröffentlicht.",
    review_ph: "Deine Bewertung...", review_btn: "Bewertung senden",
    promo_input: "Z.B. SMOKE10", promo_label: "Rabattcode", cities_empty: "Städte noch nicht konfiguriert",
    status_new: "Neu", status_proc: "In Bearbeitung", status_sent: "Versendet/Bereit", status_done: "Abgeschlossen", status_canc: "Storniert",
    age_title: "Bist du 18 Jahre alt?", age_desc: "Die Website enthält nur Produkte für Erwachsene.", age_btn: "Ja, ich bin 18",
        client: "Smoke Lab Kunde",
        back: "Zurück", bought_together: "Wird oft zusammen gekauft",
    ref_cta_title: "Lade einen Freund ein und erhalte 5€",
    ref_cta_desc: "Für jeden Freund, der bestellt, erhaltet ihr beide einen Bonus!",
    ref_cta_btn: "Einladen",
    no_promo_hint: "Kein Code? Erhalte Bonus für Freunde!",
    product_not_found: "Produkt nicht gefunden",
    other_bank: "Andere Bank",
    payment_method_label: "Zahlungsmethode",
    pay_mono: "Monobank (UAH)",
    pay_sparkasse: "Sparkasse (EUR)",
    pay_cash: "Bar bei Abholung",
    pay_success: "Bestellung aufgegeben!",
    pay_manual_desc: "Bitte überweisen Sie den Betrag auf dieses Konto. Senden Sie danach einen Screenshot an unseren Manager.",
    pay_card: "Karte",
    pay_iban: "IBAN",
    pay_manager: "Manager",


    hits_title: "BESTSELLER", hits_subtitle: "Am beliebtesten", all_cats: "Alle Artikel",
    promo_applied: "angewandt", promo_discount: "Rabatt",
    topup_ph: "Betrag eingeben, €",
    bank_not_found: "Haben Sie Ihre Bank nicht in der Liste gefunden? Keine Sorge - wählen Sie eine der Optionen, die Zahlung wird weiterhin korrekt mit jeder Karte abgewickelt.",
    order_num: "Bestellung Nr.",
        alert_review_empty: "Bitte geben Sie den Text der Bewertung ein",
    alert_review_success: "Bewertung zur Moderation gesendet! Danke!",
    alert_review_error: "Fehler beim Senden der Bewertung",
    alert_topup_success: "Guthaben aufgeladen um",
    alert_topup_curr: "Aktuelles Guthaben:",
    alert_topup_err: "Guthaben konnte nicht aufgeladen werden. Bitte versuchen Sie es erneut.",
    alert_promo_invalid: "Ein solcher Rabattcode existiert nicht oder ist nicht mehr aktiv",
    alert_promo_err: "Rabattcode konnte nicht überprüft werden",
    alert_order_success: "aufgegeben im Wert von",
    alert_order_err: "Bestellung konnte nicht aufgegeben werden. Bitte prüfen Sie die Verfügbarkeit der Produkte.",
    stat_5min: "5 Min",
    mono: "Zahlung per Monobank", privat: "Zahlung per Privat24",
    visa: "Beliebige Bankkarte", other: "Beliebige Bank aus der Liste",
  }
};

function t(key) {
  const lang = CURRENT_LANG || 'ru';
  if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) return TRANSLATIONS[lang][key];
  if (TRANSLATIONS.ru && TRANSLATIONS.ru[key]) return TRANSLATIONS.ru[key];
  return key;
}

function toggleLang() {
  CURRENT_LANG = (CURRENT_LANG === 'ru' ? 'de' : 'ru');
  localStorage.setItem('lang', CURRENT_LANG);
  updateLangBtn();
  renderTabbar();
  render();
}

function updateLangBtn() {
  const ageTitle = document.getElementById('ageTitle');
  const ageDesc = document.getElementById('ageDesc');
  const ageBtn = document.getElementById('ageBtn');
  if (ageTitle) ageTitle.innerText = t("age_title");
  if (ageDesc) ageDesc.innerText = t("age_desc");
  if (ageBtn) ageBtn.innerText = t("age_btn");

  const btn = document.getElementById('langSwitchBtn');
  if (btn) btn.innerText = CURRENT_LANG === 'ru' ? '🇷🇺 RU' : '🇩🇪 DE';
  const offText = document.getElementById('offline-banner-text');
  if (offText) offText.innerText = t('offline_msg');
}

function setLang(lang) {
  CURRENT_LANG = lang;
  localStorage.setItem('lang', lang);
  updateLangBtn();
  if (typeof render === 'function') render();
}
