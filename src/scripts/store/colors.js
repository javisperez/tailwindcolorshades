const state = {
        colors: []
    },

    mutations = {
        ADD_COLOR(state, { name, color }) {
            state.colors.push({
                name,
                color: color.replace(/#/ig, ''),
                output: null
            });
        },

        REMOVE_COLOR(state, { index }) {
            state.colors.splice(index, 1);
        },

        SET_COLOR_OUTPUT(state, { index, output }) {
            state.colors[index].output = output;
        }
    },

    getters = {
        colors: state => state.colors
    };

export default {
    state,
    mutations,
    getters
};
