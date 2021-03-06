import auth0 from 'auth0-js';
import Vue from 'vue';

// https://www.storyblok.com/tp/how-to-auth0-vuejs-authentication#auth0-callback-route

// exchange the object with your own from the setup step above.
const webAuth = new auth0.WebAuth({
  domain: process.env.VUE_APP_AUTH_DOMAIN,
  clientID: process.env.VUE_APP_AUTH_CLIENTID,
  redirectUri: process.env.VUE_APP_AUTH_REDIRECTURI,
  // we will use the api/v2/ to access the user information as payload
  audience: process.env.VUE_APP_AUTH_AUDIENCE,
  responseType: process.env.VUE_APP_AUTH_RESPONSETYPE,
  scope: process.env.VUE_APP_AUTH_SCOPE, // define the scopes you want to use
});

const auth = new Vue({
  data() {
    return {
      token: null,
      accessToken: null,
      expiresAt: null,
      user: null,
    };
  },
  computed: {
    isAuthorized() {
      return this.user && new Date().getTime() < this.expiresAt;
    },
  },
  created() {
    this.token = localStorage.getItem('id_token');
    this.accessToken = localStorage.getItem('access_token');
    this.expiresAt = localStorage.getItem('expires_at');
    this.user = JSON.parse(localStorage.getItem('user'));
  },
  methods: {
    login() {
      webAuth.authorize();
    },
    logout() {
      return new Promise((resolve, reject) => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('user');
        this.token = null;
        this.accessToken = null;
        this.expiresAt = null;
        this.user = null;
        webAuth.logout({
          returnTo: process.env.VUE_APP_AUTH_LOGOUT_RETURN,
        });
      });
    },
    isAuthenticated() {
      return new Date().getTime() < this.expiresAt;
    },
    handleAuthentication() {
      return new Promise((resolve, reject) => {
        webAuth.parseHash((err, authResult) => {
          if (authResult && authResult.accessToken && authResult.idToken) {
            const expiresAt = JSON.stringify(authResult.expiresIn * 1000 + new Date().getTime());
            localStorage.setItem('expires_at', expiresAt);
            this.expiresAt = expiresAt;
            this.accessToken = authResult.accessToken;
            localStorage.setItem('access_token', authResult.accessToken);
            this.token = authResult.idToken;
            localStorage.setItem('id_token', authResult.idToken);
            this.user = authResult.idTokenPayload;
            localStorage.setItem('user', JSON.stringify(authResult.idTokenPayload));
            resolve();
          } else if (err) {
            this.logout();
            reject(err);
          }
        });
      });
    },
  },
});

export default {
  install(Vue) {
    Vue.prototype.$auth = auth;
  },
};
