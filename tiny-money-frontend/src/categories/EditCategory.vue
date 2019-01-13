<template>
  <div>
    <input v-model="category.name">
    <button @click="save">Zapisz</button>
  </div>
</template>

<script>
export default {
  name: 'EditCategory',
  props: {
    category: {
      type: Object,
      required: false,
      default() {
        return {
          name: '',
          subcategories: [],
        };
      },
    },
  },
  methods: {
    save() {
      this.$store.dispatch('categories/saveCategory', this.category);
    },
  },
};
</script>

<style>
</style>
