import {useAuth0} from "@auth0/auth0-react";
import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {getBudget, getCategories} from "@/lib/api.ts";
import {BudgetTable} from "@/features/budgets/BudgetTable.tsx";


export function BudgetsPage() {
    const auth = useAuth0();
    const [budgetPeriod, setBudgetPeriod] = useState<MonthSelection>({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    })
    
    const dictionariesConfig = {staleTime: 1000 * 60 * 5}
    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: () => getCategories(auth),
        ...dictionariesConfig
    })
    
    const budgetQuery = useQuery({
        queryKey: ['budget', budgetPeriod],
        queryFn: () => getBudget(auth, budgetPeriod)
    })
    
    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Budżet</h1>
            </div>

            <div className="flex flex-row gap-3 mb-6">
                <MonthPicker month={budgetPeriod}  onChange={(month) => {
                    setBudgetPeriod(month);
                }}/>
            </div>

            {(categoriesQuery.isLoading || budgetQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(categoriesQuery.isError || budgetQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {categoriesQuery.data && budgetQuery.data &&
                <BudgetTable categories={categoriesQuery.data} budget={budgetQuery.data}/>
            }
        </div>
    )
}