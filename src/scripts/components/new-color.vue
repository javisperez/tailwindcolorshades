<script>
import { mapGetters } from 'vuex';

export default {
    name: 'new-color',

    data() {
        return {
            newColor: {},
            isErrorVisible: false
        }
    },

    mounted() {
        this.reset();
    },

    methods: {
        reset() {
            this.newColor = {
                name: '',
                color: ''
            };

            this.$refs.colorName.focus();
        },

        addColor() {
            const isColorAlreadyAdded = this.colors.findIndex(c => {
                return (
                    c.name.toLowerCase() === this.newColor.name.toLowerCase() ||
                    c.color.toLowerCase() === this.newColor.color.toLowerCase()
                );
            }) > -1;
            const isColorValid = this.validateColor(this.newColor.color);

            if (isColorAlreadyAdded) {
                this.$emit('color:duplicated', this.newColor);
                return;
            }

            if (!this.newColor.name || !this.newColor.color) {
                this.isErrorVisible = true;
                return;
            }

            if (!isColorValid) {
                return;
            }

            this.$store.commit('ADD_COLOR', this.newColor);
            this.reset();
        },

        validateNameInput(e) {
            if (e.which === 13) {
                this.isErrorVisible = !this.newColor.name || !this.newColor.color;
                return;
            }

            const isValid = e.which !== 32;
            if (!isValid) {
                e.preventDefault();
            }

            return isValid;
        },

        validateColorInput(e) {
            if (e.which === 13) {
                this.isErrorVisible = !this.newColor.name || !this.newColor.color;
                return;
            }

            const key = String.fromCharCode(e.charCode || e.which),
                isValid = /^([#0-9A-F])$/ig.test(key);

            if (!isValid || (this.newColor.color.length > 0 && key === '#')) {
                e.preventDefault();
            }

            if (this.newColor.color.length > 5 && this.newColor.color.indexOf('#') === -1) {
                e.preventDefault();
            }

            return isValid;
        },

        validateColor(color) {
            if (!color) {
                return false;
            }

            return /^(#{1})?[0-9A-F]{6}$/i.test(color);
        }
    },

    computed: {
        ...mapGetters([
            'colors'
        ]),

        isDisabled() {
            return !this.newColor.name || !this.validateColor(this.newColor.color) && this.newColor.color;
        }
    }
}
</script>

<template>
    <div class="new-color">
        <form @submit.prevent="addColor" class="flex flex-wrap justify-around flex-1 mx-auto" style="max-width: 600px;">
            <div class="mr-2">
                <label class="block text-left font-bold">
                    Color name <span class="text-red">*</span>
                </label>
                <input type="text" class="input orange bg-grey-lighter"
                    v-model="newColor.name" placeholder="eg. Papaya"
                    @keydown="validateNameInput"
                    @input="isErrorVisible = null" ref="colorName">
            </div>

            <div class="mr-2">
                <label class="block text-left font-bold">
                    Hex code <span class="text-red">*</span>
                </label>
                <input type="text" class="input orange bg-grey-lighter"
                    v-model="newColor.color" placeholder="eg. #E24E42"
                    @keypress="validateColorInput" maxlength="7"
                    @input="isErrorVisible = null">
            </div>

            <div class="mt-6 cursor-pointer">
                <input type="submit" class="btn btn-orange" :disabled="isDisabled" value="Generate">
            </div>
        </form>

        <transition name="error-msg">
            <div v-if="isErrorVisible"
                class="absolute container pin-t flex items-center bg-red text-white text-sm font-bold px-4 py-3"
                style="left: 50%; transform: translateX(-50%);" role="alert">
                <svg class="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z"/></svg>
                <p>Sorry but both fields are required</p>
            </div>
        </transition>
    </div>
</template>
