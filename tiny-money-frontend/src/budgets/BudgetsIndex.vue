<template>
  <v-container>
    <initialize-budget :is-open="isInitializeBudgetOpen" :target-month="selectedMonth" @closed="isInitializeBudgetOpen=false"></initialize-budget>
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
    <v-layout row wrap>
      <v-flex xs4>
        Budżet:<br /> {{ budgets.map(x => x.subcategories.map(x => x.amount)).flat().reduce((a, b) => a + b, 0) | toFixed(2) | currency }}
      </v-flex>
      <v-flex xs4>
        Rzeczywiste wydatki:<br /> {{ budgets.map(x => x.subcategories.map(x => x.usedAmount)).flat().reduce((a, b) => a + b, 0) | toFixed(2) | currency }}
      </v-flex>
      <v-flex xs4>
        Różnica:<br /> {{ budgets.map(x => x.subcategories.map(x => x.amount - x.usedAmount)).flat().reduce((a, b) => a + b, 0) | toFixed(2) | currency }}
      </v-flex>
    </v-layout>
    <v-layout row wrap>
      <v-flex>
        <v-data-table
          :headers="headers"
          :items="budgets"
          class="elevation-1"
          pagination.rowsPerPage="10"
        >
          <template slot="items" slot-scope="props">
            <tr>
              <th>{{ props.item.name }}</th>
              <th>{{ props.item.subcategories.map(x => x.amount).reduce((a, b) => a + b) | toFixed(2) | currency }}</th>
              <th>{{ props.item.subcategories.map(x => x.usedAmount).reduce((a, b) => a + b) | toFixed(2) | currency }}</th>
              <th :class="props.item.subcategories.map(x => x.amount - x.usedAmount).reduce((a, b) => a + b) < 0 ? 'red--text' : ''">{{ props.item.subcategories.map(x => x.amount - x.usedAmount).reduce((a, b) => a + b) | toFixed(2) | currency }}</th>
            </tr>
            <tr v-for="subcategory in props.item.subcategories" :key="subcategory.subcategoryId">
              <td class="text-xs-left">{{ subcategory.subcategoryName }}</td>
              <td class="text-xs-left">
                <v-edit-dialog @open="editBudget(subcategory)" @save="saveBudget()">
                  {{ subcategory.amount | toFixed(2) | currency }}
                  <v-text-field
                    slot="input"
                    v-model="editedBudgetAmount"
                    label="Edit"
                    type="number"
                    single-line
                    counter
                  ></v-text-field>
                </v-edit-dialog>
              </td>
              <td
                class="text-xs-left"
              >{{ subcategory.usedAmount | toFixed(2) | currency }}</td>
              <td
                class="text-xs-left"
                :class="subcategory.usedAmount > subcategory.amount ? 'red--text' : ''"
              >{{ (subcategory.amount - subcategory.usedAmount) | toFixed(2) | currency }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>

    <v-flex class="no-data">
      <v-btn color="info" @click="isInitializeBudgetOpen = !isInitializeBudgetOpen">Skopiuj</v-btn>
    </v-flex>
    <v-snackbar v-model="snack" :timeout="3000" :color="snackColor">
      {{ snackText }}
      <v-btn flat @click="snack = false">Close</v-btn>
    </v-snackbar>
  </v-container>
</template>
<script>
import InitializeBudget from './InitializeBudget.vue';

export default {
  name: 'budgets-index',
  components: { InitializeBudget },
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
      ],
      snackText: '',
      snack: false,
      snackColor: '',
      editedBudgetAmount: 0,
      editedBudgetSubcategory: null,
      isInitializeBudgetOpen: false,
    };
  },
  computed: {
    budgets() {
      return this.$store.state.budgets.budgetsList;
    },
  },
  created() {
    this.$store.dispatch('budgets/getBudgetsAction', this.selectedMonth);
  },
  methods: {
    selectMonth() {
      this.$refs.menu.save(this.selectedMonth);
      this.$store.dispatch('budgets/getBudgetsAction', this.selectedMonth);
    },
    editBudget(subcategory) {
      this.editedBudgetAmount = subcategory.amount;
      this.editedBudgetSubcategory = subcategory.subcategoryId;
    },
    saveBudget() {
      this.$store
        .dispatch('budgets/saveBudgetAction', {
          amount: Number(this.editedBudgetAmount),
          subcategoryId: this.editedBudgetSubcategory,
          year: this.selectedMonth.substr(0, 4),
          month: this.selectedMonth.substr(5, 7),
        })
        .then(() => {
          this.snackColor = 'success';
          this.snackText = 'Zapisano budżet';
          this.snack = true;
        });
    },
  },
};
</script>
<style>
.no-data {
  text-align: center;
}
</style>
