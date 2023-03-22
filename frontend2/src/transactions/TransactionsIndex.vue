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
    <v-data-table
        :items-per-page="transactions.length"
        :expanded="expanded"
        :headers="headers"
        :items="transactions"
        show-expand
        class="elevation-1"
    >
      <template v-slot:item.amount="{ item }">
        <span :class="item.raw.isExpense ? 'text-red' : 'text-green'">
          {{ $filters.currency($filters.toFixed(item.raw.amount, 2)) }}
        </span>        
      </template>
      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-card flat>
              <v-card-text>
                Data dodania: {{ $filters.date(item.raw.createdDate) }}
                <br>
                Data aktualizacji: {{ $filters.date(item.raw.modifiedDate) }}
                <br>Tagi:
                <span v-if="!item.raw.tagIds.length">brak</span>
<!--                <tag v-for="tagId in item.raw.tagIds" :key="tagId" :tag-id="tagId" />-->
                <br>
                Opis:
                <span v-if="!item.raw.description">brak</span>
                {{ item.raw.description }}
                <br/>
                Dodana przez: {{ item.raw.createdBy }}
                <br>
                <v-btn @click="openEditTransaction(item.raw.id)">
                  <v-icon>edit</v-icon>
                </v-btn>
                <v-btn @click="openDeleteTransaction(item.raw.id)">
                  <v-icon>delete</v-icon>
                </v-btn>
              </v-card-text>
            </v-card>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>
<script>
  import EditTransaction from './EditTransaction.vue';
  import {mapGetters, mapState} from "vuex";
  import Tag from "../tags/Tag.vue";
  import Vendor from "../vendors/Vendor.vue";
  import Subcategory from "../categories/Subcategory.vue";

  export default {
    components: {Subcategory, Vendor, Tag, EditTransaction},
    data() {
      return {
        searchOptions: {
          month: new Date().toISOString().substr(0, 7)
        },
        expanded: [],
        isEditTransactionActive: false,
        isDeleteTransactionActive: false,
        editedTransactionId: null,
        transactionToDeleteId: null,
        headers: [
          {
            title: 'Data',
            sortable: false,
            key: 'transactionDate',
          },
          {
            title: 'Kategoria',
            sortable: false,
            value: 'subcategoryId',
          },
          {title: 'Sprzedawca', value: 'vendorId', sortable: false},
          // { text: 'Tagi', value: 'fat', sortable: false },
          {key: 'amount', title: 'Kwota', value: 'amount', sortable: false},
          {title: '', value: '', sortable: false},
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
