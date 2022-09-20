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
            <div>
              <v-btn v-for="filter in quickFilters" @click="quickFilter(filter)">{{filter.name}}</v-btn>
              <v-btn @click="monthPickerVisible = true" v-show="!monthPickerVisible">Wybierz miesiące</v-btn>
            </div>
            <v-treeview :items="availableMonths" selectable v-model="selectedMonths" v-show="monthPickerVisible"></v-treeview>
            <v-btn @click="applyFilters()" v-show="monthPickerVisible">Zastosuj</v-btn><br>
            Wybrane miesiące:
            <v-chip v-for="m in selectedMonthsUi">{{ m.year }}-{{m.month}}</v-chip>
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
        quickFilters: [
          {name: "Cała historia", func: () => true},
          {name: "Ten miesiąc", func: (x, currentDate) => x.month == currentDate.getMonth()+1 && x.year == currentDate.getFullYear()},
          {name: "Poprzedni miesiąc", func: (x, currentDate) => {
              const previousMonth = (new Date(new Date(currentDate).setMonth(currentDate.getMonth() - 1)));
              return x.month == previousMonth.getMonth()+1 && x.year == previousMonth.getFullYear();
            }},
          {name: "Ten rok", func: (x, currentDate) => x.year == currentDate.getFullYear()},
          {name: "Poprzedni rok", func: (x, currentDate) => x.year == currentDate.getFullYear()-1},
          {name: "Ten i poprzedni rok", func: (x, currentDate) => x.year == currentDate.getFullYear() || x.year == currentDate.getFullYear()-1}
        ]
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
        return this.selectedMonths.map(m => {
          const parts = m.split('-');
          if (parts.length < 2)
            return null;

          return {year: parts[0], month: parts[1]};
        }).filter(m => m);
      },
      availableMonths() {
        return Object.entries(this.$store.state.reports.availableMonths).map(x => {
          let [year, months] = x;
          return {
            id: year,
            name: year,
            children: months.map(m => {
              return {id: `${year}-${m}`, name: m, month: m, year: year}
            })
          };
        });
      }
    },
    methods: {
      applyFilters() {
        if (!this.selectedMonths.length)
          return;
        this.$store.dispatch('reports/setSelectedMonths', this.selectedMonthsUi)
        this.monthPickerVisible = false;
      },
      quickFilter(filter){
        const currentDate = new Date();
        this.selectedMonths = this.availableMonths
          .flatMap(y => y.children)
          .filter(m => filter.func(m, currentDate))
          .map(m => m.id);
        this.applyFilters();
      }
    }
  }
</script>
