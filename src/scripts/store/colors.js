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
        },

        RENAME_COLOR(state, { currentName, newName }) {
            const index = state.colors.findIndex(c => c.name.toLowerCase() === currentName.toLowerCase());

            if (index === -1) {
                return;
            }

            state.colors[index].name = newName;
        },

        RESET_COLORS(state) {
            state.colors = [];
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
