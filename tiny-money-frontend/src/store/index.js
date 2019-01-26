import Vue from 'vue';
import Vuex from 'vuex';

import categoriesModule from './categories';
import transactionsModule from './transactions';
import budgetsModule from './budgets';
import tagsModule from './tags';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  modules: {
    categories: categoriesModule,
    transactions: transactionsModule,
    budgets: budgetsModule,
    tags: tagsModule,
  },
  state: {
  },
  mutations: {
  },
  actions: {
  },
});
