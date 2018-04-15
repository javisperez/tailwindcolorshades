import Vue from 'vue';
import VueRouter from 'vue-router';
import store from 'store';
import newColor from 'components/new-color.vue';
import gaTrack from 'support/gaTrack';

import { app } from 'components';

Vue.use(gaTrack);
Vue.use(VueRouter);

Vue.config.devtools = false;
Vue.config.productionTip = false;

newColor.router = new VueRouter({
    routes: [
        {
            path: '/', component: app
        }
    ]
});
// Add the Vuex store
newColor.store = store;

describe('src/scripts/new-color.vue', () => {
    // Create the component instance
    let component = new Vue(newColor);

    it('should validate required fields', () => {
        // Mount the component
        const vm = component.$mount();

        vm.addColor();

        // Should show an error
        expect(vm.isErrorVisible).toBe(true);

        // reset the error
        vm.isErrorVisible = false;

        vm.newColor = {
            name: 'Fake'
        };

        vm.addColor();
        // Should show an error
        expect(vm.isErrorVisible).toBe(true);

        // reset the error
        vm.isErrorVisible = false;

        vm.newColor = {
            color: 'Fake'
        };

        vm.addColor();
        // Should show an error
        expect(vm.isErrorVisible).toBe(true);
    });

    it('should ignore invalid colors', () => {
        const vm = component.$mount();

        vm.newColor = {
            name: 'Fake',
            color: 'invalid'
        };

        vm.addColor();

        // Shouldn't have added the color
        expect(vm.$store.getters.colors.length).toBe(0);

        // # at beginning shouldnt be a problem
        vm.newColor = {
            name: 'Fake',
            color: '#pikachu'
        };

        vm.addColor();

        // Shouldn't have added the color
        expect(vm.$store.getters.colors.length).toBe(0);

        // 6 digits only, no shorthand allowed
        vm.newColor = {
            name: 'Fake',
            color: '#e34'
        };

        vm.addColor();

        // Shouldn't have added the color
        expect(vm.$store.getters.colors.length).toBe(0);

        // No non-hex code
        vm.newColor = {
            name: 'Fake',
            color: '#e349t8'
        };

        vm.addColor();

        // Shouldn't have added the color
        expect(vm.$store.getters.colors.length).toBe(0);

        // Repeat, 6 digits only
        vm.newColor = {
            name: 'Fake',
            color: 'e349e'
        };

        vm.addColor();

        // Shouldn't have added the color
        expect(vm.$store.getters.colors.length).toBe(0);
    });

    it('should add valid colors', () => {
        const vm = component.$mount();

        // First with leading hashtag
        vm.newColor = {
            name: 'papaya',
            color: '#e24e42'
        };

        vm.addColor();

        // Should have one color
        expect(vm.$store.getters.colors.length).toBe(1);
        // Should have the papaya color
        expect(vm.$store.getters.colors[0].name).toBe('papaya');
        expect(vm.$store.getters.colors[0].color).toBe('e24e42');

        // Then without it
        vm.newColor = {
            name: 'mustard',
            color: 'e9b000'
        };

        vm.addColor();

        // Should have one color
        expect(vm.$store.getters.colors.length).toBe(2);
        // Should have the papaya color
        expect(vm.$store.getters.colors[1].name).toBe('mustard');
        expect(vm.$store.getters.colors[1].color).toBe('e9b000');
    });

    it('should be aware of duplicates', () => {
        const vm = component.$mount(),
            $emit = spyOn(vm, '$emit');
        // Clear the current store
        // Clear papaya
        vm.$store.commit('REMOVE_COLOR', { index: 0 });
        // Clear mustard
        vm.$store.commit('REMOVE_COLOR', { index: 0 });

        // Add a new reference color
        vm.newColor = {
            name: 'papaya',
            color: '#e24e42'
        };

        vm.addColor();

        // Should have one color
        expect(vm.$store.getters.colors.length).toBe(1);

        // Try to add the same color again
        vm.newColor = {
            name: 'papaya',
            color: '#e24e42'
        };

        vm.addColor();

        // Should have detected the duplicated
        expect($emit).toHaveBeenCalledWith('color:duplicated', vm.newColor);

        // And should haven't added anything
        expect(vm.$store.getters.colors.length).toBe(1);
    });
});
