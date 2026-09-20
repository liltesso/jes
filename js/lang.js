window.CURRENT_LANG = new URLSearchParams(window.location.search).get('lang') || localStorage.getItem('lang') || 'ru';
localStorage.setItem('lang', window.CURRENT_LANG);

window.TRANSLATIONS = {};

window.t = function(key) {
    if (!window.TRANSLATIONS[window.CURRENT_LANG]) return key;
    return window.TRANSLATIONS[window.CURRENT_LANG][key] || key;
};

// Load ES6 module dynamically to prevent blocking and maintain legacy global scope
import('./translations.js').then(module => {
    window.TRANSLATIONS = module.TRANSLATIONS;
    if (typeof render === 'function') render();
}).catch(e => console.error("Failed to load translations module", e));
