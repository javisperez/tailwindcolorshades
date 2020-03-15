export default {
    install(Vue) {
        Vue.prototype.$gaTrack = (category, action, label = '', options = { non_interaction: true }) => {
            if (typeof gtag === 'undefined') {
                return;
            }

            const params = {
                event_category: category,
                event_label: label,
                ...options
            };

            gtag('event', action, params);
        };
    }
};
