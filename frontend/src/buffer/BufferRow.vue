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
      <v-textarea
            label="Opis"
            v-model="description"
            auto-grow
            rows="1"
        ></v-textarea>
    </td>
    <td class="text-xs-left">
      <v-combobox
        v-model="tags"
        :items="tagsDict"
        :search-input.sync="tagSearch"
        hide-selected
        label="Tagi"
        item-text="name"
        small-chips
        multiple
        persistent-hint
        chips
        :deletable-chips="true"
      >
        <template slot="no-data">
          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title>
                No results matching "
                <strong>{{ tagSearch }}</strong>". Press
                <kbd>enter</kbd> to create a new one
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </v-combobox>
    </td>
    <td class="text-xs-left">
      <v-icon @click="approveTransaction()">check</v-icon>
      <v-icon @click="openRejectTransaction()">close</v-icon>
    </td>
    <v-dialog v-model="isRejectTransactionActive" persistent max-width="600">
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
        description: null,
        isEditing: false, // todo remove
        vendorSearch: null,
        tagSearch: null,
        tags: [],
      }
  },
  props: {
    bufferedTransaction: Object
  },
  watch: {
    'vendor': function () {
      if (this.vendor && this.vendor.defaultSubcategoryId) {
        this.subcategoryId = this.vendor.defaultSubcategoryId;
      }
    },
  },
  computed: {      
    ...mapGetters('categories', { subcategories: 'subcategories' }),
    ...mapGetters('tags', { tagsDict: 'tags' }),
    ...mapGetters('vendors', { vendors: 'vendors' }),
  },
  created() {      
  },
  methods: {
    openRejectTransaction() {
      this.isRejectTransactionActive = true;
    },
    approveTransaction() {
      this.$store
        .dispatch('buffer/approveTransactionAction', {
                "id": this.bufferedTransaction.id,
                //"amount": null,
                //"transactionDate": null,
                "description": this.description,
                "vendor": this.vendor,
                "subcategoryId": this.subcategoryId,
                "tags": this.tags
        })
        .then(() => {
          this.$store.dispatch('displaySuccessSnack', 'Transakcja zaakceptowana', {
            root: true,
          });
          this.resetTransaction();
        })
        .catch((error) => {
          console.log(error);
          this.$store.dispatch(
            'displayErrorSnack',
            'Błąd przy akceptowaniu transakcji',
            { root: true },
          );
        });
    },
    resetTransaction() {
      this.subcategoryId = null;
      this.vendor = null;
      this.description = null;
      this.tags = [];
    },
    rejectTransaction() {
      this.$store
        .dispatch("buffer/rejectTransactionAction", this.bufferedTransaction.id)
        .then(() => {
          this.isRejectTransactionActive = false;
          this.$store.dispatch("displaySuccessSnack", "Transakcja usunięta", {
            root: true
          });
          this.resetTransaction();
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