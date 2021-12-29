<template>
  <span v-if="subcategory">{{ subcategory.fullName }}</span>
</template>

<script>
  export default {
    name: "Subcategory",
    props: {
      subcategoryId: {
        type: Number,
        required: true,
      },
    },
    computed: {
      subcategory() {
        return this.$store.getters["categories/subcategories"].find(subcategory => subcategory.id === this.subcategoryId)
      }
    }
  }
</script>

<style scoped>

</style>
