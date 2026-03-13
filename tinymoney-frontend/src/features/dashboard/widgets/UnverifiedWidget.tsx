import {Link} from "react-router-dom";
import {Card, CardHeader, CardDescription, CardTitle} from "@/components/ui/card";
import {CheckSquare} from "lucide-react";

type Props = { unverifiedCount: number; href: string };

export function UnverifiedWidget({unverifiedCount, href}: Props) {
    const isAllVerified = unverifiedCount === 0;
    return (
        <Link to={href} className="block hover:opacity-80 transition-opacity">
            <Card className={`h-full ${isAllVerified ? 'opacity-40' : 'border-amber-400'}`}>
                <CardHeader>
                    <CardDescription className="flex items-center gap-1">
                        <CheckSquare className="h-3.5 w-3.5"/>
                        Do weryfikacji
                    </CardDescription>
                    <CardTitle className="text-2xl">
                        {isAllVerified
                            ? <span className="text-base font-normal">Wszystko zweryfikowane ✓</span>
                            : <>{unverifiedCount}<span className="text-base font-normal text-muted-foreground ml-1">transakcji</span></>
                        }
                    </CardTitle>
                </CardHeader>
            </Card>
        </Link>
    );
}
