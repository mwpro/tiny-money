<template>
  <v-dialog v-model="isOpen" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="headline">
          {{ subcategory.id ? `Edytuj podkategorię` : "Dodaj podkategorię" }}
        </span>
      </v-card-title>
      <v-card-text>
        <v-container grid-list-md>
          <v-layout wrap>
            <v-flex xs12>
              <v-text-field label="Nazwa*" v-model="subcategory.name" required></v-text-field>
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
  name: 'EditSubcategory',
  data() {
    return {
      category: this.cat,
      subcategory: this.subcat,
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
    subcat: {
      type: Object,
    },
  },
  watch: {
    subcat() {
      if (this.subcat && this.subcat.id) {
        this.category = this.cat;
        this.subcategory = this.subcat;
        this.isEditing = true;
      } else {
        this.category = this.cat;
        this.subcategory = { name: '', parentCategoryId: this.cat.id };
        this.isEditing = false;
      }
    },
  },
  methods: {
    save() {
      this.$store.dispatch('categories/saveSubcategory', this.subcategory);
      this.close();
    },
    close() {
      this.isDialogVisible = false;
      this.$emit('done');
    },
  },
};
</script>

<style>
</style>
