<template>
    <div>
        Parent: <input v-model="subcategory.parentCategoryId"><br />
        Name: <input v-model="subcategory.name"><br />
        <button @click="save">Save</button>
    </div>
</template>

<script>
export default {
  name: 'EditSubcategory',
  data() {
    return {
    };
  },
  props: {
    category: {
      type: Object,
      required: true,
    },
    subcategory: {
      type: Object,
      required: false,
      default() {
        return {
          name: '',
          parentCategoryId: this.category.id,
        };
      },
    },
  },
  methods: {
    save() {
      this.$store.dispatch('categories/saveSubcategory', this.subcategory);
    },
  },
};
</script>

<style>

</style>
