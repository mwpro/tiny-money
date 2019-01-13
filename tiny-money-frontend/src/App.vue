<template>
  <v-app>
    <v-navigation-drawer fixed clipped v-model="drawer" app>
      <v-toolbar flat>
        <v-list>
          <v-list-tile>
            <v-list-tile-title class="title">TINY-Money</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-toolbar>
      <v-divider></v-divider>

      <v-list dense class="pt-0">
        <v-list-tile v-for="item in items" :key="item.title" :to="item.route">
          <v-list-tile-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-tile-action>

          <v-list-tile-content>
            <v-list-tile-title>{{ item.title }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar app>
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title class="headline text-uppercase">
        <span>TINY</span>
        <span class="font-weight-light">-Money</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- <v-btn flat href="https://github.com/vuetifyjs/vuetify/releases/latest" target="_blank">
        <span class="mr-2">Latest Release</span>
        <v-icon>open_in_new</v-icon>
      </v-btn>-->
    </v-toolbar>

    <v-content>
      <v-container fluid>
        <router-view/>
      </v-container>
    </v-content>
    <v-footer app></v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      drawer: false,
      items: [
        { title: 'Home', icon: 'dashboard', route: '/' },
        { title: 'Transactions', icon: 'attach_money', route: '/transactions' },
        { title: 'Budgets', icon: 'show_chart', route: '/budgets' },
        { title: 'Tags', icon: '#', route: '/tags' },
        { title: 'Vendors', icon: 'business', route: '/vendors' },
        {
          title: 'Categories',
          icon: 'format_list_bulleted',
          route: '/categories',
        },
      ],
    };
  },
};
</script>
