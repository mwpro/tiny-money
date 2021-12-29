<template>
  <v-container>
    <edit-transaction :isOpen="isEditTransactionActive" :editedTransactionId="editedTransactionId"
                      @closed="onClosedEditTransaction"/>
    <v-dialog v-model="isDeleteTransactionActive" persistent max-width="400">
      <v-card>
        <v-card-title class="headline">Czy na pewno chcesz usunąć transakcję?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat @click="isDeleteTransactionActive = false">Nie</v-btn>
          <v-btn color="green darken-1" flat @click="deleteTransaction()">Tak</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
              <td class="text-xs-left">
                <subcategory :subcategory-id="props.item.subcategoryId" />
              </td>
              <td class="text-xs-left">
                <vendor :vendor-id="props.item.vendorId" />
              </td>
              <td
                class="text-xs-left"
                :class="props.item.isExpense ? 'red--text' : 'green--text'"
              >{{ props.item.amount | toFixed(2) | currency }}
              </td>
              <td class="text-xs-left">
                <v-icon v-if="props.item.description">notes</v-icon>
                <v-icon v-if="props.item.tagIds.length">#</v-icon>
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
                <span v-if="!props.item.tagIds.length">brak</span>
                <tag v-for="tagId in props.item.tagIds" :key="tagId" :tag-id="tagId" />
                <br>
                Opis:
                <span v-if="!props.item.description">brak</span>
                {{ props.item.description }}
                <br/>
                Dodana przez: {{ props.item.createdBy }}
                <br>
                <v-btn @click="openEditTransaction(props.item.id)">
                  <v-icon>edit</v-icon>
                </v-btn>
                <v-btn @click="openDeleteTransaction(props.item.id)">
                  <v-icon>delete</v-icon>
                </v-btn>
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
  import {mapGetters, mapState} from "vuex";
  import Tag from "../tags/Tag";
  import Vendor from "../vendors/Vendor";
  import Subcategory from "../categories/Subcategory";

  export default {
    components: {Subcategory, Vendor, Tag, EditTransaction},
    data() {
      return {
        searchOptions: {
          month: new Date().toISOString().substr(0, 7)
        },
        isEditTransactionActive: false,
        isDeleteTransactionActive: false,
        editedTransactionId: null,
        transactionToDeleteId: null,
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
          {text: 'Sprzedawca', value: 'vendor', sortable: false},
          // { text: 'Tagi', value: 'fat', sortable: false },
          {text: 'Kwota', value: 'amount', sortable: false},
          {text: '', value: '', sortable: false},
        ],
      };
    },
    computed: {
      transactions() {
        return this.$store.state.transactions.transactionsList;
      },
      ...mapGetters('tags', { tags: 'tags' }),
      ...mapGetters('vendors', { vendors: 'vendors' }),
      ...mapGetters('categories', {categories: 'subcategories'}),
    },
    created() {
      this.searchOptions.month = `${this.$route.params.year}-${this.$route.params.month}-01`;
      this.search();
    },
    watch: {
      $route(to, from) {
        this.searchOptions.month = `${to.params.year}-${to.params.month}-01`,
          this.$refs.menu.save(this.searchOptions.month);
        this.search();
      }
    },
    methods: {
      openAddTransaction() {
        this.editedTransactionId = null;
        this.isEditTransactionActive = true;
      },
      onClosedEditTransaction() {
        this.editedTransactionId = null;
        this.isEditTransactionActive=false;
      },
      openEditTransaction(id) {
        this.editedTransactionId = id;
        this.isEditTransactionActive = true;
      },
      openDeleteTransaction(id) {
        this.transactionToDeleteId = id;
        this.isDeleteTransactionActive = true;
      },
      deleteTransaction() {
        this.$store.dispatch('transactions/deleteTransactionAction', this.transactionToDeleteId)
          .then(() => {
            this.isDeleteTransactionActive = false;
            this.$store.dispatch('displaySuccessSnack', 'Transakcja usunięta', {
              root: true,
            });
          })
          .catch(() => {
            this.$store.dispatch(
              'displayErrorSnack',
              'Błąd przy usuwaniu transakcji',
              {root: true},
            );
          });
      },
      selectMonth() {
        let year = this.searchOptions.month.substring(0, 4);
        let month = this.searchOptions.month.substring(5, 7);
        this.$router.push({name: 'transactions', params: {year: year, month: month}})
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
