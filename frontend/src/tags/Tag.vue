<template>
  <v-chip color="primary" small text-color="white" v-if="tag">
    {{ tag.name }}
  </v-chip>
</template>

<script>
  export default {
    name: "Tag",
    props: {
      tagId: {
        type: Number,
        required: true,
      },
    },
    computed: {
      tag () {
        return this.$store.state.tags.tagsList.find(todo => todo.id === this.tagId)
      }
    }
  }
</script>

<style scoped>

</style>
