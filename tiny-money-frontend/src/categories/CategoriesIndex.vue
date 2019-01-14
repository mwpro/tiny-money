<template>
  <v-layout>
    <v-btn color="green" dark absolute bottom right fab :to="{ name: 'addCategory'}">
      <v-icon>add</v-icon>
    </v-btn>

    <v-container grid-list-xl="true">
      <v-layout row wrap>
        <v-flex v-for="(category, categoryIndex) in categories" :key="categoryIndex">
          <v-card>
            <v-card-title primary-title>
              <div>
                <h3 class="headline mb-0">{{ category.name }}</h3>
                <v-list subheader dense>
                  <v-list-tile v-for="(subcategory, subcategoryIndex) in category.subcategories"
                      :key="subcategoryIndex">

                    <v-list-tile-content>
                      <v-list-tile-title>{{ subcategory.name }}</v-list-tile-title>
                    </v-list-tile-content>

                    <v-list-tile-action>
                      <v-btn icon ripple
                        :to="{ name: 'editSubcategory', params: { categoryId: category.id, subcategoryId: subcategory.id} }
                      ">
                        <v-icon color="grey lighten-1">create</v-icon>
                      </v-btn>
                    </v-list-tile-action>
                    <v-list-tile-action>
                      <v-btn icon ripple @click="deleteSubcategory(subcategory)">
                        <v-icon color="grey lighten-1">delete</v-icon>
                      </v-btn>
                    </v-list-tile-action>
                  </v-list-tile>
                </v-list>
              </div>
            </v-card-title>

            <v-card-actions>
              <v-btn flat color="orange"
                :to="{ name: 'addSubcategory', params: { categoryId: category.id} }">
                Dodaj podkategorię
              </v-btn>
              <v-btn flat color="orange"
                :to="{ name: 'editCategory', params: { categoryId: category.id} }">
                Edytuj
              </v-btn>
              <v-btn flat color="orange" @click="deleteCategory(category)">Usuń</v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-layout>
</template>
<script>
import { mapGetters } from 'vuex';

export default {
  name: 'CategoriesIndex',
  computed: {
    ...mapGetters('categories', { categories: 'categories' }),
  },
  methods: {
    deleteSubcategory(subcategory) {
      this.$store.dispatch('categories/removeSubcategory', subcategory);
    },
    deleteCategory(category) {
      this.$store.dispatch('categories/removeCategory', category);
    },
  },
};
</script>

<style scoped>
</style>
