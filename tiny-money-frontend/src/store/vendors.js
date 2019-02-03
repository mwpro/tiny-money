import axios from 'axios';

export default {
  namespaced: true,
  state: {
    vendorsList: [
    ],
  },
  mutations: {
    getVendors(state, vendors) {
      state.vendorsList = vendors;
    },
    addVendor(state, vendor) {
      state.vendorsList.push(vendor);
    },
  },
  getters: {
    vendors: state => state.vendorsList,
  },
  actions: {
    getVendorsAction({ commit }) {
      return axios
        .get('/api/vendor')
        .then((response) => {
          if (response.status !== 200) throw Error(response.message);
          let vendors = response.data;
          if (typeof vendors !== 'object') {
            vendors = [];
          }

          commit('getVendors', vendors);
          return vendors;
        });
      // .catch(captains.error)
    },
    addVendorAction({ commit }, vendor) {
      commit('addVendor', vendor);
    },
  },
};
