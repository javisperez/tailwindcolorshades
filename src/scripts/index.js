import Vue from 'vue';
import store from './store';
import gaTrack from './support/gaTrack';

import * as components from './components';

Vue.use(gaTrack);

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
