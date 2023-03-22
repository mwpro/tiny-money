import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store';
import auth from "./auth/auth";
import { aliases, mdi } from 'vuetify/iconsets/mdi'


// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const app = createApp(App)
const vuetify = createVuetify({
    components,
    directives,
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        }
    },
})

app.use(router).use(vuetify).use(store).use(auth);

app.mount('#app')