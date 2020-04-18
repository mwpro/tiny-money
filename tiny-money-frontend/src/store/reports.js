import axios from 'axios';

export default {
  namespaced: true,
  state: {
    availableMonths: [],
    selectedMonths: [],
  },
  mutations: {
    getAvailableMonths(state, data) {
      state.availableMonths = data
    },
    setSelectedMonths(state, data) {
      state.selectedMonths = data
    }
  },
  actions: {
    getAvailableMonths({ commit, dispatch }) {
      return axios
        .get(`${process.env.VUE_APP_API_NEW}/api/reports/availableMonths`)
        .then((response) => {
          if (response.status !== 200) throw Error(response.message);
          let availableMonths = response.data.availableMonths;
          if (typeof availableMonths !== 'object') {
            availableMonths = [];
          }

          commit('getAvailableMonths', availableMonths);
        }).catch((error) => {
          console.error(error);
          dispatch(
            'displayErrorSnack',
            'Błąd przy pobieraniu miesięcy dostępnych dla raportów',
            {root: true},
          );
        });
    },
    setSelectedMonths({ commit }, selectedMonths) {
      commit('setSelectedMonths', selectedMonths);
    },
  },
};
