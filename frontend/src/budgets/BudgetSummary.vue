<template>
  <v-layout row wrap>
      <v-flex xs4
        >Budżet:
        <br />
        {{ budgetAmount | toFixed(2) | currency }}
      </v-flex>
      <v-flex xs4
        >Rzeczywiste wydatki:
        <br />
        {{ budgetUsedAmount | toFixed(2) | currency }}
      </v-flex>
      <v-flex xs4
        >Różnica:
        <br />
        {{ budgetLeft  | toFixed(2) | currency }}
      </v-flex>
    </v-layout>
</template>

<script>
export default {
  computed: {
    budgetAmount() {
      return this.budgets.map(x => x.amount).flat().reduce((a, b) => a + b, 0);
    },
    budgetUsedAmount() {
      return this.budgets.map(x => x.usedAmount).flat().reduce((a, b) => a + b, 0);
    },
    budgetLeft() {
      return this.budgetAmount - this.budgetUsedAmount;
    },
  },
  props: {
    budgets: Array,
  },
};
</script>

<style>

</style>
