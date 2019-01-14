export default {
  namespaced: true,
  state: {
    mockIdGenerator: 100,
    list: [
      {
        id: 1,
        name: 'Jedzenie',
        subcategories:
                    [
                      { id: 2, name: 'Dom', parentCategoryId: 1 },
                      { id: 3, name: 'Miasto', parentCategoryId: 1 },
                      { id: 4, name: 'Praca', parentCategoryId: 1 },
                    ],
      },
      {
        id: 5,
        name: 'Mieszkanie/dom',
        subcategories:
                    [
                      { id: 6, name: 'Czynsz', parentCategoryId: 5 },
                      { id: 7, name: 'Woda', parentCategoryId: 5 },
                      { id: 8, name: 'Prąd', parentCategoryId: 5 },
                      { id: 9, name: 'Gaz', parentCategoryId: 5 },
                      { id: 10, name: 'Ogrzewanie', parentCategoryId: 5 },
                      { id: 11, name: 'Konserwacje i naprawy', parentCategoryId: 5 },
                      { id: 12, name: 'Wyposażenie', parentCategoryId: 5 },
                    ],
      },
    ],
  },
  mutations: {
    addCategory(state, category) {
      state.mockIdGenerator += 1;
      category.id = state.mockIdGenerator;
      state.list.push(category);
    },
    removeSubcategory(state, subcategory) {
      state.list.filter(c => c.id === subcategory.parentCategoryId).forEach((category) => {
        category.subcategories = [...category.subcategories.filter(p => p.id !== subcategory.id)];
      });
    },
    removeCategory(state, category) {
      state.list = [...state.list.filter(p => p.id !== category.id)];
    },
    addSubcategory(state, subcategory) {
      state.mockIdGenerator += 1;
      subcategory.id = state.mockIdGenerator;
      state.list.filter(c => c.id === subcategory.parentCategoryId).forEach((category) => {
        category.subcategories.push(subcategory);
      });
    },
    updateSubcategory(state, subcategory) {
      state.list.filter(c => c.id === subcategory.parentCategoryId).forEach((category) => {
        category.subcategories.filter(s => s.id === subcategory.id).forEach((s) => {
          s.name = subcategory.name; // todo what about moving between categories?
        });
      });
    },
    updateCategory(state, category) {
      state.list.filter(c => c.id === category.id).forEach((c) => {
        c.name = category.name; // todo what about moving between categories?
      });
    },
  },
  actions: {
    saveCategory({ commit }, category) {
      // todo http
      if (category.id) {
        commit('updateCategory', category);
      } else {
        commit('addCategory', category);
      }
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
      // todo http
      if (subcategory.id) {
        commit('updateSubcategory', subcategory);
      } else {
        commit('addSubcategory', subcategory);
      }
    },
  },
};
