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
      // todo api
      const transactions = [{
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      },
      {
        date: '2018-01-01',
        category: 'Zwierzęta / Niczko',
        amount: -150,
      },
      {
        date: '2018-01-30',
        category: 'Przychody / Pensja',
        amount: 8000,
      }];

      commit('getTransactions', transactions);
    },
  },
};
