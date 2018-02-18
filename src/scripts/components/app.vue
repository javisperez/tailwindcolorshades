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

            return palette.color.toLowerCase() === this.duplicatedColor.color.toLowerCase() ||
                palette.name.toLowerCase() === this.duplicatedColor.name.toLowerCase();
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

            setTimeout(() => {
                this.inClipboard = null;
            }, 5000);
        },

        copyAllCodes() {
            const text = document.querySelector('.palettes-codes'),
                range = document.createRange();

            if (!text) {
                return;
            }

            range.selectNode(text);
            const sel = window.getSelection();

            sel.removeAllRanges();
            sel.addRange(range);

            document.execCommand('copy');

            sel.removeAllRanges();

            this.inClipboard = 'all';

            setTimeout(() => {
                this.inClipboard = null;
            }, 5000);
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
        <!-- Header? -->
        <div class="bg-white text-center pt-8 pb-4">
            <h1 class="pt-8 pb-4">
                Color Shades Generator
                <span style="font-size: 80%;">for TailwindCSS</span>
            </h1>

            <div class="relative mx-auto" style="max-width: 700px">
                <new-color class="pt-6 pb-4" @color:duplicated="notifyDuplicatedColor"></new-color>
                <div class="text-right text-xs" :class="{
                    'opacity-0': !colors.length,
                    'text-link': colors.length
                    }" style="transition: opacity 0.4s;">
                    <span :class="{'pointer-events-none': !colors.length}" @click="copyAllCodes()">
                        <i class="far fa-copy"></i> Copy all generated codes
                    </span>
                </div>
            </div>
        </div>

        <div class="palettes-codes opacity-0 absolute" style="z-index: -1">
            <ul class="list-reset italic text-grey p-4"
                v-for="(palette, $index) in colors" :key="palette.name">
                <li class="pb-2" v-for="(hex, name) in palette.output">
                    '{{ name }}' : '{{ hex.toUpperCase() }}',
                </li>
            </ul>
        </div>

        <!-- Palettes -->
        <transition-group name="scale-list" tag="div" class="palettes flex flex-wrap justify-around">
            <div class="bg-white p-2 my-4 rounded scale-list-item hover:shadow-md"
                v-for="(palette, $index) in colors" :key="palette.name">
                <palette :color="palette.color" :name="palette.name" :key="$index"
                    @remove="removeColor($index)" @generate="setColorOutput($index, $event)"
                    @color:duplicated="notifyDuplicatedColor"
                    :class="{'duplicated': isDuplicated(palette)}"></palette>

                <div class="color-output mt-4">
                    <span class="label">Tailwind code:</span>
                    <span :class="[
                        'btn btn-blue btn-xs float-right -mt-1 cursor-pointer',
                        inClipboard === palette.color ? 'btn-green' : ''
                        ]" @click="copyCode(palette)">
                        <span>
                            <i class="far fa-check-circle" v-show="inClipboard === palette.color"></i> {{ inClipboard === palette.color ? 'copied' : 'copy to clipboard' }}
                        </span>
                    </span>
                    <ul :class="'list-reset italic text-grey p-4 palette-code hex' + palette.color">
                        <li class="pb-2" v-for="(hex, name) in palette.output">
                            '{{ name }}' : '{{ hex.toUpperCase() }}',
                        </li>
                    </ul>
                </div>
            </div>
        </transition-group>

        <!-- Some about text -->
        <div class="container mx-auto mt-8 mb-8 text-center" v-show="!colors.length">
            <h3>What is this?</h3>

            <p>
                Is a tool to make shades and tints for a given color and generate the proper code
                for the TailwindCSS config file.
            </p>

            <p>
                The idea is to make the custom color generation a bit easier when creating custom color variants
                to use in your app's CSS.
            </p>
        </div>

        <!-- Footer? -->
        <footer class="text-center mb-8 text-xs text-grey-dark" style="margin-top: 6rem;">
            <p>
                Color shades/tints generator for
                <a class="text-grey-dark hover:text-grey-darkest"
                href="https://tailwindcss.com" target="_blank">TailwindCSS</a>
                by <a class="text-grey-dark hover:text-grey-darkest"
                    href="https://www.github.com/javisperez">Javis Pérez</a>
            </p>
            <p class="mt-2">
                <a href="https://www.github.com/javisperez/tailwindcolorshades"
                    class="text-grey-dark hover:text-grey-darkest">
                    <i class="fab fa-github fa-2x hover:text-grey-darkest"></i>
                </a>
            </p>
        </footer>
    </div>
</template>
