import axios from 'axios';

export default {
  namespaced: true,
  state: {
    budgetsList: undefined,
  },
  mutations: {
    getBudgets(state, budgets) {
      state.budgetsList = budgets.budgetEntries;
    },
    saveBudget(state, budget) {
      const budgetEntry = state.budgetsList.find(b => b.subcategoryId === budget.subcategoryId);
      budgetEntry.amount = budget.amount;
      budgetEntry.notes = budget.notes;
    },
  },
  actions: {
    getBudgetsAction({ commit }, selectedMonth) {
      // TODO appending '-01' does not seem to be the best practice :)
      return axios
        .get(`/api/budget/${selectedMonth.substr(0, 4)}/${selectedMonth.substr(5, 7)}`)
        .then((response) => {
          if (response.status !== 200) throw Error(response.message);
          let budgets = response.data;
          if (typeof budgets !== 'object') {
            budgets = [];
          }

          commit('getBudgets', budgets);
          return budgets;
        });
    },
    saveBudgetAction({ commit }, budget) {
      return axios
        .post(`/api/budget/${budget.year}/${budget.month}/subcategory/${budget.subcategoryId}`, {
          budgetAmount: budget.amount,
          notes: budget.notes,
        })
        .then((response) => {
          if (response.status !== 202) throw Error(response.message);

          commit('saveBudget', budget);
          return budget;
        });
    },
    copyBudgetAction({ dispatch }, budgetCopy) {
      return axios
        .post(`/api/budget/${budgetCopy.yearFrom}/${budgetCopy.monthFrom}/copy/${budgetCopy.yearTo}/${budgetCopy.monthTo}`)
        .then((response) => {
          if (response.status !== 201) throw Error(response.message);

          dispatch('getBudgetsAction', `${budgetCopy.yearTo}-${budgetCopy.monthTo}`);
        });
    },
  },
};
