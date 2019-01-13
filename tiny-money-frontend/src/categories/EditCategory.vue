<template>
  <v-dialog v-model="isOpen" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="headline">
          {{ isEditing ? `Edytuj kategorię` : "Dodaj kategorię" }}
        </span>
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
  </v-dialog>
</template>

<script>
export default {
  name: 'EditCategory',
  data() {
    return {
      category: this.cat,
      isEditing: false,
    };
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    cat: {
      type: Object,
    },
  },
  watch: {
    cat() {
      if (this.cat && this.cat.id) {
        this.category = this.cat;
        this.isEditing = true;
      } else {
        this.category = { name: '', subcategories: [] };
        this.isEditing = false;
      }
    },
  },
  methods: {
    save() {
      this.$store.dispatch('categories/saveCategory', this.category);
      this.close();
    },
    close() {
      this.$emit('done');
      this.isDialogVisible = false;
    },
  },
};
</script>

<style>
</style>
