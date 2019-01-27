<template>
  <v-app id="inspire" :dark="darkMode">
    <v-navigation-drawer
      v-if="$auth.user"
      :clipped="$vuetify.breakpoint.lgAndUp"
      v-model="drawer"
      fixed
      app
    >
      <v-list dense>
        <template v-for="item in items">
          <v-list-tile :key="item.title" :to="item.route">
            <v-list-tile-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>{{ item.title }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar :clipped-left="$vuetify.breakpoint.lgAndUp" color="blue darken-3" dark app fixed>
      <v-toolbar-title style="width: 300px" class="ml-0 pl-3">
        <v-toolbar-side-icon v-if="$auth.user" @click.stop="drawer = !drawer"></v-toolbar-side-icon>
        <span>TINY</span>
        <span class="font-weight-light">-Money</span>
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-menu v-if="$auth.user" offset-y>
        <v-btn icon large slot="activator">
          <v-avatar size="32px">
            <img
              :src="`${$auth.user.picture}?s=200`"
              alt="Vuetify"
            >
          </v-avatar>
        </v-btn>
        <v-list>
          <v-list-tile>
            <v-list-tile-title>
              {{ $auth.user.nickname }}
            </v-list-tile-title>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title
              @click="darkMode = !darkMode"
            >{{ darkMode ? 'Tryb ciemny' : 'Tryb jasny'}}</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="logout">
            <v-list-tile-title>Wyloguj</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
    </v-toolbar>
    <v-content>
      <v-container fluid>
        <router-view/>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      drawer: false,
      darkMode: false,
      items: [
        { title: 'Home', icon: 'dashboard', route: '/' },
        { title: 'Transakcje', icon: 'attach_money', route: '/transactions' },
        { title: 'Budżety', icon: 'show_chart', route: '/budgets' },
        // { title: 'Tagi', icon: '#', route: '/tags' },
        // { title: 'Sprzedawcy', icon: 'business', route: '/vendors' },
        {
          title: 'Kategorie',
          icon: 'format_list_bulleted',
          route: '/categories',
        },
      ],
    };
  },
  methods: {
    logout() {
      this.$auth.logout();
    },
  },
};
</script>
