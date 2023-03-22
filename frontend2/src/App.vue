<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" >
      <v-list density="compact">
        <v-list-item v-for="item in items" 
                     :prepend-icon="item.icon" 
                     :title="item.title"
                     :to="item.route"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="blue darken-3">
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      </template>

      <v-toolbar-title>TINY-Money</v-toolbar-title>
      
      <template v-slot:append>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical"
                   v-bind="props"></v-btn>
          </template>

          <v-list>
            <v-list-item>
              <v-list-item-title>{{ $auth.user.nickname }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title @click="logout">
                Wyloguj
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-main>
      <router-view/>
    </v-main>
    
    <v-snackbar v-model="snack" :timeout="3000" :color="snackColor">
      {{ snackText }}
      <v-btn flat @click="snack = false">Close</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import {mapState} from 'vuex';

export default {
  name: 'App',
  data() {
    return {
      drawer: false,
      items: [
        {title: 'Transakcje', icon: 'mdi-currency-usd', route: '/transactions'},
        {title: 'Budżety', icon: 'mdi-chart-line-variant', route: '/budgets'},
        {title: 'Import', icon: 'mdi-cloud-upload', route: '/buffer'},
        {title: 'Raporty', icon: 'mdi-poll', route: '/reports'},
      ],
    };
  },
  computed: {
    ...mapState(['snackColor', 'snackText']),
    snack: {
      get() {
        return this.$store.state.snack;
      },
      set(value) {
        this.$store.dispatch('closeSnack');
      },
    },
  },
  methods: {
    logout() {
      this.$auth.logout();
    },
  },
};
</script>