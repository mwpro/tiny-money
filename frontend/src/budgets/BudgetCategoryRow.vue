<template>
  <tr>
    <th class="text-xs-left">{{ category.name }}</th>
    <th class="text-xs-left">
      {{ budgetAmount | toFixed(2) | currency }}
    </th>
    <th class="text-xs-left">
      {{ budgetUsedAmount | toFixed(2) | currency }}
    </th>
    <th class="text-xs-left" :class="budgetLeft < 0 ? 'red--text' : ''">
      {{ budgetLeft | toFixed(2) | currency }}
    </th>
    <th></th>
  </tr>
</template>

<script>
export default {
  computed: {
    budgets() {
      return this.$store.state.budgets.budgetsList;
    },
    budgetAmount() {
      return this.category.subcategories
        .map(x => this.budgets.find(b => b.subcategoryId === x.id).amount)
        .reduce((a, b) => a + b);
    },
    budgetUsedAmount() {
      return this.category.subcategories
        .map(x => this.budgets.find(b => b.subcategoryId === x.id).usedAmount)
        .reduce((a, b) => a + b);
    },
    budgetLeft() {
      return this.budgetAmount - this.budgetUsedAmount;
    },
  },
  props: {
    category: Object,
  },
};
</script>

<style>
</style>
