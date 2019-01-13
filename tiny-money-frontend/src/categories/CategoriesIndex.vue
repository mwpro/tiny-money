<template>
  <v-layout>
    <v-btn color="green" dark absolute bottom right fab @click="openAddCategory()">
      <v-icon>add</v-icon>
    </v-btn>

    <EditCategory :isOpen="isEditCategoryDialogOpen"
      :cat="categoryToEdit" @done="isEditCategoryDialogOpen = false" />
    <EditSubcategory :isOpen="isEditSubcategoryDialogOpen" :cat="categoryToEdit"
      :subcat="subcategoryToEdit" @done="isEditSubcategoryDialogOpen = false" />

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
                      <v-btn icon ripple @click="openEditSubcategory(subcategory, category)">
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
              <v-btn flat color="orange" @click="openAddSubcategory(category)">
                Dodaj podkategorię
              </v-btn>
              <v-btn flat color="orange" @click="openEditCategory(category)">Edytuj</v-btn>
              <v-btn flat color="orange" @click="deleteCategory(category)">Usuń</v-btn>
            </v-card-actions>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-layout>
</template>
<script>
import EditSubcategory from './EditSubcategory.vue';
import EditCategory from './EditCategory.vue';

export default {
  name: 'CategoriesIndex',
  components: { EditCategory, EditSubcategory },
  data() {
    return {
      isEditCategoryDialogOpen: false,
      isEditSubcategoryDialogOpen: false,
      categoryToEdit: {},
      subcategoryToEdit: {},
    };
  },
  computed: {
    categories() {
      return this.$store.state.categories.list;
    },
  },
  methods: {
    deleteSubcategory(subcategory) {
      this.$store.dispatch('categories/removeSubcategory', subcategory);
    },
    deleteCategory(category) {
      this.$store.dispatch('categories/removeCategory', category);
    },
    openAddCategory() {
      this.categoryToEdit = {};
      this.isEditCategoryDialogOpen = true;
    },
    openAddSubcategory(category) {
      this.subcategoryToEdit = {};
      this.categoryToEdit = category;
      this.isEditSubcategoryDialogOpen = true;
    },
    openEditCategory(category) {
      this.categoryToEdit = category;
      this.isEditCategoryDialogOpen = true;
    },
    openEditSubcategory(subcategory, category) {
      this.subcategoryToEdit = subcategory;
      this.categoryToEdit = category;
      this.isEditSubcategoryDialogOpen = true;
    },
  },
};
</script>

<style scoped>
</style>
