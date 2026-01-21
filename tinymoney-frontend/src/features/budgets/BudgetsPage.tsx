import {useAuth0} from "@auth0/auth0-react";
import {MonthPicker, type MonthSelection} from "@/components/MonthPicker.tsx";
import {useEffect, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {getBudget} from "@/lib/api.ts";
import {BudgetTable} from "@/features/budgets/BudgetTable.tsx";
import {useSearchParams} from "react-router-dom";
import {parse} from "date-fns";


export function BudgetsPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();
    const [budgetPeriod, setBudgetPeriod] = useState<MonthSelection>(() => {
        const fromSearchParams = searchParams.get("budgetPeriod") ? parse(searchParams.get("budgetPeriod") as string, "yyyy-MM", new Date()) : new Date()
        return {
            year: fromSearchParams.getFullYear(),
            month: fromSearchParams.getMonth() + 1
        };
    });

    useEffect(() => {
            setSearchParams((params) => {
                budgetPeriod && params.set("budgetPeriod", `${budgetPeriod.year}-${budgetPeriod.month}`);
                return params;
            })
        },
        [budgetPeriod]);
    useEffect(() => {
            const fromSearchParams = searchParams.get("budgetPeriod") ? parse(searchParams.get("budgetPeriod") as string, "yyyy-MM", new Date()) : new Date()
            setBudgetPeriod({
                year: fromSearchParams.getFullYear(),
                month: fromSearchParams.getMonth() + 1
            });
        },
        [searchParams]);

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
                <MonthPicker month={budgetPeriod} onChange={setBudgetPeriod}/>
            </div>

            {(budgetQuery.isLoading) &&
                <div className="p-10">Ładowanie danych...</div>}
            {(budgetQuery.isError) &&
                <div className="p-10 text-red-500">Błąd ładowania danych</div>}
            {budgetQuery.data &&
                <BudgetTable budget={budgetQuery.data} budgetPeriod={budgetPeriod}/>
            }
        </div>
    )
}