<script>
import { mapGetters } from 'vuex';
import newColor from './new-color.vue';
import palette from './palette.vue';

export default {
    name: 'app',

    components: {
        palette,
        newColor
    },

    data() {
        return {
            duplicatedColor: null,
            inClipboard: null
        };
    },

    methods: {
        removeColor(index) {
            this.$store.commit('REMOVE_COLOR', { index });
        },

        setColorOutput(index, e) {
            const output = {};

            for (const c of e) {
                output[c.name] = c.background;
            }

            this.$store.commit('SET_COLOR_OUTPUT', { index, output });
        },

        notifyDuplicatedColor(color) {
            if (this.duplicatedColor) {
                return;
            }

            this.duplicatedColor = color;

            setTimeout(() => {
                this.duplicatedColor = null;
            }, 1400);
        },

        isDuplicated(palette) {
            if (!this.duplicatedColor) {
                return false;
            }

            return palette.color === this.duplicatedColor.color ||
                palette.name === this.duplicatedColor.name;
        },

        copyCode(code) {
            const text = document.querySelector(`.palette-code.hex${code.color}`),
                range = document.createRange();

            range.selectNode(text);
            const sel = window.getSelection();
            
            sel.removeAllRanges();
            sel.addRange(range);

            document.execCommand('copy');

            sel.removeAllRanges();

            this.inClipboard = code.color;
        }
    },

    computed: {
        ...mapGetters([
            'colors'
        ])
    }
}
</script>

<template>
    <div class="app">
        <div class="bg-white text-center pt-8 pb-4">
            <h1 class="pt-8 pb-4">Tailwind Color Shades</h1>

            <new-color class="pt-6" @color:duplicated="notifyDuplicatedColor"></new-color>
        </div>

        <transition-group name="scale-list" tag="div" class="palettes flex flex-wrap justify-around">
            <div class="bg-white p-2 my-4 rounded scale-list-item" v-for="(palette, $index) in colors" :key="palette.name">
                <palette :color="palette.color" :name="palette.name" :key="$index"
                    @remove="removeColor($index)" @generate="setColorOutput($index, $event)"
                    :class="{'duplicated': isDuplicated(palette)}"></palette>

                <div class="color-output mt-4">
                    <span class="label">Tailwind code:</span>
                    <span :class="[
                        'btn btn-blue btn-xs float-right -mt-1 cursor-pointer',
                        inClipboard === palette.color ? 'btn-green' : ''
                        ]"
                        @click="copyCode(palette)">
                        <span>
                            <i class="far fa-check-circle" v-show="inClipboard === palette.color"></i> {{ inClipboard === palette.color ? 'copied' : 'copy to clipboard' }}
                        </span>
                    </span>
                    <ul :class="'list-reset italic text-grey p-4 palette-code hex' + palette.color">
                        <li class="pb-2" v-for="(hex, name) in palette.output">
                            '{{ name }}' : '{{ hex }}',
                        </li>
                    </ul>
                </div>
            </div>
        </transition-group>
    </div>
</template>
