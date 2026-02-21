import {prepareTitleText} from "@/lib/utils.ts";

export function DashboardPage(){
    return (<>
            <title>{prepareTitleText("Dashboard")}</title>
            <div className="text-center p-10 text-2xl">Dashboard 📈</div>
        </>);
}