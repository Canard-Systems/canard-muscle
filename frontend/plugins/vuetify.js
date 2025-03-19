// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default defineNuxtPlugin((app) => {
    const vuetify = createVuetify({
        icons: {
            iconfont: 'mdi', // 'mdi' || 'mdiSvg'
        },
        theme: {
            defaultTheme: 'dark',
            themes: {
                light: {
                    colors: {
                        primary: '#1867C0',
                        secondary: '#5cbbf6',
                    },
                },
                dark: {
                    colors: {
                        primary: '#1867C0',
                        secondary: '#5cbbf6',
                    },
                },
            },
        },
    })
    app.vueApp.use(vuetify)
})
