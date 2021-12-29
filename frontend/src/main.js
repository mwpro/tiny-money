import Vue from 'vue';
import './plugins/vuetify';
import Axios from 'axios';
import App from './App.vue';
import router from './router';
import store from './store';
import auth from './auth/auth';


Vue.config.productionTip = false;

Vue.use(auth);

Vue.filter('currency', value => `${value} PLN`);
Vue.filter('toFixed', (price, limit) => price ? price.toFixed(limit) : '');
Vue.filter('date', date => new Date(date).toLocaleDateString());

Axios.defaults.baseURL = process.env.VUE_APP_API;
Axios.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${Vue.prototype.$auth.accessToken}`;
  return config;
}, error => Promise.reject(error));

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
