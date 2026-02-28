import {useEffect, useState} from "react"
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
    const apiClient = useApiClient();

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
        queryFn: () => apiClient.getCategories(),
        select: data => (new Map<number, string>(data.flatMap(c => c.subcategories.map(s => ([s.id, `${c.name} / ${s.name}`]))))),
        ...dictionariesConfig
    })
    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: () => apiClient.getCategories(),
        ...dictionariesConfig
    })

    const mutation = useMutation({
        mutationFn: (newVendor: VendorInputs) => vendorToEdit
            ? apiClient.editVendor(vendorToEdit.id, newVendor)
            : apiClient.addVendor(newVendor),
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