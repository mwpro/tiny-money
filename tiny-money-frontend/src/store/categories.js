import axios from 'axios';

export default {
  namespaced: true,
  state: {
    mockIdGenerator: 100,
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
    },
    addCategory(state, category) {
      state.categoriesList.push(category);
    },
    removeSubcategory(state, subcategory) {
      state.categoriesList.filter(c => c.id === subcategory.parentCategoryId)
        .forEach((category) => {
          category.subcategories = [...category.subcategories.filter(p => p.id !== subcategory.id)];
        });
    },
    removeCategory(state, category) {
      state.categoriesList = [...state.categoriesList.filter(p => p.id !== category.id)];
    },
    addSubcategory(state, subcategory) {
      state.categoriesList.filter(c => c.id === subcategory.parentCategoryId)
        .forEach((category) => {
          category.subcategories.push(subcategory);
        });
    },
    updateSubcategory(state, subcategory) {
      state.categoriesList.filter(c => c.id === subcategory.parentCategoryId)
        .forEach((category) => {
          category.subcategories.filter(s => s.id === subcategory.id).forEach((s) => {
            s.name = subcategory.name; // todo what about moving between categories?
          });
        });
    },
    updateCategory(state, category) {
      state.categoriesList.filter(c => c.id === category.id).forEach((c) => {
        c.name = category.name; // todo what about moving between categories?
      });
    },
  },
  actions: {
    getCategories({ commit }) {
      return axios
        .get('/api/category')
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
    },
    saveCategory({ commit }, category) {
      // todo http
      if (category.id) {
        commit('updateCategory', category);
        // todo http
        return null;
      }
      return axios.post('/api/category', category).then((response) => {
        if (response.status !== 201) throw Error(response.message);
        let addedCategory = response.data;
        if (typeof addedCategory !== 'object') {
          addedCategory = undefined;
        }
        commit('addCategory', addedCategory);
        return addedCategory;
      });
    },
    removeSubcategory({ commit }, subcategory) {
      // todo http
      commit('removeSubcategory', subcategory);
    },
    removeCategory({ commit }, category) {
      // todo http
      commit('removeCategory', category);
    },
    saveSubcategory({ commit }, subcategory) {
      if (subcategory.id) {
        commit('updateSubcategory', subcategory);
        // todo http
        return null;
      }
      return axios.post(`/api/category/${subcategory.parentCategoryId}/subcategory`, subcategory).then((response) => {
        if (response.status !== 201) throw Error(response.message);
        let addedSubcategory = response.data;
        if (typeof addedSubcategory !== 'object') {
          addedSubcategory = undefined;
        }
        commit('addSubcategory', addedSubcategory);
        return addedSubcategory;
      });
    },
  },
};
