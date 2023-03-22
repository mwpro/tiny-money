import { createApp } from 'vue'
import Axios from 'axios';
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

Axios.defaults.baseURL = import.meta.env.VITE_APP_API;
Axios.interceptors.request.use((config) => {
    config.headers.Authorization = import.meta.env.VITE_APP_AUTH_TEMP_TOKEN;
    return config;
}, error => Promise.reject(error));

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