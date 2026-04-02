import {useEffect, useState} from "react"
import {Controller, useForm} from "react-hook-form"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {type SavingsAccount} from "@/api/ApiTypes.ts"

import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {toast} from "sonner";
import {Input} from "@/components/ui/input.tsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {useApiClient} from "@/api/ApiClientProvider.tsx";

interface SavingsAccountEditorDialogProps {
    accountToEdit?: SavingsAccount,
    onClose?: () => void
}

interface AccountInputs {
    name: string,
    categoryId: number,
    isActive: boolean
}

export function SavingsAccountEditorDialog({accountToEdit, onClose}: SavingsAccountEditorDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const {savingsClient} = useApiClient();

    useEffect(() => {
        setIsOpen(!!accountToEdit);
        if (accountToEdit) {
            setValue("name", accountToEdit.id > 0 ? accountToEdit.name : "")
            setValue("categoryId", accountToEdit.id > 0 ? accountToEdit.categoryId : 0)
            setValue("isActive", accountToEdit.id > 0 ? accountToEdit.isActive : true)
        } else {
            reset()
        }
    }, [accountToEdit]);

    useEffect(() => {
        !isOpen && onClose && onClose();
    }, [isOpen]);

    const {register, control, handleSubmit, setValue, formState: {errors}, reset} = useForm<AccountInputs>({
        defaultValues: {name: "", categoryId: 0, isActive: true}
    })

    const categoriesQuery = useQuery({
        queryKey: ['savings-categories'],
        queryFn: () => savingsClient.getCategories(),
        staleTime: 1000 * 60 * 5
    })

    const mutation = useMutation<void, Error, AccountInputs>({
        mutationFn: async (data: AccountInputs) => {
            if (accountToEdit && accountToEdit.id > 0) {
                await savingsClient.updateAccount(accountToEdit.id, data.name, data.categoryId, data.isActive)
            } else {
                await savingsClient.createAccount(data.name, data.categoryId)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['savings-accounts']})
            reset();
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const isEditMode = !!(accountToEdit && accountToEdit.id > 0)

    return (
        <Dialog open={isOpen} onOpenChange={(v) => {
            setIsOpen(v);
            reset();
        }}>
            <DialogTrigger asChild>
                <Button>Dodaj konto</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edytuj konto" : "Dodaj konto"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? "Wprowadź zmiany i kliknij Zapisz" : "Uzupełnij dane konta i kliknij Zapisz"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa konta</Label>
                        <Input {...register("name", {required: true, maxLength: 100})} />
                        {errors.name && <span className="text-red-500 text-xs">Nazwa jest wymagana</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label>Kategoria</Label>
                        <Controller
                            control={control}
                            name="categoryId"
                            rules={{validate: v => v > 0 || "Wybierz kategorię"}}
                            render={({field}) => (
                                <Select
                                    onValueChange={(val) => field.onChange(Number(val))}
                                    value={field.value > 0 ? field.value.toString() : ""}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Wybierz kategorię" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categoriesQuery.data?.map(category => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.categoryId && <span className="text-red-500 text-xs">{errors.categoryId.message}</span>}
                    </div>

                    {isEditMode && (
                        <div className="flex items-center gap-2">
                            <Controller
                                control={control}
                                name="isActive"
                                render={({field}) => (
                                    <Switch
                                        id="isActive"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="isActive">Aktywne</Label>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
