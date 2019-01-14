import Vue from 'vue';
import Vuex from 'vuex';

import categoriesModule from './categories';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  modules: {
    categories: categoriesModule,
  },
  state: {
  },
  mutations: {
  },
  actions: {
  },
});
