<template>
  <v-card>
    <v-card-title>
      <span class="headline">{{ subcategory.id ? `Edytuj podkategorię` : "Dodaj podkategorię" }}</span>
    </v-card-title>
    <v-card-text>
      <v-container grid-list-md>
        <v-layout wrap>
          <v-flex xs12>
            <v-text-field label="Nazwa*" v-model="subcategory.name" required></v-text-field>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="blue darken-1" flat @click="close()">Zamknij</v-btn>
      <v-btn color="blue darken-1" flat @click="save()">Zapisz</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'EditSubcategory',
  data() {
    return {
      category: this.cat,
      subcategory: this.subcat,
      isEditing: false,
    };
  },
  props: {
    categoryId: {
      // TODO type: Number,
      required: true,
    },
    subcategoryId: {
      // TODO type: Number,
      required: false,
    },
  },
  created() {
    this.getCategory();
    this.getSubategory();
  },
  methods: {
    getCategory() {
      this.category = {
        ...this.$store.state.categories.categoriesList.filter(c => c.id == this.categoryId)[0],
      };
    },
    getSubategory() {
      if (this.subcategoryId) {
        this.subcategory = {
          ...this.$store.state.categories.categoriesList
            .filter(c => c.id == this.categoryId)[0].subcategories
            .filter(s => s.id == this.subcategoryId)[0],
        };
      } else {
        this.subcategory = { name: '', parentCategoryId: this.category.id };
      }
    },
    save() {
      this.$store.dispatch('categories/saveSubcategory', this.subcategory)
        .then(() => {
          this.$store.dispatch('displaySuccessSnack', 'Podkategoria dodana', {
            root: true,
          });
          this.close();
        })
        .catch(() => {
          this.$store.dispatch(
            'displayErrorSnack',
            'Błąd przy dodawaniu podkategorii',
            { root: true },
          );
          this.close();
        });
    },
    close() {
      this.$router.push({ name: 'categories' });
    },
  },
};
</script>

<style>
</style>
