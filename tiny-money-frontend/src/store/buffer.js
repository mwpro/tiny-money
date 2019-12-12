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
    approveTransaction(state, transaction) {
      const currentIndex = state.transactionsList.findIndex(t => t.id === transaction.id);
      if (currentIndex >= 0) {
        Vue.set(state.transactionsList, currentIndex, transaction);
      } else {
        state.transactionsList.unshift(transaction);
      }
    },
    rejectTransaction(state, transactionId) {
      state.transactionsList = [...state.transactionsList.filter(p => p.id !== transactionId)];
    }
  },
  actions: {
    getTransactionsAction({ commit }) {
      return axios
        .get('/api/transaction/buffer')
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

    approveTransactionAction({ commit, dispatch }, transaction) { // TODO rename to save
      const isUpdate = transaction.id;
      transaction.tags = transaction.tags.map((t) => {
        if (typeof t === 'string' || t instanceof String) { return { id: null, name: t }; }
        return t;
      });
      if (typeof transaction.vendor === 'string' || transaction.vendor instanceof String) { 
        transaction.vendor = { id: null, name: transaction.vendor }; 
      }

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
        
        if (transaction.vendor.id === null) { 
          dispatch('vendors/addVendorAction', addTransactionResult.transaction.vendor, { root: true });
        }
        return addTransactionResult;
      });
    },

    rejectTransactionAction({ commit }, transactionId) {
      return axios.delete(`/api/transaction/buffer/${transactionId}`).then((response) => {
        if (response.status !== 200) throw Error(response.message);
        commit('rejectTransaction', transactionId);
      });
    },
  },
};