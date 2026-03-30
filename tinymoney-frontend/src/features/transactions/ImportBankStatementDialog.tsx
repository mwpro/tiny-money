import {useState} from "react";
import {useForm, Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {Button} from "@/components/ui/button.tsx";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription} from "@/components/ui/dialog.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

const importSchema = z.object({
    fileType: z.string().refine(v => ["ing", "pekao", "velobank", "revolut"].includes(v), { error: "Wybierz typ pliku"}),
    file: z.instanceof(FileList).refine(f => f.length > 0, "Wybierz plik"),
});

type ImportFormValues = z.infer<typeof importSchema>;

export function ImportBankStatementDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const { transactionsClient } = useApiClient();

    const {control, handleSubmit, register, reset, watch, formState: {errors}} = useForm<ImportFormValues>({
        resolver: zodResolver(importSchema),
        defaultValues: {
            file: undefined,
            fileType: ""
        }
    });

    const fileType = watch("fileType");

    const mutation = useMutation({
        mutationFn: (data: ImportFormValues) =>
            transactionsClient.importBankStatementFile(data.file[0], data.fileType),
        onSuccess: (result) => {
            queryClient.invalidateQueries({queryKey: ['transactions']});
            let message = `Zaimportowano ${result.numberOfImportedTransactions} transakcji`;
            if (result.numberOfPossibleDuplicates > 0) {
                message += `. W tym ${result.numberOfPossibleDuplicates} możliwych duplikatów — sprawdź przed weryfikacją`;
            }
            toast.success(message);
            reset();
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Błąd importu: " + error.message);
        }
    });

    const onSubmit = (data: ImportFormValues) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(v) => {
            setIsOpen(v);
            if (!v) reset();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline">Importuj</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Importuj wyciąg bankowy</DialogTitle>
                    <DialogDescription>
                        Wybierz bank i załaduj plik wyciągu
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Typ pliku</Label>
                        <Controller
                            control={control}
                            name="fileType"
                            render={({field}) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wybierz bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ing">ING (CSV)</SelectItem>
                                        <SelectItem value="pekao">Pekao (CSV)</SelectItem>
                                        <SelectItem value="velobank">Velo Bank (PDF)</SelectItem>
                                        <SelectItem value="revolut">Revolut (CSV)</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.fileType && <span className="text-red-500 text-xs">{errors.fileType.message}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label>Plik</Label>
                        <input
                            type="file"
                            accept={fileType === "velobank" ? ".pdf" : ".csv"}
                            className="text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
                            {...register("file")}
                        />
                        {errors.file && <span className="text-red-500 text-xs">{errors.file.message as string}</span>}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Importowanie..." : "Importuj"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
