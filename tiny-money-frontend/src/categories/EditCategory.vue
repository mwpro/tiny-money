<template>
  <v-card>
    <v-card-title>
      <span class="headline">{{ isEditing ? `Edytuj kategorię` : "Dodaj kategorię" }}</span>
    </v-card-title>
    <v-card-text>
      <v-container grid-list-md>
        <v-layout wrap>
          <v-flex xs12>
            <v-text-field label="Nazwa*" v-model="category.name" required></v-text-field>
          </v-flex>
        </v-layout>
      </v-container>
      <small>*indicates required field</small>
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
  name: 'EditCategory',
  data() {
    return {
      category: { },
      isEditing: false,
    };
  },
  props: {
    categoryId: {
      // TODO type: Number,
      required: false,
    },
  },
  created() {
    this.getCategory();
  },
  methods: {
    getCategory() {
      if (this.categoryId) {
        this.category = { ...this.$store.state.categories.list.filter(c => c.id == this.categoryId)[0] };
      } else {
        this.category = { name: '', subcategories: [] };
      }
    },
    save() {
      this.$store.dispatch('categories/saveCategory', this.category);
      this.close();
    },
    close() {
      this.$router.push({ name: 'categories' });
    },
  },
};
</script>

<style>
</style>
