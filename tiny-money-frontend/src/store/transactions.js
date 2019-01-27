import axios from 'axios';
import Vue from 'vue';

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
    saveTransaction(state, transaction) {
      const currentIndex = state.transactionsList.findIndex(t => t.id === transaction.id);
      if (currentIndex >= 0) {
        Vue.set(state.transactionsList, currentIndex, transaction);
      } else {
        state.transactionsList.unshift(transaction);
      }
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

    addTransactionAction({ commit, dispatch }, transaction) { // TODO rename to save
      const isUpdate = transaction.id;
      transaction.tags = transaction.tags.map((t) => {
        if (typeof t === 'string' || t instanceof String) { return { id: null, name: t }; }
        return t;
      });

      return axios.post(
        (isUpdate ? `/api/transaction/${transaction.id}` : '/api/transaction'),
        transaction,
      ).then((response) => {
        if ((isUpdate && response.status !== 200) || (!isUpdate && response.status !== 201)) {
          throw Error(response.message);
        }

        let addTransactionResult = response.data;
        if (typeof addTransactionResult !== 'object') {
          addTransactionResult = undefined;
        }
        commit('saveTransaction', addTransactionResult.transaction);
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
