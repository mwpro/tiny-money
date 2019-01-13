<template>
  <div>
    <h1>Categories list...</h1>
    <EditCategory></EditCategory>
    <ul>
      <li v-for="(category, categoryIndex) in categories" :key="categoryIndex">
        {{ category.name }}
        <EditCategory :category="category"></EditCategory>
        <button @click="deleteCategory(category)">Delete</button>
        <EditSubcategory :category="category"></EditSubcategory>
        <br />
        <ul>
          <li v-for="(subcategory, subcategoryIndex) in category.subcategories"
            :key="subcategoryIndex">
            {{ subcategory.name }}<br/>
            <EditSubcategory :category="category" :subcategory="subcategory"></EditSubcategory>
            <button @click="deleteSubcategory(subcategory)">Delete</button>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
<script>
import EditSubcategory from './EditSubcategory.vue';
import EditCategory from './EditCategory.vue';

export default {
  name: 'CategoriesIndex',
  components: { EditSubcategory, EditCategory },
  data() {
    return {
      newCategoryName: null,
    };
  },
  computed: {
    categories() {
      return this.$store.state.categories.list;
    },
  },
  methods: {
    saveCategory() {
      this.$store.dispatch('categories/addCategory', this.newCategoryName);
    },
    deleteSubcategory(subcategory) {
      this.$store.dispatch('categories/removeSubcategory', subcategory);
    },
    deleteCategory(category) {
      this.$store.dispatch('categories/removeCategory', category);
    },
  },
};
</script>
