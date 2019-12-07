<template>
  <tr>
    <td class="text-xs-left">{{ bufferedTransaction.transactionDate | date }}</td>
    <td
      class="text-xs-left"
      :class="bufferedTransaction.amount > 0 ? 'red--text' : 'green--text'"
    >{{ bufferedTransaction.amount | toFixed(2) | currency }}</td>
    <td class="text-xs-left">{{ bufferedTransaction.rawBankStatementDescription }}</td>
    <td class="text-xs-left">
      <v-combobox
                  v-model="vendor"
                  :items="vendors"
                  :search-input.sync="vendorSearch"
                  :rules="vendorRules"
                  hide-selected
                  label="Sprzedawca*"
                  item-text="name"
                  required
                >
                </v-combobox>
    </td>
    <td class="text-xs-left">
        <v-autocomplete
            v-model="subcategoryId"
            :items="subcategories"
            :rules="categoryRules"
            item-text="fullName"
            item-value="id"
            label="Kategoria*"
            persistent-hint
        >
            <v-slide-x-reverse-transition slot="append-outer" mode="out-in">
            <v-icon
                :color="isEditing ? 'success' : 'info'"
                :key="`icon-${isEditing}`"
                @click="isEditing = !isEditing"
                v-text="isEditing ? 'mdi-check-outline' : 'mdi-circle-edit-outline'"
            ></v-icon>
            </v-slide-x-reverse-transition>
        </v-autocomplete>
    </td>
    <td class="text-xs-left">
      <!-- {{ props.item.vendor.name }} -->
    </td>
    <td class="text-xs-left">
      <v-icon @click="openEditTransaction(bufferedTransaction.id)">check</v-icon>
      <v-icon @click="openRejectTransaction(bufferedTransaction.id)">close</v-icon>
    </td>
    <v-dialog v-model="isRejectTransactionActive" persistent max-width="600"><!-- TODO move to other component -->
      <v-card>
        <v-card-title class="headline">Czy na pewno chcesz odrzucić transakcję?</v-card-title>
        <v-card-text>
            Kwota: {{ bufferedTransaction.amount | currency }}<br />
            {{ bufferedTransaction.rawBankStatementDescription }}            
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat @click="isRejectTransactionActive = false">Nie</v-btn>
          <v-btn color="green darken-1" flat @click="rejectTransaction()">Tak</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </tr>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  data() {
      return {
        isRejectTransactionActive: false,
        subcategoryId: null,
        //isExpense: true,
        //amount: null,
        vendor: null,
        //description: null,
        //tags: [],
        isEditing: false, // todo remove
        vendorRules: [
            v => !!v || 'Sprzedawca jest wymagany',
        ],
        categoryRules: [
            v => !!v || 'Kategoria jest wymagana',
        ],
        vendorSearch: null,
      }
  },
  props: {
    bufferedTransaction: Object
  },
  watch: {
    'vendor': function () {
      if (this.vendor && this.vendor.defaultSubcategory) {
        this.subcategoryId = this.vendor.defaultSubcategory.id;
      }
    },
  },
  computed: {      
    ...mapGetters('categories', { subcategories: 'subcategories' }),
    ...mapGetters('tags', { tags: 'tags' }),
    ...mapGetters('vendors', { vendors: 'vendors' }),
  },
  created() {      
  },
  methods: {
    openRejectTransaction(id) {
      this.isRejectTransactionActive = true;
    },
    rejectTransaction() {
      this.$store
        .dispatch("buffer/rejectTransactionAction", this.bufferedTransaction.id)
        .then(() => {
          this.isRejectTransactionActive = false;
          this.$store.dispatch("displaySuccessSnack", "Transakcja usunięta", {
            root: true
          });
        })
        .catch(() => {
          this.$store.dispatch(
            "displayErrorSnack",
            "Błąd przy usuwaniu transakcji",
            { root: true }
          );
        });
    }
  }
};
</script>

<style>
</style>