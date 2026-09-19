
window.openProduct = (id) => {
    state.activeProduct = PRODUCTS.find(p => p.id === id);
    if (!state.activeProduct) return;
    
    const others = PRODUCTS.filter(p => p.id !== id && p.stock > 0);
    state.activeProductRecs = others.sort(() => Math.random() - 0.5).slice(0, 4);
    
    state.tab = "product";
    render();
};

window.closeProduct = () => {
    state.activeProduct = null;
    state.tab = "catalog";
    render();
};

window.setCheckoutStep = (step) => {
    state.checkoutStep = step;
    render();
};

window.setDelivery = (val) => {
    state.delivery = val;
    render();
};

window.setCity = (val) => {
    state.city = val;
    render();
};

window.setPayment = (val) => {
    state.payment = val;
    render();
};

window.submitTopup = async () => {
    if (!state.topupAmount || isNaN(state.topupAmount) || Number(state.topupAmount) <= 0) return;
    try {
        let res = await api("/api/topup", {
            method: "POST",
            body: JSON.stringify({ user_id: USER_ID, amount: Number(state.topupAmount) })
        });
        if (res.url) {
            window.location.href = res.url;
        } else if (res.ok || res.balance !== undefined) {
            alert(t("alert_topup_success") + " " + state.topupAmount + "€!
" + t("alert_topup_curr") + " " + (res.balance || 0) + "€");
            if (typeof PROFILE !== 'undefined') PROFILE.balance = res.balance;
            state.topupStep = null;
            state.topupAmount = "";
            state.topupMethod = null;
            render();
        } else {
            alert(res.error || t("alert_topup_err"));
        }
    } catch (e) {
        alert("API Error: " + (e.message || JSON.stringify(e)));
    }
};

window.submitReview = async () => {
    const el = document.getElementById('reviewText');
    if (!el) return;
    const text = el.value.trim();
    if (!text) {
        alert("Напишите отзыв!");
        return;
    }
    try {
        let res = await api("/api/reviews", {
            method: "POST",
            body: JSON.stringify({ user_id: USER_ID, text, rating: 5 })
        });
        if (res.error) {
            alert(res.error);
        } else {
            el.value = "";
            alert("Спасибо за отзыв!");
            haptic("success");
        }
    } catch (e) {
        alert(e);
    }
};

window.submitCheckout = async () => {
    if (state.isSubmitting) return;
    if (!state.delivery || !state.city || !state.payment) return;
    
    state.isSubmitting = true;
    
    // Change button text or opacity using DOM directly to avoid full re-render flickering
    const btns = document.querySelectorAll('button');
    btns.forEach(b => { if(b.innerText.includes('Оформить') || b.innerText.includes('Bestellung')) b.style.opacity = '0.5'; });
    
    try {
        let res = await api("/api/checkout", {
            method: "POST",
            body: JSON.stringify({
                user_id: USER_ID,
                delivery_method: state.delivery,
                city: state.city,
                payment_method: state.payment,
                promo_code: state.promo || null
            })
        });
        if (res.error) {
            alert(res.error);
            state.isSubmitting = false;
            render();
            return;
        }
        cartData = {items: []};
        state.checkoutStep = null;
        state.payment = null;
        state.delivery = null;
        state.city = "";
        state.paymentData = { id: res.order_id };
        state.tab = "order_success";
        haptic("success");
        await loadProfile();
        await loadOrders();
        state.isSubmitting = false;
        render();
    } catch (e) {
        alert(e);
        state.isSubmitting = false;
        render();
    }
};

window.applyPromo = async () => {
    const code = state.promoCode;
    if (!code) return;
    try {
        let res = await api("/api/promo/check?code=" + encodeURIComponent(code));
        if (res.valid) {
            state.appliedPromo = { code: res.code, discount: res.discount };
            state.promo = res.code;
            haptic("success");
        } else {
            alert(t("promo_invalid") || "Неверный или неактивный промокод");
            state.appliedPromo = null;
            state.promo = null;
        }
        render();
    } catch(e) {
        alert("Ошибка: " + e.message);
    }
};

window.setTab = function(tab) { state.tab = tab; render(); };

window.getWishlist = () => {
    try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch { return []; }
};
window.toggleWishlist = (id, e) => {
    if (e) e.stopPropagation();
    let wl = getWishlist();
    if (wl.includes(id)) { wl = wl.filter(x => x !== id); } else { wl.push(id); }
    localStorage.setItem('wishlist', JSON.stringify(wl));
    render();
};
