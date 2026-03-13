import {Link} from "react-router-dom";
import {Card, CardHeader, CardDescription, CardTitle} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";

type Props = { incomesTotal: number; href: string };

export function IncomesWidget({incomesTotal, href}: Props) {
    return (
        <Link to={href} className="block hover:opacity-80 transition-opacity">
            <Card className="h-full">
                <CardHeader>
                    <CardDescription>Przychody</CardDescription>
                    <CardTitle className="text-2xl">
                        <Curr input={incomesTotal} colored isPositive={true}/>
                    </CardTitle>
                </CardHeader>
            </Card>
        </Link>
    );
}
