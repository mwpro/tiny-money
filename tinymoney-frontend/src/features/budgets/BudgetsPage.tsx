import {useAuth0} from "@auth0/auth0-react";
import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {useEffect, useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {getBudget, getBudgetSuggestions} from "@/lib/api.ts";
import {BudgetTable} from "@/features/budgets/BudgetTable.tsx";
import {useSearchParams} from "react-router-dom";
import {parse} from "date-fns";


export function BudgetsPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const handlePeriodChange = (newPeriod: MonthSelection) => {
        setSearchParams({ budgetPeriod: `${newPeriod.year}-${String(newPeriod.month).padStart(2, '0')}` });
    };
    
    const budgetPeriod = useMemo(() => {
        const periodStr = searchParams.get("budgetPeriod");
        const date = periodStr ? parse(periodStr, "yyyy-MM", new Date()) : new Date();
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
        };
    }, [searchParams]);
    
    useEffect(() => {
        if (!searchParams.get("budgetPeriod")) {
            handlePeriodChange(budgetPeriod);
        }
    }, [budgetPeriod]);

    const budgetQuery = useQuery({
        queryKey: ['budget', budgetPeriod],
        queryFn: () => getBudget(auth, budgetPeriod)
    })

    const budgetSuggestionsQuery = useQuery({
        queryKey: ['budgetSuggestions', budgetPeriod],
        queryFn: () => getBudgetSuggestions(auth, budgetPeriod)
    })

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Budżet</h1>
            </div>

            <div className="flex flex-row gap-3 mb-6">
                <MonthPicker month={budgetPeriod} onChange={handlePeriodChange}/>
            </div>

            {(budgetQuery.isLoading || budgetSuggestionsQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(budgetQuery.isError || budgetSuggestionsQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {budgetQuery.data && budgetSuggestionsQuery.data &&
                <BudgetTable budget={budgetQuery.data} budgetPeriod={budgetPeriod} budgetSuggestions={budgetSuggestionsQuery.data.subcategoryBudgetSuggestions} />
            }
        </div>
    )
}