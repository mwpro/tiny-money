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
    <v-layout row wrap v-if="loaded">
      <v-flex xs4
        >Budżet:
        <br />
        {{
          budgets
            .map((x) => x.amount)
            .flat()
            .reduce((a, b) => a + b, 0)
            | toFixed(2)
            | currency
        }}
      </v-flex>
      <v-flex xs4
        >Rzeczywiste wydatki:
        <br />
        {{
          budgets
            .map((x) => x.usedAmount)
            .flat()
            .reduce((a, b) => a + b, 0)
            | toFixed(2)
            | currency
        }}
      </v-flex>
      <v-flex xs4
        >Różnica:
        <br />
        {{
          budgets
            .map((x) => x.amount - x.usedAmount)
            .flat()
            .reduce((a, b) => a + b, 0)
            | toFixed(2)
            | currency
        }}
      </v-flex>
    </v-layout>
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
            <tr>
              <th class="text-xs-left">{{ props.item.name }}</th>
              <th class="text-xs-left">
                {{
                  props.item.subcategories
                    .map(
                      (x) => budgets.find((b) => b.subcategoryId == x.id).amount
                    )
                    .reduce((a, b) => a + b)
                    | toFixed(2)
                    | currency
                }}
              </th>
              <th class="text-xs-left">
                {{
                  props.item.subcategories
                    .map(
                      (x) =>
                        budgets.find((b) => b.subcategoryId === x.id).usedAmount
                    )
                    .reduce((a, b) => a + b)
                    | toFixed(2)
                    | currency
                }}
              </th>
              <th
                class="text-xs-left"
                :class="props.item.subcategories.map((x) => budgets.find((b) => b.subcategoryId === x.id).amount - budgets.find((b) => b.subcategoryId == x.id).usedAmount).reduce((a, b) => a + b) < 0
                  ? 'red--text' : ''"
              >
                {{
                  props.item.subcategories
                    .map(
                      (x) =>
                        budgets.find((b) => b.subcategoryId === x.id).amount -
                        budgets.find((b) => b.subcategoryId == x.id).usedAmount
                    )
                    .reduce((a, b) => a + b)
                    | toFixed(2)
                    | currency
                }}
              </th>
              <th></th>
            </tr>
            <tr
              v-for="subcategory in props.item.subcategories"
              :key="subcategory.id"
            >
              <td class="text-xs-left">{{ subcategory.name }}</td>
              <td class="text-xs-left">
                <v-edit-dialog
                  @open="editBudget(subcategory)"
                  @save="saveBudget()"
                >
                  {{
                    budgets.find((b) => b.subcategoryId == subcategory.id)
                      .amount
                      | toFixed(2)
                      | currency
                  }}
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
                {{
                  budgets.find((b) => b.subcategoryId == subcategory.id)
                    .usedAmount
                    | toFixed(2)
                    | currency
                }}
              </td>
              <td
                class="text-xs-left"
                :class="budgets.find((b) => b.subcategoryId == subcategory.id).usedAmount > budgets.find((b) => b.subcategoryId == subcategory.id).amount
                    ? 'red--text' : ''"
              >
                {{
                  (budgets.find((b) => b.subcategoryId == subcategory.id)
                    .amount -
                    budgets.find((b) => b.subcategoryId == subcategory.id)
                      .usedAmount)
                    | toFixed(2)
                    | currency
                }}
              </td>
              <td class="text-xs-left">
                <v-edit-dialog
                  @open="editBudget(subcategory)"
                  @save="saveBudget()"
                >
                  {{
                    budgets.find((b) => b.subcategoryId == subcategory.id).notes
                  }}
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
        { text: 'Notatki', value: 'notes', sortable: false },
      ],
      editedBudgetAmount: 0,
      editedBudgetNotes: null,
      editedBudgetSubcategory: null,
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
    editBudget(subcategory) {
      this.editedBudgetAmount = this.budgets.find(
        b => b.subcategoryId === subcategory.id,
      ).amount;
      this.editedBudgetNotes = this.budgets.find(
        b => b.subcategoryId === subcategory.id,
      ).notes;
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
.no-data {
  text-align: center;
}
</style>
