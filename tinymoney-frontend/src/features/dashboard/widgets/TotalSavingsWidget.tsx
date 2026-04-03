import {Link} from "react-router-dom";
import {Card, CardHeader, CardDescription, CardTitle} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";

type Props = { totalSavings: number };

export function TotalSavingsWidget({totalSavings}: Props) {
    return (
        <Link to="/savings" className="block hover:opacity-80 transition-opacity">
            <Card className="h-full">
                <CardHeader>
                    <CardDescription>Oszczędności</CardDescription>
                    <CardTitle className="text-2xl">
                        <Curr input={totalSavings}/>
                    </CardTitle>
                </CardHeader>
            </Card>
        </Link>
    );
}
