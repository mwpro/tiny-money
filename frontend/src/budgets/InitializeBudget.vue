<template>
  <v-dialog v-model="isOpen" width="500" persistent>
    <v-card tile>
      <v-toolbar card dark color="primary">
        <v-toolbar-title>Utwórz budżet</v-toolbar-title>
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
              Skopiuj z
                    <v-menu
                      ref="menu"
                      :close-on-content-click="false"
                      :return-value.sync="sourceMonth"
                      lazy
                      transition="scale-transition"
                      offset-y
                    >
                      <span slot="activator">{{ sourceMonth }}</span>
                      <v-date-picker
                        v-model="sourceMonth"
                        type="month"
                        no-title
                        scrollable
                        @input="$refs.menu.save(sourceMonth)"
                      ></v-date-picker>
                    </v-menu>
                    do {{ targetMonth }}
            </v-flex>
            <v-flex></v-flex>
          </v-layout>
        </v-container>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" flat @click="save()">Utwórz</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      initializeMode: 'empty',
      sourceMonth: null,
    };
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    targetMonth: {
      type: String,
      required: true,
    },
  },
  created() {
    const sourceMonth = new Date(this.targetMonth.substr(0, 4), this.targetMonth.substr(5, 7));
    sourceMonth.setMonth(sourceMonth.getMonth() - 1);
    this.sourceMonth = sourceMonth.toISOString().substr(0, 7);
  },
  methods: {
    close() {
      this.$emit('closed');
    },
    save() {
      this.$store
        .dispatch('budgets/copyBudgetAction', {
          yearFrom: this.sourceMonth.substr(0, 4),
          monthFrom: this.sourceMonth.substr(5, 7),
          yearTo: this.targetMonth.substr(0, 4),
          monthTo: this.targetMonth.substr(5, 7),
        })
        .then(() => {
          this.$emit('closed');
        });
    },
  },
};
</script>
