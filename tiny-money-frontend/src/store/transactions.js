import axios from 'axios';

export default {
  namespaced: true,
  state: {
    transactionsList: [

    ],
  },
  mutations: {
    getTransactions(state, transactions) {
      state.transactionsList = transactions;
    },
  },
  actions: {
    getTransactionsAction({ commit }) {
      return axios
        .get('/api/transaction')
        .then((response) => {
          if (response.status !== 200) throw Error(response.message);
          let transactions = response.data;
          if (typeof transactions !== 'object') {
            transactions = [];
          }

          commit('getTransactions', transactions);
          return transactions;
        });
      // .catch(captains.error)
    },
  },
};
