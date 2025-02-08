// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    components: [
        {
            path: '~/components',
            pathPrefix: false,
        },
    ],
    modules: [
        '@nuxtjs/tailwindcss',
    ],
    compatibilityDate: '2025-01-27',
});
