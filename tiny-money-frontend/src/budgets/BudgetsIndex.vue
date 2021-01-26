<template>
  <v-container>
    <initialize-budget
      :is-open="isInitializeBudgetOpen"
      :target-month="selectedMonth"
      @closed="isInitializeBudgetOpen = false"
    ></initialize-budget>
    <v-layout row wrap>
      <v-flex xs11 sm5>
        <v-menu
          ref="menu"
          :close-on-content-click="false"
          :nudge-right="40"
          :return-value.sync="selectedMonth"
          lazy
          transition="scale-transition"
          offset-y
          full-width
          max-width="290px"
          min-width="290px"
        >
          <v-text-field
            slot="activator"
            v-model="selectedMonth"
            label="Okres transakcji"
            prepend-icon="event"
            readonly
          ></v-text-field>
          <v-date-picker
            v-model="selectedMonth"
            type="month"
            no-title
            scrollable
            @input="selectMonth()"
          >
            <v-spacer></v-spacer>
          </v-date-picker>
        </v-menu>
      </v-flex>
      <v-spacer></v-spacer>
    </v-layout>
    <budget-summary v-if="loaded" :budgets="budgets" />
    <v-layout row wrap v-if="loaded">
      <v-flex>
        <v-data-table
          :loading="!loaded"
          :headers="headers"
          :items="categories"
          :hide-actions="true"
          class="elevation-1"
          pagination.rowsPerPage="10"
        >
          <template slot="items" slot-scope="props">
            <budget-category-row :category="props.item" />
            <budget-subcategory-row v-for="subcategory in props.item.subcategories" :subcategory="subcategory" :selectedMonth="selectedMonth" :key="subcategory.id" />
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
    <v-flex class="no-data">
      <v-btn
        color="info"
        @click="isInitializeBudgetOpen = !isInitializeBudgetOpen"
        >Skopiuj</v-btn
      >
    </v-flex>
  </v-container>
</template>
<script>
import { mapState } from 'vuex';
import BudgetCategoryRow from './BudgetCategoryRow.vue';
import BudgetSubcategoryRow from './BudgetSubcategoryRow.vue';
import BudgetSummary from './BudgetSummary.vue';
import InitializeBudget from './InitializeBudget.vue';

export default {
  name: 'budgets-index',
  components: {
    InitializeBudget, BudgetCategoryRow, BudgetSubcategoryRow, BudgetSummary,
  },
  data() {
    return {
      selectedMonth: new Date().toISOString().substr(0, 7),
      headers: [
        {
          text: 'Kategoria',
          sortable: false,
          value: 'category',
        },
        { text: 'Plan', value: 'amount', sortable: false },
        { text: 'Realizacja', value: 'amount', sortable: false },
        { text: 'Różnica', value: 'amount', sortable: false },
        { text: 'Notatki', value: 'notes', sortable: false },
      ],
      isInitializeBudgetOpen: false,
    };
  },
  computed: {
    loaded() {
      return this.budgets && this.categories;
    },
    budgets() {
      return this.$store.state.budgets.budgetsList;
    },
    ...mapState('categories', { categories: 'categoriesList' }),
  },
  created() {
    this.$store
      .dispatch('budgets/getBudgetsAction', this.selectedMonth)
      .catch(() => {
        this.$store.dispatch('displayErrorSnack', 'Błąd ładowania budżetu', {
          root: true,
        });
      });
    this.$store.dispatch('categories/getCategories').catch(() => {
      this.$store.dispatch('displayErrorSnack', 'Błąd ładowania kategorii', {
        root: true,
      });
    });
  },
  methods: {
    selectMonth() {
      this.$refs.menu.save(this.selectedMonth);
      this.$store.dispatch('budgets/getBudgetsAction', this.selectedMonth);
    },
  },
};
</script>
<style>
.no-data {
  text-align: center;
}
</style>
