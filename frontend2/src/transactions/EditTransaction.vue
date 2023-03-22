<template>
  TODO edycja transakcji
</template>

<script>
export default {
  data() {
    return {};
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    editedTransactionId: {
      type: Number,
      required: false,
    },
  },
};
</script>

<style>
</style>
