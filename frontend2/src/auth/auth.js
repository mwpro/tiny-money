export default {
  install(Vue) {
    Vue.config.globalProperties.$auth = {
      isAuthorized: () => true,
      user: {
        nickname: 'dev'
      },
      logout: () => {},
    };
  },
};
