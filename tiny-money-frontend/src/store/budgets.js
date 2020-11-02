import axios from 'axios';

export default {
  namespaced: true,
  state: {
    budgetsList: [

    ],
  },
  mutations: {
    getBudgets(state, budgets) {
      state.budgetsList = budgets.budgetEntries;
    },
    saveBudget(state, budget) {
      for (const category of state.budgetsList) {
        for (const subcategory of category.subcategories) {
          if (subcategory.subcategoryId == budget.subcategoryId) {
            subcategory.amount = budget.amount;
          }
        }
      }
    },
  },
  actions: {
    getBudgetsAction({ commit }, selectedMonth) {
      // TODO appending '-01' does not seem to be the best practice :)
      return axios
        .get(`${process.env.VUE_APP_API_NEW}/api/budget/${selectedMonth.substr(0, 4)}/${selectedMonth.substr(5, 7)}`)
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
    saveBudgetAction({ commit }, budget) {
      return axios
        .post('/api/budget', budget)
        .then((response) => {
          if (response.status !== 200) throw Error(response.message);

          commit('saveBudget', budget);
          return budget;
        });
      // .catch(captains.error)
    },
    copyBudgetAction({ dispatch }, budgetCopy) {
      return axios
        .post(`/api/budget/${budgetCopy.yearFrom}/${budgetCopy.monthFrom}/copy/${budgetCopy.yearTo}/${budgetCopy.monthTo}`)
        .then((response) => {
          if (response.status !== 200) throw Error(response.message);


          dispatch('getBudgetsAction', `${budgetCopy.yearTo}-${budgetCopy.monthTo}`);
        });
      // .catch(captains.error)
    },
  },
};
