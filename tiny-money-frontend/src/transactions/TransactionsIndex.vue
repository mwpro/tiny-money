<template>
  <v-container>
    <edit-transaction :isOpen="isEditTransactionActive" @closed="isEditTransactionActive=false"/>
    <v-btn color="green" fab bottom right dark fixed @click="openAddTransaction()">
      <v-icon>add</v-icon>
    </v-btn>
    <v-layout row wrap>
      <v-flex xs11 sm5>
        <v-menu
          ref="menu"
          :close-on-content-click="false"
          :nudge-right="40"
          :return-value.sync="searchOptions.month"
          lazy
          transition="scale-transition"
          offset-y
          full-width
          max-width="290px"
          min-width="290px"
        >
          <v-text-field
            slot="activator"
            v-model="searchOptions.month"
            label="Okres transakcji"
            prepend-icon="event"
            readonly
          ></v-text-field>
          <v-date-picker
            v-model="searchOptions.month"
            type="month"
            no-title
            scrollable
            @input="selectMonth()"
          >
            <v-spacer></v-spacer>
          </v-date-picker>
        </v-menu>
      </v-flex>
      <v-flex xs11 sm5>
        <v-switch
          prepend-icon="person"
          label="Tylko moje transakcje"
          v-model="searchOptions.myTransactionsOnly"
          @change="search()"
        ></v-switch>
      </v-flex>
      <v-spacer></v-spacer>
    </v-layout>
    <v-layout row wrap>
      <v-flex>
        <v-data-table
          :headers="headers"
          :items="transactions"
          class="elevation-1"
          :hide-actions="true"
        >
          <template slot="items" slot-scope="props">
            <tr @click="props.expanded = !props.expanded">
              <td class="text-xs-left">{{ props.item.transactionDate | date }}</td>
              <td
                class="text-xs-left"
              >{{ props.item.subcategory.parentCategory.name }} / {{ props.item.subcategory.name }}</td>
              <td
                class="text-xs-left"
                :class="props.item.isExpense ? 'red--text' : 'green--text'"
              >{{ props.item.amount | toFixed(2) | currency }}</td>
              <td class="text-xs-left">
                <v-icon v-if="props.item.tags.length">#</v-icon>
              </td>
            </tr>
          </template>
          <template slot="expand" slot-scope="props">
            <v-card flat>
              <v-card-text>
                Data dodania: {{ props.item.createdDate | date }}
                <br>
                Data aktualizacji: {{ props.item.modifiedDate | date }}
                <br>Tagi:
                <span v-if="!props.item.tags.length">brak</span>
                <v-chip
                  v-for="tag in props.item.tags"
                  :key="tag.id"
                  color="primary"
                  small
                  text-color="white"
                >{{ tag.name }}</v-chip>
                <br>
                Dodana przez: {{ props.item.createdBy }}
                <br>
              </v-card-text>
            </v-card>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import EditTransaction from './EditTransaction.vue';

export default {
  components: { EditTransaction },
  data() {
    return {
      searchOptions: {
        month: new Date().toISOString().substr(0, 7),
        myTransactionsOnly: false,
      },
      isEditTransactionActive: false,
      headers: [
        {
          text: 'Data',
          sortable: false,
          value: 'date',
        },
        {
          text: 'Kategoria',
          sortable: false,
          value: 'category',
        },
        // { text: 'Sprzedawca', value: 'calories', sortable: false },
        // { text: 'Tagi', value: 'fat', sortable: false },
        { text: 'Kwota', value: 'amount', sortable: false },
        { text: '', value: '', sortable: false },
      ],
    };
  },
  computed: {
    transactions() {
      return this.$store.state.transactions.transactionsList;
    },
  },
  created() {
    this.searchOptions.month = `${this.searchOptions.month}-01`;
    this.search();
  },
  methods: {
    openAddTransaction() {
      this.isEditTransactionActive = true;
    },
    selectMonth() {
      // TODO appending '-01' does not seem to be the best practice :)
      this.searchOptions.month = `${this.searchOptions.month}-01`;
      this.$refs.menu.save(this.searchOptions.month);
      this.search();
    },
    search() {
      this.$store.dispatch(
        'transactions/getTransactionsAction',
        this.searchOptions,
      );
    },
  },
};
</script>
