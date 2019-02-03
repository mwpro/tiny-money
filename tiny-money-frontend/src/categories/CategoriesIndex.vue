<template>
  <v-layout>
    <v-btn color="green" fab bottom right dark fixed :to="{ name: 'addCategory'}">
      <v-icon>add</v-icon>
    </v-btn>
    <v-dialog v-model="isDeleteCategoryActive" persistent max-width="400">
      <v-card>
        <v-card-title class="headline">Czy na pewno chcesz usunąć kategorię?</v-card-title>
                <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat @click="isDeleteCategoryActive = false">Nie</v-btn>
          <v-btn color="green darken-1" flat @click="deleteCategory()">Tak</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="isDeleteSubcategoryActive" persistent max-width="400">
      <v-card>
        <v-card-title class="headline">Czy na pewno chcesz usunąć podkategorię?</v-card-title>
                <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat @click="isDeleteSubcategoryActive = false">Nie</v-btn>
          <v-btn color="green darken-1" flat @click="deleteSubcategory()">Tak</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
                  <v-icon class="mr-2" @click="openAddSubcategory(props.item.id)">add</v-icon>
                  <!-- <v-icon class="mr-2"
                    :to="{ name: 'editCategory', params: { categoryId: props.item.id} }"
                  >create</v-icon> -->
                  <v-icon class="mr-2" @click="openDeleteCategory(props.item.id)">delete</v-icon>
                </th>
              </tr>
              <tr v-for="subcategory in props.item.subcategories" :key="subcategory.subcategoryId">
                <td class="text-xs-left">{{ subcategory.name }}</td>
                <td class="text-xs-right">
                  <!-- <v-icon class="mr-2"
                    :to="{ name: 'editSubcategory', params: { categoryId: props.item.id, subcategoryId: subcategory.id} }"
                  >
                    create
                  </v-icon> -->
                  <v-icon class="mr-2" @click="openDeleteSubcategory(subcategory.id)">delete</v-icon>
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
      isDeleteCategoryActive: false,
      isDeleteSubcategoryActive: false,
      categoryToDeleteId: null,
      subcategoryToDeleteId: null,
    };
  },
  computed: {
    ...mapState('categories', { categories: 'categoriesList' }),
  },
  created() {
    this.$store.dispatch('categories/getCategories');
  },
  methods: {
    openAddSubcategory(categoryId) {
      this.$router.push({ name: 'addSubcategory', params: { categoryId } });
    },
    openDeleteCategory(categoryId) {
      this.categoryToDeleteId = categoryId;
      this.isDeleteCategoryActive = true;
    },
    openDeleteSubcategory(subcategoryId) {
      this.subcategoryToDeleteId = subcategoryId;
      this.isDeleteSubcategoryActive = true;
    },
    deleteCategory() {
      this.$store.dispatch('categories/deleteCategoryAction', this.categoryToDeleteId)
        .then(() => {
          this.isDeleteCategoryActive = false;
          this.$store.dispatch('displaySuccessSnack', 'Kategoria usunięta', {
            root: true,
          });
        })
        .catch(() => {
          this.$store.dispatch(
            'displayErrorSnack',
            'Błąd przy usuwaniu kategorii',
            { root: true },
          );
        });
    },
    deleteSubcategory() {
      this.$store.dispatch('categories/deleteSubcategoryAction', this.subcategoryToDeleteId)
        .then(() => {
          this.isDeleteSubcategoryActive = false;
          this.$store.dispatch('displaySuccessSnack', 'Podkategoria usunięta', {
            root: true,
          });
        })
        .catch(() => {
          this.$store.dispatch(
            'displayErrorSnack',
            'Błąd przy usuwaniu podkategorii',
            { root: true },
          );
        });
    },
  },
};
</script>

<style scoped>
</style>
