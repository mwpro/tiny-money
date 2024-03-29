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
        state.transactionsList.push(transaction); // todo should be added in place
      }
    },
    deleteTransaction(state, transactionId) {
      state.transactionsList = [...state.transactionsList.filter(p => p.id !== transactionId)];
    },
    getTransaction(state, transaction) {
      state.transaction = transaction;
    },
  },
  actions: {
    getTransactionsAction({ commit }, searchOptions) {
      return axios
        .get("/api/transactions", {
          params: searchOptions,
        })
        .then((response) => {
          if (response.status !== 200) throw Error(response.statusText);
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
      if (typeof transaction.vendor === 'string' || transaction.vendor instanceof String) {
        transaction.vendor = { id: null, name: transaction.vendor };
      }

      return axios.post(
        (isUpdate ? `/api/transactions/${transaction.id}` : "/api/transactions"),
        transaction,
      ).then((response) => {
        if ((isUpdate && response.status !== 200) || (!isUpdate && response.status !== 201)) {
          throw Error(response.statusText);
        }

        let addTransactionResult = response.data;
        if (typeof addTransactionResult !== 'object') {
          addTransactionResult = undefined;
        }
        commit('saveTransaction', addTransactionResult.transaction);
        addTransactionResult.newTags.forEach((t) => {
          dispatch('tags/addTagAction', t, { root: true });
        });

        if (addTransactionResult.newVendor) {
          dispatch('vendors/addVendorAction', addTransactionResult.newVendor, { root: true });
        }
        return addTransactionResult;
      });
    },

    deleteTransactionAction({ commit }, transactionId) {
      return axios.delete(`/api/transactions/${transactionId}`).then((response) => {
        if (response.status !== 200) throw Error(response.statusText);
        commit('deleteTransaction', transactionId);
      });
    },

    getTransactionAction({ commit }, transactionId) {
      return axios.get(`/api/transactions/${transactionId}`).then((response) => {
        if (response.status !== 200) throw Error(response.statusText);
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
