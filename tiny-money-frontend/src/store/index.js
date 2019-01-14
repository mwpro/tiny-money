import Vue from 'vue';
import Vuex from 'vuex';

import categoriesModule from './categories';
import transactionsModule from './transactions';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  modules: {
    categories: categoriesModule,
    transactions: transactionsModule,
  },
  state: {
  },
  mutations: {
  },
  actions: {
  },
});
