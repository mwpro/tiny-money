import {useEffect, useRef} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {aiSuggestionStatusQueryKey} from "@/features/transactions/aiSuggestionStatusQueryKey.ts";

const toastId = 'ai-suggestions-progress';

const remainingText: Record<string, string> = {
    one: "Pozostała {n} transakcja",
    few: "Pozostały {n} transakcje",
    many: "Pozostało {n} transakcji",
};
const pluralRules = new Intl.PluralRules("pl");

function remaining(n: number) {
    return (remainingText[pluralRules.select(n)] ?? remainingText.many).replace("{n}", n.toString());
}

export function AiSuggestionProgressToast() {
    const { transactionsClient } = useApiClient();
    const queryClient = useQueryClient();
    const previousPending = useRef(0);

    const statusQuery = useQuery({
        queryKey: aiSuggestionStatusQueryKey,
        queryFn: () => transactionsClient.getAiSuggestionStatus(),
        refetchInterval: (query) => (query.state.data?.pending ?? 0) > 0 ? 2000 : false,
    });

    const status = statusQuery.data;
    useEffect(() => {
        if (!status?.isEnabled) return;

        if (status.pending > 0) {
            toast.loading("AI przygotowuje sugestie sprzedawców i kategorii", {
                id: toastId, description: remaining(status.pending)
            });
        } else if (previousPending.current > 0) {
            toast.success("Sugestie AI są gotowe", {
                id: toastId, description: "Zobaczysz je podczas edycji niezweryfikowanych transakcji"
            });
            queryClient.invalidateQueries({queryKey: ['transaction']});
        }
        previousPending.current = status.pending;
    }, [status, queryClient]);

    return null;
}
