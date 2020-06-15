<template>
  <span v-if="vendor">{{ vendor.name }}</span>
</template>

<script>
  export default {
    name: "Vendor",
    props: {
      vendorId: {
        type: Number,
        required: true,
      },
    },
    computed: {
      vendor() {
        return this.$store.state.vendors.vendorsList.find(vendor => vendor.id === this.vendorId)
      }
    }
  }
</script>

<style scoped>

</style>
