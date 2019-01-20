import axios from 'axios';

export default {
  namespaced: true,
  state: {
    budgetsList: [

    ],
  },
  mutations: {
    getBudgets(state, budgets) {
      state.budgetsList = budgets;
    },
  },
  actions: {
    getBudgetsAction({ commit }, selectedMonth) {
      // TODO appending '-01' does not seem to be the best practice :)
      return axios
        .get(`/api/budget/${selectedMonth.substr(0,4)}/${selectedMonth.substr(5, 7)}`)
        .then((response) => {
          if (response.status !== 200) throw Error(response.message);
          let budgets = response.data;
          if (typeof budgets !== 'object') {
            budgets = [];
          }

          commit('getBudgets', budgets);
          return budgets;
        });
      // .catch(captains.error)
    },
  },
};
