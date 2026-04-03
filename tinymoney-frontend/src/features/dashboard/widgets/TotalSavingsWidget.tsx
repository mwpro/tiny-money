import {Link} from "react-router-dom";
import {Card, CardHeader, CardDescription, CardTitle, CardContent} from "@/components/ui/card";
import {Curr} from "@/components/Curr.tsx";

type Props = { totalSavings: number; cushionTarget: number; cushionActual: number };

export function TotalSavingsWidget({totalSavings, cushionTarget, cushionActual}: Props) {
    const hasCushionTarget = cushionTarget > 0;
    const cushionMet = cushionActual >= cushionTarget;

    return (
        <Link to="/savings" className="block hover:opacity-80 transition-opacity">
            <Card className="h-full">
                <CardHeader>
                    <CardDescription>Oszczędności</CardDescription>
                    <CardTitle className="text-2xl">
                        <Curr input={totalSavings}/>
                    </CardTitle>
                </CardHeader>
                {hasCushionTarget && (
                    <CardContent className="pt-0">
                        <p className={`text-sm ${cushionMet ? 'text-green-600' : 'text-destructive'}`}>
                            Poduszka: <Curr input={cushionActual}/> / <Curr input={cushionTarget}/>
                        </p>
                    </CardContent>
                )}
            </Card>
        </Link>
    );
}
