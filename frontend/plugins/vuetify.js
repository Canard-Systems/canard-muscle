// plugins/vuetify.ts (ou .js)
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default defineNuxtPlugin((nuxtApp) => {
    const vuetify = createVuetify({
        icons: {
            defaultSet: 'mdi',
            aliases,
            sets: {
                mdi,
            },
        },
        theme: {
            defaultTheme: 'dark',
            themes: {
                dark: {
                    dark: true,
                    colors: {
                        primary: '#1867C0',
                        secondary: '#5cbbf6',
                        background: '#121212',
                        surface: '#1E1E1E',
                        'on-surface': '#FFFFFF',
                    },
                },
                light: {
                    colors: {
                        primary: '#1867C0',
                        secondary: '#5cbbf6',
                    },
                },
            },
        },

        defaults: {
            VTextField: {
                variant: 'outlined',
                color: 'primary',
                style: {
                    color: '#FFF',
                    backgroundColor: '#2a2a2a'
                }
            },
            VTextarea: {
                variant: 'outlined',
                color: 'primary',
                style: {
                    color: '#FFF',
                    backgroundColor: '#2a2a2a'
                }
            }
        },
    })

    nuxtApp.vueApp.use(vuetify)
})
