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
    getTransactionsAction({ commit }, selectedMonth) {
      // TODO appending '-01' does not seem to be the best practice :)
      return axios
        .get('/api/transaction', {
          params: {
            month: `${selectedMonth}-01`,
          },
        })
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
      transaction.tags = transaction.tags.map((t) => {
        if (typeof t === 'string' || t instanceof String) { return { id: null, name: t }; }
        return t;
      });

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
