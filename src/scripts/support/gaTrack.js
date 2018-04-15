export default {
    install(Vue) {
        Vue.prototype.$track = (category, action, label = '', options = { eventValue: null, nonInteraction: true }) => {
            if (typeof ga === 'undefined') {
                return;
            }

            const params = {
                hitType: 'event',
                eventCategory: category,
                eventAction: action,
                eventLabel: label,
                ...options
            };

            ga('send', params);
        };
    }
};
