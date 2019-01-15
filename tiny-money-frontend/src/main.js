import Vue from 'vue';
import './plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.config.productionTip = false;

Vue.filter('currency', value => `${value} PLN`);

Vue.filter('toFixed', (price, limit) => price.toFixed(limit));


new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
