import Vue from 'vue';
import Vuex from 'vuex';

import categoriesModule from './categories';
import transactionsModule from './transactions';
import budgetsModule from './budgets';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  modules: {
    categories: categoriesModule,
    transactions: transactionsModule,
    budgets: budgetsModule
  },
  state: {
  },
  mutations: {
  },
  actions: {
  },
});
