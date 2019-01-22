<template>
<v-container>
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
    <v-flex xs11 sm5>
      Podsumowanie:<br />
      Budżet: {{ budgets.map(x => x.subcategories.map(x => x.amount)).flat().reduce((a, b) => a + b, 0) | toFixed(2) | currency }}<br />
      Rzeczywiste wydatki: {{ budgets.map(x => x.subcategories.map(x => x.usedAmount)).flat().reduce((a, b) => a + b, 0) | toFixed(2) | currency }}<br />
      Różnica: {{ budgets.map(x => x.subcategories.map(x => x.amount - x.usedAmount)).flat().reduce((a, b) => a + b, 0) | toFixed(2) | currency }}<br />
    </v-flex>
  </v-layout>
  <v-layout row wrap>
    <v-flex>
      <v-data-table :headers="headers" :items="budgets" class="elevation-1" pagination.rowsPerPage="10">
        <template slot="no-data">
          <v-flex class="no-data">
            <v-btn color="info">Utwórz</v-btn>
          </v-flex>
        </template>
        <template slot="items" slot-scope="props">
          <tr>
            <th>
              {{ props.item.name }}
            </th>
            <th>
              {{ props.item.subcategories.map(x => x.amount).reduce((a, b) => a + b) | toFixed(2) | currency }}
            </th>
            <th>
              {{ props.item.subcategories.map(x => x.usedAmount).reduce((a, b) => a + b) | toFixed(2) | currency }}
            </th>
            <th>
              {{ props.item.subcategories.map(x => x.amount - x.usedAmount).reduce((a, b) => a + b) | toFixed(2) | currency }}
            </th>
          </tr>
          <tr v-for="subcategory in props.item.subcategories" :key="subcategory.subcategoryId">
            <td
              class="text-xs-left"
            >{{ subcategory.subcategoryName }}</td>
            <td
              class="text-xs-left"
            >{{ subcategory.amount | toFixed(2) | currency }}</td>
            <td
              class="text-xs-left"
              :class="subcategory.usedAmount > subcategory.amount ? 'red--text' : 'green--text'"
            >{{ subcategory.usedAmount | toFixed(2) | currency }}</td>
            <td
              class="text-xs-left"
              :class="subcategory.usedAmount > subcategory.amount ? 'red--text' : 'green--text'"
            >{{ (subcategory.amount - subcategory.usedAmount) | toFixed(2) | currency }}</td>
          </tr>
        </template>
      </v-data-table>
    </v-flex>
  </v-layout>
</v-container>

</template>
<script>
export default {
  data() {
    return {
      selectedMonth: new Date().toISOString().substr(0, 7),
      headers: [
        {
          text: 'Kategoria',
          sortable: false,
          value: 'category',
        },
        // { text: 'Sprzedawca', value: 'calories', sortable: false },
        // { text: 'Tagi', value: 'fat', sortable: false },
        { text: 'Plan', value: 'amount', sortable: false },
        { text: 'Realizacja', value: 'amount', sortable: false },
        { text: 'Różnica', value: 'amount', sortable: false },
      ],
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
  },
};
</script>
<style>
.no-data {
  text-align: center;
}
</style>
