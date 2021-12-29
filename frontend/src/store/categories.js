import axios from 'axios';

export default {
  namespaced: true,
  state: {
    categoriesList: [
    ],
  },
  getters: {
    subcategories: state => [].concat(...state.categoriesList.map(c => c.subcategories.map((s) => {
      s.fullName = `${c.name} / ${s.name}`;
      return s;
    }))),
  },
  mutations: {
    getCategories(state, categories) {
      state.categoriesList = categories;
    }
  },
  actions: {
    getCategories({ commit }) {
      return axios
        .get("/api/categories")
        .then((response) => {
          if (response.status !== 200) throw Error(response.message);
          let categories = response.data;
          if (typeof categories !== 'object') {
            categories = [];
          }

          commit('getCategories', categories);
          return categories;
        });
      // .catch(captains.error)
    }
  },
};
