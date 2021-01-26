<template>
    <tr>
      <td class="text-xs-left">{{ subcategory.name }}</td>
      <td class="text-xs-left">
        <v-edit-dialog @open="editBudget(subcategory)" @save="saveBudget()">
          {{ budgetAmount | toFixed(2) | currency }}
          <v-text-field
            slot="input"
            v-model="editedBudgetAmount"
            label="Ustaw budżet"
            type="number"
            single-line
            counter
          ></v-text-field>
        </v-edit-dialog>
      </td>
      <td class="text-xs-left">
        {{ budgetUsedAmount | toFixed(2) | currency }}
      </td>
      <td
        class="text-xs-left"
        :class="budgetLeft < 0 ? 'red--text' : ''"
      >
        {{ budgetLeft | toFixed(2) | currency }}
      </td>
      <td class="text-xs-left">
        <v-edit-dialog @open="editBudget(subcategory)" @save="saveBudget()">
          {{ budget.notes }}
          <v-text-field
            slot="input"
            v-model="editedBudgetNotes"
            label="Dodaj notatkę"
            type="text"
            single-line
          ></v-text-field>
        </v-edit-dialog>
      </td>
    </tr>
</template>

<script>
export default {
  data() {
    return {
      editedBudgetAmount: 0,
      editedBudgetNotes: null,
      editedBudgetSubcategory: null,
    };
  },
  computed: {
    budget() {
      return this.$store.state.budgets.budgetsList.find(b => b.subcategoryId === this.subcategory.id);
    },
    budgetAmount() {
      return this.budget.amount;
    },
    budgetUsedAmount() {
      return this.budget.usedAmount;
    },
    budgetLeft() {
      return this.budgetAmount - this.budgetUsedAmount;
    },
  },
  props: {
    subcategory: Object,
    selectedMonth: String,
  },
  methods: {
    editBudget(subcategory) {
      this.editedBudgetAmount = this.budget.amount;
      this.editedBudgetNotes = this.budget.notes;
      this.editedBudgetSubcategory = subcategory.id;
    },
    saveBudget() {
      this.$store
        .dispatch('budgets/saveBudgetAction', {
          amount: Number(this.editedBudgetAmount),
          subcategoryId: this.editedBudgetSubcategory,
          year: this.selectedMonth.substr(0, 4),
          month: this.selectedMonth.substr(5, 7),
          notes: this.editedBudgetNotes,
        })
        .then(() => {
          this.$store.dispatch('displaySuccessSnack', 'Budżet zapisany', {
            root: true,
          });
        })
        .catch(() => {
          this.$store.dispatch('displayErrorSnack', 'Błąd zapisu budżetu', {
            root: true,
          });
        });
    },
  },
};
</script>

<style>
</style>
