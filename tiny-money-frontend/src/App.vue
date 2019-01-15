<template>
<v-app id="inspire" :dark="darkMode">
    <v-navigation-drawer
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
              <v-list-tile-title>
                {{ item.title }}
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar
      :clipped-left="$vuetify.breakpoint.lgAndUp"
      color="blue darken-3"
      dark
      app
      fixed
    >
      <v-toolbar-title style="width: 300px" class="ml-0 pl-3">
        <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
        <span>TINY</span>
        <span class="font-weight-light">-Money</span>
      </v-toolbar-title>
      <v-text-field
        flat
        solo-inverted
        hide-details
        prepend-inner-icon="search"
        label="Search"
        class="hidden-sm-and-down"
      ></v-text-field>
      <v-spacer></v-spacer>
      <v-btn icon @click="darkMode = !darkMode">
        <v-icon>{{ darkMode ? 'brightness_low' : 'brightness_high'}}</v-icon>
      </v-btn>
      <v-btn icon large>
        <v-avatar size="32px">
          <img
            src="https://www.gravatar.com/avatar/3a54039709969c1600dbb1ef2b322c91?s=200"
            alt="Vuetify"
          >
        </v-avatar>
      </v-btn>
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
      drawer: true,
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
};
</script>
