import {useEffect, useState} from "react";
import {useForm, Controller} from "react-hook-form";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Link} from "react-router-dom";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {prepareTitleText} from "@/lib/utils.ts";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Card, CardHeader, CardDescription, CardTitle} from "@/components/ui/card.tsx";
import {toast} from "sonner";
import type {UpdateSavingsCushionRequest} from "@/api/ApiTypes.ts";
import {Curr} from "@/components/Curr.tsx";

type SettingsForm = {
    cushionAmount: number;
    cushionCategoryIds: number[];
};

export function SavingsCushionSettingsPage() {
    const {savingsClient} = useApiClient();
    const queryClient = useQueryClient();
    const [months, setMonths] = useState(6);

    const settingsQuery = useQuery({
        queryKey: ['savings-cushion'],
        queryFn: () => savingsClient.getCushion()
    });

    const categoriesQuery = useQuery({
        queryKey: ['savings-categories'],
        queryFn: () => savingsClient.getCategories()
    });

    const {register, handleSubmit, reset, setValue, watch, control} = useForm<SettingsForm>({
        defaultValues: {cushionAmount: 0, cushionCategoryIds: []}
    });

    useEffect(() => {
        if (settingsQuery.data) {
            reset({
                cushionAmount: settingsQuery.data.cushionAmount,
                cushionCategoryIds: settingsQuery.data.cushionCategoryIds
            });
        }
    }, [settingsQuery.data, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: SettingsForm) => {
            const request: UpdateSavingsCushionRequest = {
                cushionAmount: data.cushionAmount,
                cushionCategoryIds: data.cushionCategoryIds
            };
            return savingsClient.updateCushion(request);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['savings-cushion']});
            queryClient.invalidateQueries({queryKey: ['dashboard']});
            toast.success('Ustawienia zostały zapisane');
        },
        onError: (err: Error) => toast.error(err.message)
    });

    const selectedCategoryIds = watch('cushionCategoryIds');
    const avgs = settingsQuery.data;

    const recommendations = avgs
        ? [
            {label: '3 miesiące historii', avg: avgs.avgMonthlyExpenseThreeMonths},
            {label: '6 miesięcy historii', avg: avgs.avgMonthlyExpenseSixMonths},
            {label: '12 miesięcy historii', avg: avgs.avgMonthlyExpenseTwelveMonths},
        ]
        : [];

    return (
        <div className="max-w-2xl mx-auto">
            <title>{prepareTitleText("Ustawienia poduszki")}</title>
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" asChild className="px-0">
                    <Link to="/savings">← Oszczędności</Link>
                </Button>
            </div>
            <h1 className="text-2xl font-bold font-serif mb-6">Ustawienia poduszki finansowej</h1>

            {(settingsQuery.isLoading || categoriesQuery.isLoading) && <div className="p-10">Ładowanie danych...</div>}
            {(settingsQuery.isError || categoriesQuery.isError) && <div className="p-10 text-destructive">Błąd ładowania danych</div>}

            {settingsQuery.data && categoriesQuery.data && (
                <>
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <Label htmlFor="months-input" className="shrink-0">Ile miesięcy chcę pokryć:</Label>
                            <Input
                                id="months-input"
                                type="number"
                                min={1}
                                value={months}
                                onChange={e => setMonths(Math.max(1, Number(e.target.value)))}
                                className="w-24"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {recommendations.map(rec => {
                                const recommended = parseFloat((rec.avg * months).toFixed(2));
                                return (
                                    <button
                                        key={rec.label}
                                        type="button"
                                        onClick={() => setValue('cushionAmount', recommended)}
                                        className="text-left"
                                    >
                                        <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                                            <CardHeader>
                                                <CardDescription>{rec.label}</CardDescription>
                                                <CardTitle className="text-xl">
                                                    <Curr input={recommended}/>
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    śr. <Curr input={rec.avg}/>/mies.
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Kliknij kartę, aby użyć tej wartości jako celu poduszki. Wartości oparte na zweryfikowanych wydatkach z ostatnich pełnych miesięcy.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(data => saveMutation.mutate(data))} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="cushionAmount">Cel poduszki finansowej (zł)</Label>
                            <Input
                                id="cushionAmount"
                                type="number"
                                step="0.01"
                                min={0}
                                {...register('cushionAmount', {valueAsNumber: true})}
                                className="max-w-xs"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Kategorie kont wliczane do poduszki</Label>
                            {categoriesQuery.data.map(category => {
                                const isChecked = selectedCategoryIds.includes(category.id);
                                return (
                                    <div key={category.id} className="flex items-center gap-2">
                                        <Controller
                                            name="cushionCategoryIds"
                                            control={control}
                                            render={({field}) => (
                                                <Checkbox
                                                    id={`cat-${category.id}`}
                                                    checked={isChecked}
                                                    onCheckedChange={checked => {
                                                        const current = field.value ?? [];
                                                        field.onChange(
                                                            checked
                                                                ? [...current, category.id]
                                                                : current.filter((id: number) => id !== category.id)
                                                        );
                                                    }}
                                                />
                                            )}
                                        />
                                        <Label htmlFor={`cat-${category.id}`} className="cursor-pointer font-normal">
                                            {category.name}
                                        </Label>
                                    </div>
                                );
                            })}
                            {categoriesQuery.data.length === 0 && (
                                <p className="text-sm text-muted-foreground">Brak kategorii. Dodaj je w <Link to="/savings/accounts" className="underline">zarządzaniu kontami</Link>.</p>
                            )}
                        </div>

                        <Button type="submit" disabled={saveMutation.isPending}>
                            {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz ustawienia'}
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}
