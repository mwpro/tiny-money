<template>
  <v-flex xs12>
    <v-card>
      <v-container
        fill-height
        fluid
        pa-2
      >
        <v-layout fill-height>
          <v-flex xs12 align-end flexbox>
            <v-treeview :items="availableMonths" selectable v-model="selectedMonths" v-show="monthPickerVisible"></v-treeview>
            Zakres czasu:
            <span v-for="m in selectedMonthsUi"> {{ m.year }}-{{m.month}} </span>
            <a @click="monthPickerVisible = true" v-show="!monthPickerVisible">Zmień</a><br>
            <v-btn flat @click="applyFilters()">Zastosuj</v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card>
  </v-flex>
</template>

<script>
  export default {
    data: () => {
      return {
        selectedMonths: [],
        monthPickerVisible: false,
      }
    },
    created() {
      this.$store.dispatch('reports/getAvailableMonths')
        .then(() => {
          this.selectedMonths = this.availableMonths.flatMap(y => y.children.map(c => c.id).concat(y.id));
          this.applyFilters();
        });
    },
    computed: {
      selectedMonthsUi() {
        return this.selectedMonths.filter(m => typeof m === 'object');
      },
      availableMonths() {
        return Object.entries(this.$store.state.reports.availableMonths).map(x => {
          let [year, months] = x;
          return {
            id: year,
            name: year,
            children: months.map(m => {
              return {id: {year: year, month: m}, name: m}
            })
          };
        });
      }
    },
    methods: {
      applyFilters() {
        this.$store.dispatch('reports/setSelectedMonths', this.selectedMonthsUi)
        this.monthPickerVisible = false;
      }
    }
  }
</script>
