import Vue from 'vue';
import Vuex from 'vuex';

import categoriesModule from './categories';

Vue.use(Vuex);

export default new Vuex.Store({
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
