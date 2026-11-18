<script setup lang="ts">
import { GITHUB_URL, KOFI_URL } from '@/constants'
import { useDonations } from '@/composables/donations'

const { registerDonateClick } = useDonations()
</script>

<template>
  <footer class="mt-20 border-t border-line px-4 py-6 text-center text-xs leading-relaxed text-faint">
    Made by
    <a href="https://github.com/javisperez" target="_blank" rel="noopener noreferrer" class="whitespace-nowrap underline underline-offset-2 hover:text-ink">Javis Pérez</a>
    <span aria-hidden="true"> · </span>
    <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer" class="whitespace-nowrap underline underline-offset-2 hover:text-ink">Source on GitHub</a>

    <div class="mt-3">
      <a :href="KOFI_URL" target="_blank" rel="noopener noreferrer" @click="registerDonateClick('footer')">
        <img height="36" style="border: 0; height: 36px" src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
          alt="Buy Me a Coffee at ko-fi.com" class="inline-block" />
      </a>
    </div>
  </footer>
</template>
