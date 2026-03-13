import {Link} from "react-router-dom";
import {Card, CardHeader, CardDescription, CardTitle} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";

type Props = { expensesTotal: number; href: string };

export function ExpensesWidget({expensesTotal, href}: Props) {
    return (
        <Link to={href} className="block hover:opacity-80 transition-opacity">
            <Card className="h-full">
                <CardHeader>
                    <CardDescription>Wydatki</CardDescription>
                    <CardTitle className="text-2xl">
                        <Curr input={expensesTotal} colored isPositive={false}/>
                    </CardTitle>
                </CardHeader>
            </Card>
        </Link>
    );
}
