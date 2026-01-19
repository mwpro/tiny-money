import {useAuth0} from "@auth0/auth0-react";
import {useSearchParams} from "react-router-dom";
import {MonthPicker} from "@/components/MonthPicker.tsx";
import {useState} from "react";


export function BudgetsPage() {
    const auth = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();
    const [budgetPeriod, setBudgetPeriod] = useState<Date>(new Date())
    
    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Budżet</h1>
            </div>

            <div className="flex flex-row gap-3 mb-6">
                <h2 className="text-xl font-bold">Filtry</h2>
                <MonthPicker month={budgetPeriod}  onChange={(month) => {
                    setBudgetPeriod(month);
                }}/>
            </div>
        </div>
    )
}