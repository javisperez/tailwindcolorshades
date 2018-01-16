import Vue from 'vue';
import store from './store';

import * as components from './components';

new Vue({
    el: '#app',
    name: 'tailwind-color-shades',
    components,
    store,
    template: `
    <div>
        <app></app>
    </div>
    `
});
