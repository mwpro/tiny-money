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
        //state.transactionsList.unshift(transaction);
        state.transactionsList.splice(currentIndex, 1)
        //Vue.set(state.transactionsList, currentIndex, transaction);
      } else {
        //state.transactionsList.unshift(transaction);
      }
    },
    rejectTransaction(state, transactionId) {
      state.transactionsList = [...state.transactionsList.filter(p => p.id !== transactionId)];
    }
  },
  actions: {
    getTransactionsAction({ commit }) {
      return axios
        .get("/api/transaction/buffer")
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

    importTransactionsAction({ commit, dispatch }, importData) {
      const params = new URLSearchParams();
      params.append('fileContent', importData.transactions);
      params.append('fileType', importData.type);
      return axios.post("/api/transaction/buffer/", params)
      .then((response) => {
        if (response.status !== 201) {
          throw Error(response.message);
        }

        let importTransactionsResult = response.data;
        if (typeof importTransactionsResult !== 'object') {
          importTransactionsResult = undefined;
        }

        dispatch("getTransactionsAction");
        return importTransactionsResult;
      });
    },

    approveTransactionAction({ commit, dispatch }, transaction) { // TODO rename to save
      transaction.tags = transaction.tags.map((t) => {
        if (typeof t === 'string' || t instanceof String) { return { id: null, name: t }; }
        return t;
      });
      if (typeof transaction.vendor === 'string' || transaction.vendor instanceof String) {
        transaction.vendor = { id: null, name: transaction.vendor };
      }

      return axios.post(`/api/transaction/buffer/${transaction.id}`,
        transaction,
      ).then((response) => {
        if (response.status !== 200) {
          throw Error(response.message);
        }

        let addTransactionResult = response.data;
        if (typeof addTransactionResult !== 'object') {
          addTransactionResult = undefined;
        }
        commit('approveTransaction', transaction);
        addTransactionResult.newTags.forEach((t) => {
          dispatch('tags/addTagAction', t, { root: true });
        });

        if (addTransactionResult.newVendor) {
          dispatch('vendors/addVendorAction', addTransactionResult.newVendor, { root: true });
        }
        return addTransactionResult.transaction;
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
