import {useEffect, useRef, useState} from "react"
import {Controller, useForm} from "react-hook-form"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {type VendorDetails} from "@/api/ApiTypes.ts"

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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select.tsx";
import {useApiClient} from "@/api/ApiClientProvider.tsx";
import {X} from "lucide-react";

interface VendorEditorDialogProps {
    vendorToEdit?: VendorDetails,
    onClose?: () => void
}

export interface VendorInputs {
    name: string,
    defaultSubcategoryId: number
}

export function VendorEditorDialog({vendorToEdit, onClose}: VendorEditorDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const { vendorsClient, categoriesClient } = useApiClient();
    const [newAlias, setNewAlias] = useState("")
    const newAliasInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setIsOpen(!!vendorToEdit);
    }, [vendorToEdit]);

    useEffect(() => {
        !isOpen && onClose && onClose();
    }, [isOpen]);


    const {register, control, handleSubmit, setValue, formState: {errors}, reset} = useForm<VendorInputs>({
        defaultValues: {
            name: "",
            defaultSubcategoryId: 0
        }
    })

    useEffect(() => {
        setIsOpen(!!vendorToEdit);
        if (vendorToEdit) {
            setValue("name", vendorToEdit.name)
            setValue("defaultSubcategoryId", vendorToEdit.defaultSubcategoryId)
        } else {
            reset()
        }
    }, [vendorToEdit]);

    const dictionariesConfig = {staleTime: 1000 * 60 * 5}
    const subcategoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesClient.getCategories(),
        select: data => (new Map<number, string>(data.flatMap(c => c.subcategories.map(s => ([s.id, `${c.name} / ${s.name}`]))))),
        ...dictionariesConfig
    })
    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesClient.getCategories(),
        ...dictionariesConfig
    })

    const aliasesQuery = useQuery({
        queryKey: ['vendor-aliases', vendorToEdit?.id],
        queryFn: () => vendorsClient.getVendorAliases(vendorToEdit!.id),
        enabled: !!vendorToEdit,
    })

    const addAliasMutation = useMutation({
        mutationFn: (alias: string) => vendorsClient.addVendorAlias(vendorToEdit!.id, alias),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['vendor-aliases', vendorToEdit?.id]})
            setNewAlias("")
            newAliasInputRef.current?.focus()
        },
        onError: (error) => toast.error("Błąd: " + error.message)
    })

    const deleteAliasMutation = useMutation({
        mutationFn: (aliasId: number) => vendorsClient.deleteVendorAlias(vendorToEdit!.id, aliasId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['vendor-aliases', vendorToEdit?.id]})
        },
        onError: (error) => toast.error("Błąd: " + error.message)
    })

    const mutation = useMutation({
        mutationFn: (newVendor: VendorInputs) => vendorToEdit
            ? vendorsClient.editVendor(vendorToEdit.id, newVendor)
            : vendorsClient.addVendor(newVendor),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['transactions']})
            queryClient.invalidateQueries({queryKey: ['vendors']})
            queryClient.invalidateQueries({queryKey: ['vendors-details']})
            reset();
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error("Błąd: " + error.message)
        }
    })

    const onSubmit = (data: VendorInputs) => {
        mutation.mutate(data)
    }

    const handleAddAlias = () => {
        const trimmed = newAlias.trim()
        if (!trimmed) return
        addAliasMutation.mutate(trimmed)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(v) => {
            setIsOpen(v);
            reset();
        }}>
            <DialogTrigger asChild>
                <Button>Dodaj Sprzedawcę</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{vendorToEdit ? "Edytuj sprzedawcę" : "Dodaj nowego spzedawcę"}</DialogTitle>
                    <DialogDescription>
                        {vendorToEdit ? "Wprowadź zmiany i kliknij Zapisz" : "Uzupełnij dane sprzedawcy i kliknij Zapisz"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Nazwa sprzedawcy</Label>
                        <Input {...register("name", { required: true })} />
                        {errors.name &&
                            <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label>Domyślna kategoria</Label>
                        <Controller
                            control={control}
                            name="defaultSubcategoryId"
                            render={({field}) => (
                                <Select onValueChange={(val) => {
                                    const parsedSubcategoryId = Number(val);
                                    field.onChange(parsedSubcategoryId);
                                }} value={(field.value > 0) ? field.value.toString() : ""}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Wybierz kategorię">
                                            { subcategoriesQuery.data && field.value ? subcategoriesQuery.data.get(field.value) : "Kategoria" }
                                        </SelectValue>
                                    </SelectTrigger>

                                    <SelectContent>
                                        {categoriesQuery.data && categoriesQuery.data.map(category => (
                                            <SelectGroup key={category.id}>
                                                <SelectLabel>{category.name}</SelectLabel>
                                                {category.subcategories.map(subcategory => (
                                                    <SelectItem key={subcategory.id}
                                                                value={subcategory.id.toString()}>{subcategory.name}</SelectItem>))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.defaultSubcategoryId &&
                            <span className="text-red-500 text-xs">{errors.defaultSubcategoryId.message}</span>}
                    </div>

                    {vendorToEdit && (
                        <div className="grid gap-2">
                            <Label>Słowa kluczowe do automatycznego wykrywania</Label>
                            <p className="text-xs text-muted-foreground">
                                Jeśli opis transakcji zawiera dane słowo kluczowe, sprzedawca zostanie przypisany automatycznie podczas importu.
                            </p>
                            <div className="flex flex-wrap gap-1 min-h-6">
                                {aliasesQuery.data?.map(a => (
                                    <span key={a.id}
                                          className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-medium">
                                        {a.alias}
                                        <button
                                            type="button"
                                            onClick={() => deleteAliasMutation.mutate(a.id)}
                                            className="text-muted-foreground hover:text-foreground"
                                            aria-label="Usuń"
                                        >
                                            <X size={10}/>
                                        </button>
                                    </span>
                                ))}
                                {aliasesQuery.data?.length === 0 && (
                                    <span className="text-xs text-muted-foreground">Brak słów kluczowych</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    ref={newAliasInputRef}
                                    value={newAlias}
                                    onChange={e => setNewAlias(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAlias(); } }}
                                    placeholder="np. biedronka"
                                    className="h-8 text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleAddAlias}
                                    disabled={!newAlias.trim() || addAliasMutation.isPending}
                                >
                                    Dodaj
                                </Button>
                            </div>
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
