import axios from 'axios';

export default {
  namespaced: true,
  state: {
    tagsList: [
    ],
  },
  mutations: {
    getTags(state, tags) {
      state.tagsList = tags;
    },
    addTag(state, tag) {
      state.tagsList.push(tag);
    },
  },
  getters: {
    tags: state => state.tagsList,
  },
  actions: {
    getTagsAction({ commit }) {
      return axios
        .get(`${process.env.VUE_APP_API_NEW}/api/tags`)
        .then((response) => {
          if (response.status !== 200) throw Error(response.message);
          let tags = response.data;
          if (typeof tags !== 'object') {
            tags = [];
          }

          commit('getTags', tags);
          return tags;
        });
      // .catch(captains.error)
    },
    addTagAction({ commit }, tag) {
      commit('addTag', tag);
    },
  },
};
