import Vue from 'vue';
import VueRouter from 'vue-router';
import store from './store';
import gaTrack from './support/gaTrack';

import { app } from './components';

Vue.use(VueRouter);
Vue.use(gaTrack);

const router = new VueRouter({
    routes: [
        {
            path: '/', component: app
        }
    ]
});

new Vue({
    el: '#app',
    name: 'tailwind-color-shades',
    router,
    store,
    template: `
    <div>
        <router-view></router-view>
    </div>
    `
});
