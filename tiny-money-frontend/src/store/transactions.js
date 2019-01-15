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
    addTransaction(state, transaction) {
      state.transactionsList.unshift(transaction);
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

    addTransactionAction({ commit }, transaction) {
      return axios.post('/api/transaction', transaction).then((response) => {
        if (response.status !== 201) throw Error(response.message);
        let addedTransaction = response.data;
        if (typeof addedTransaction !== 'object') {
          addedTransaction = undefined;
        }
        commit('addTransaction', addedTransaction);
        return addedTransaction;
      });
    },
  },
};
