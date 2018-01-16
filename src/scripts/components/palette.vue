<script>
export default {
    name: 'palette',

    props: {
        name: String,
        color: String
    },

    data() {
        return {
            tints: {
                lightest: 0.9,
                lighter: 0.6,
                light: 0.3
            },

            shades: {
                dark: 0.9,
                darker: 0.6,
                darkest: 0.3
            },

            colors: []
        };
    },

    mounted() {
        this.generate();
    },

    methods: {
        remove() {
            this.$emit('remove');
        },

        hexPart: c => `0${c.toString(16)}`.slice(-2),

        hexToRgb(hex) {
            const color = `#${hex}`,
                components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);

            if (!components) {
                return null;
            }

            return {
                r: parseInt(components[1], 16),
                g: parseInt(components[2], 16),
                b: parseInt(components[3], 16)
            };
        },

        rgbToHex(r, g, b) {
            return `#${this.hexPart(r)}${this.hexPart(g)}${this.hexPart(b)}`;
        },

        tint(hex, intensity) {
            const color = this.hexToRgb(hex),
                r = Math.round(color.r + ((255 - color.r) * intensity)),
                g = Math.round(color.g + ((255 - color.g) * intensity)),
                b = Math.round(color.b + ((255 - color.b) * intensity));

            return this.rgbToHex(r, g, b);
        },

        shade(hex, intensity) {
            const color = this.hexToRgb(hex),
                r = Math.round(color.r * intensity),
                g = Math.round(color.g * intensity),
                b = Math.round(color.b * intensity);

            return this.rgbToHex(r, g, b);
        },

        getTextColor(color) {
            const {r, g, b} = this.hexToRgb(color.replace(/#/ig, '')),
                luma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
            
            return (luma < 120) ? '#fff' : '#333';
        },

        generate() {
            console.log(this.color);
            // Tints
            for (const key in this.tints) {
                const tint = this.tints[key],
                    tinted = this.tint(this.color, tint);

                this.colors.push({
                    name: `${this.name}-${key}`,
                    label: key,
                    background: tinted,
                    text: this.getTextColor(tinted)
                })
            }

            // Base
            this.colors.push({
                name: this.name,
                label: 'base',
                background: `#${this.color}`,
                text: this.getTextColor(this.color)
            });

            // Shades
            for (const key in this.shades) {
                const shade = this.shades[key],
                    shaded = this.shade(this.color, shade);

                this.colors.push({
                    name: `${this.name}-${key}`,
                    label: key,
                    background: shaded,
                    text: this.getTextColor(shaded)
                })
            }

            // Notify our parent that we're done
            this.$emit('generate', this.colors);
        }

    },

    computed: {
        text() {
            return this.getTextColor(this.color);
        }
    }
}
</script>

<template>
    <div class="palette">
        <span class="close float-right p-2 cursor-pointer" @click="remove()">
            <i class="far fa-trash-alt text-white"></i>
        </span>
        <ul class="list-reset">
            <li :style="{
                    backgroundColor: '#'+color,
                    color: text
                }">
                <div>{{ name }}</div>
                <div class="color-code">#{{ color }}</div>
            </li>
            <!-- Tints and shades -->
            <li v-for="(color, $index) in colors" :style="{
                    backgroundColor: color.background,
                    color: color.text
                }" :key="$index">
                <span>{{ color.label }}</span>
                <span class="color-code float-right">{{ color.background }}</span>
            </li>
        </ul>
    </div>
</template>