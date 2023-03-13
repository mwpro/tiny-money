<template>
  <v-dialog v-model="isOpen" width="500" persistent>
    <v-card tile>
      <v-form ref="form" v-model="valid" @keyup.native.ctrl.enter="saveAndAddNext()">
        <v-toolbar card dark color="primary">
          <v-toolbar-title>{{ isEditing ? `Edytuj transakcję` : "Dodaj transakcję" }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn icon dark @click="close()">
              <v-icon>close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-card-text>
          <v-container grid-list-md>
            <v-layout wrap>
              <v-flex xs12>
                <v-menu
                  ref="menu"
                  :close-on-content-click="false"
                  v-model="datePickerOpen"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  full-width
                  min-width="290px"
                  @keyup.native.left="dayBack()"
                  @keyup.native.right="dayForward()"
                  @keyup.native.enter="datePickerOpen = false"
                >
                  <v-text-field
                    slot="activator"
                    v-model="transaction.transactionDate"
                    :rules="transactionDateRules"
                    label="Data transakcji*"
                    prepend-icon="event"
                    readonly
                  ></v-text-field>
                  <v-date-picker v-model="transaction.transactionDate"
                    no-title
                    scrollable
                    first-day-of-week="1"
                    @input="datePickerOpen = false">
                  </v-date-picker>
                </v-menu>
              </v-flex>
              <v-flex xs12>
                <v-combobox
                  v-model="transaction.vendor"
                  :items="vendors"
                  :search-input.sync="vendorSearch"
                  :rules="vendorRules"
                  hide-selected
                  label="Sprzedawca*"
                  item-text="name"
                  prepend-icon="work"
                  required
                >
                </v-combobox>
              </v-flex>
              <v-flex xs12>
                <v-text-field
                  :label="transaction.isExpense ? 'Kwota wydatku*' : 'Kwota przychodu*'"
                  :rules="amountRules"
                  :prepend-icon="transaction.isExpense ? 'remove' : 'add'"
                  @click:prepend="transaction.isExpense = !transaction.isExpense"
                  v-model="transaction.amount"
                  required
                  type="number"
                  suffix="PLN"
                ></v-text-field>
              </v-flex>
              <v-flex xs12>
                <v-autocomplete
                  v-model="transaction.subcategoryId"
                  :items="subcategories"
                  :rules="categoryRules"
                  item-text="fullName"
                  item-value="id"
                  label="Kategoria*"
                  persistent-hint
                  prepend-icon="format_list_bulleted"
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
              </v-flex>
              <v-flex xs12>
                <v-combobox
                  v-model="transaction.tags"
                  :items="tags"
                  :search-input.sync="tagSearch"
                  hide-selected
                  label="Tagi"
                  item-text="name"
                  small-chips
                  multiple
                  persistent-hint
                  chips
                  prepend-icon="#"
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
              </v-flex>
              <v-flex xs12>
                <v-textarea
                  label="Opis"
                  v-model="transaction.description"
                  auto-grow
                  rows="1"
                  prepend-icon="notes"
                ></v-textarea>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" flat @click="save()">Zapisz</v-btn>
          <v-btn
            color="blue darken-1"
            v-if="!isEditing"
            flat
            @click="saveAndAddNext()"
          >Zapisz i dodaj następną</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  data() {
    return {
      transaction: {
        transactionDate: new Date().toISOString().substr(0, 10),
        subcategoryId: null,
        isExpense: true,
        amount: null,
        vendor: null,
        description: null,
        tags: []
      },
      transactionDateRules: [
        v => !!v || 'Data transakcji jest wymagana',
      ],
      categoryRules: [
        v => !!v || 'Kategoria jest wymagana',
      ],
      amountRules: [
        v => !!v || 'Kwota jest wymagana',
        v => (v && v > 0) || 'Kwota musi być wyższa od 0',
      ],
      vendorRules: [
        v => !!v || 'Sprzedawca jest wymagany',
      ],
      valid: true,
      datePickerOpen: false,
      tagSearch: null,
      vendorSearch: null,
    };
  },
  computed: {
    ...mapState('categories', { categories: 'categoriesList' }),
    ...mapGetters('categories', { subcategories: 'subcategories' }),
    ...mapGetters('tags', { tags: 'tags' }),
    ...mapGetters('vendors', { vendors: 'vendors' }),
    isEditing() {
      return this.editedTransactionId;
    },
  },
  created() {
    this.$store.dispatch('categories/getCategories');
    this.$store.dispatch('tags/getTagsAction');
    this.$store.dispatch('vendors/getVendorsAction');
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    editedTransactionId: {
      type: Number,
      required: false,
    },
  },
  watch: {
    editedTransactionId(transactionId) {
      if (transactionId) {
        this.$store.dispatch('transactions/getTransactionAction', transactionId)
          .then((t) => {
            const transaction = { ...this.$store.state.transactions.transaction };
            this.transaction = {
              id: transaction.id,
              transactionDate: transaction.transactionDate.substr(0, 10),
              subcategoryId: transaction.subcategoryId,
              isExpense: transaction.isExpense,
              amount: transaction.amount,
              vendor: this.vendors.find(v => v.id === transaction.vendorId),
              description: transaction.description,
              tags: this.tags.filter(t => transaction.tagIds.includes(t.id)),
            };
          });
      } else {
        this.transaction = {
          transactionDate: new Date().toISOString().substr(0, 10),
          subcategoryId: null,
          isExpense: true,
          amount: null,
          vendor: null,
          description: null,
          tags: [],
        };
      }
    },
    'transaction.vendor': function () {
      if (this.transaction.vendor && this.transaction.vendor.defaultSubcategoryId) {
        this.transaction.subcategoryId = this.transaction.vendor.defaultSubcategoryId;
      }
    },
  },
  methods: {
    dayBack() {
      const date = new Date(this.transaction.transactionDate);
      date.setDate(date.getDate() - 1);
      this.transaction.transactionDate = date.toISOString().substr(0, 10);
    },
    dayForward() {
      const date = new Date(this.transaction.transactionDate);
      date.setDate(date.getDate() + 1);
      this.transaction.transactionDate = date.toISOString().substr(0, 10);
    },
    saveAndAddNext() {
      this.$refs.form.validate();
      if (!this.valid) {
        this.$store.dispatch(
          'displayErrorSnack',
          'Dane transakcji są niepoprawne',
          { root: true },
        );
        return;
      }
      this.$store
        .dispatch('transactions/addTransactionAction', this.transaction)
        .then(() => {
          const date = this.transaction.transactionDate;
          this.resetTransaction();
          this.transaction.transactionDate = date;
          this.$store.dispatch('displaySuccessSnack', 'Transakcja zapisana', {
            root: true,
          });
        })
        .catch(() => {
          this.$store.dispatch(
            'displayErrorSnack',
            'Błąd przy zapisywaniu transakcji',
            { root: true },
          );
        });
    },
    save() {
      this.$refs.form.validate();
      if (!this.valid) {
        this.$store.dispatch(
          'displayErrorSnack',
          'Dane transakcji są niepoprawne',
          { root: true },
        );
        return;
      }
      this.$store
        .dispatch('transactions/addTransactionAction', this.transaction)
        .then(() => {
          this.resetTransaction();
          this.$store.dispatch('displaySuccessSnack', 'Transakcja zapisana', {
            root: true,
          });
          this.close();
        })
        .catch((error) => {
          this.$store.dispatch(
            'displayErrorSnack',
            'Błąd przy zapisywaniu transakcji',
            { root: true },
          );
        });
    },
    close() {
      this.resetTransaction();
      this.$emit('closed');
    },
    resetTransaction() {
      this.transactionId = null;
      this.transaction = {
        transactionDate: new Date().toISOString().substr(0, 10),
        subcategoryId: null,
        isExpense: true,
        amount: null,
        vendor: null,
        description: null,
        tags: [],
      };
      this.$refs.form.resetValidation();
    },
  },
};
</script>

<style>
</style>
