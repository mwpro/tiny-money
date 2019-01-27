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
    getTransactionsAction({ commit }, searchOptions) {
      return axios
        .get('/api/transaction', {
          params: searchOptions,
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

    addTransactionAction({ commit, dispatch }, transaction) {
      transaction.tags = transaction.tags.map((t) => {
        if (typeof t === 'string' || t instanceof String) { return { id: null, name: t }; }
        return t;
      });
      transaction.amount = transaction.amount.replace(',', '.'); // 🙈

      return axios.post('/api/transaction', transaction).then((response) => {
        if (response.status !== 201) throw Error(response.message);
        let addTransactionResult = response.data;
        if (typeof addTransactionResult !== 'object') {
          addTransactionResult = undefined;
        }
        commit('addTransaction', addTransactionResult.transaction);
        addTransactionResult.addedTags.forEach((t) => {
          dispatch('tags/addTagAction', t, { root: true });
        });
        return addTransactionResult;
      });
    },
  },
};
