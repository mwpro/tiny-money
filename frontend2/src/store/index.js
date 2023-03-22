import { createStore } from 'vuex'

// import bufferModule from './buffer';
// import categoriesModule from './categories';
import transactionsModule from './transactions';
// import budgetsModule from './budgets';
// import tagsModule from './tags';
// import vendorsModule from './vendors';
// import reportsModule from "./reports";

export default createStore({
  strict: true,
  modules: {
    // buffer: bufferModule,
    // categories: categoriesModule,
    transactions: transactionsModule,
    // budgets: budgetsModule,
    // tags: tagsModule,
    // vendors: vendorsModule,
    // reports: reportsModule,
  },
  state: {
    snackText: '',
    snack: false,
    snackColor: '',
  },
  mutations: {
    setSnack(state, snack) {
      state.snackText = snack.snackText;
      state.snack = true;
      state.snackColor = snack.snackColor;
    },
    closeSnack(state) {
      state.snack = false;
    },
  },
  actions: {
    displaySuccessSnack({ commit }, message) {
      commit('setSnack', { snackText: message, snackColor: 'success' });
    },
    displayErrorSnack({ commit }, message) {
      commit('setSnack', { snackText: message, snackColor: 'red' });
    },
    closeSnack({ commit }) {
      commit('closeSnack');
    },
  },
});
