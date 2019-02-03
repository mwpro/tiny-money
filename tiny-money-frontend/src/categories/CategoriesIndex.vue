<template>
  <v-layout>
    <v-btn color="green" fab bottom right dark fixed :to="{ name: 'addCategory'}">
      <v-icon>add</v-icon>
    </v-btn>

    <v-container>
      <v-layout row wrap>
        <v-flex>
          <v-data-table
            :items="categories"
            :headers="headers"
            :hide-actions="true"
            class="elevation-1"
            pagination.rowsPerPage="10"
          >
            <template slot="items" slot-scope="props">
              <tr>
                <th class="text-xs-left">{{ props.item.name }}</th>
                <th class="text-xs-right">
                  <v-icon small class="mr-2"
                    :to="{ name: 'addSubcategory', params: { categoryId: props.item.id} }"
                  >add</v-icon>
                  <v-icon small class="mr-2"
                    :to="{ name: 'editCategory', params: { categoryId: props.item.id} }"
                  >create</v-icon>
                  <v-icon small class="mr-2" @click="deleteCategory(props.item)">delete</v-icon>
                </th>
              </tr>
              <tr v-for="subcategory in props.item.subcategories" :key="subcategory.subcategoryId">
                <td class="text-xs-left">{{ subcategory.name }}</td>
                <td class="text-xs-right">
                  <v-icon
                    small
                    class="mr-2"
                    :to="{ name: 'editSubcategory', params: { categoryId: props.item.id, subcategoryId: subcategory.id} }"
                  >
                    create
                  </v-icon>
                  <v-icon small class="mr-2" @click="deleteSubcategory(subcategory)">delete</v-icon>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-flex>
      </v-layout>
    </v-container>
  </v-layout>
</template>
<script>
import { mapState } from 'vuex';

export default {
  name: 'CategoriesIndex',
  data() {
    return {
      headers: [
        {
          text: 'Kategoria',
          sortable: false,
          value: 'category',
        },
        { sortable: false },
      ],
    };
  },
  computed: {
    ...mapState('categories', { categories: 'categoriesList' }),
  },
  created() {
    this.$store.dispatch('categories/getCategories');
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
