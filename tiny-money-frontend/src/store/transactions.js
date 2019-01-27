import axios from 'axios';

export default {
  namespaced: true,
  state: {
    transactionsList: [

    ],
    transaction: null,
  },
  mutations: {
    getTransactions(state, transactions) {
      state.transactionsList = transactions;
    },
    addTransaction(state, transaction) {
      state.transactionsList.unshift(transaction);
    },
    getTransaction(state, transaction) {
      state.transaction = transaction;
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

    getTransactionAction({ commit }, transactionId) {
      return axios.get(`/api/transaction/${transactionId}`).then((response) => {
        if (response.status !== 200) throw Error(response.message);
        let transaction = response.data;
        if (typeof transaction !== 'object') {
          transaction = undefined;
        }
        commit('getTransaction', transaction);
        return transaction;
      });
    },
  },
};
