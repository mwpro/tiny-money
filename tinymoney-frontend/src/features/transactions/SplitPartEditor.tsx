import {memo, useRef} from "react"
import {Controller, useFormState, useWatch, type Control, type UseFormRegister, type UseFormSetValue, type UseFieldArrayRemove} from "react-hook-form"
import {useQuery} from "@tanstack/react-query"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue} from "@/components/ui/select"
import {TagsInput} from "@/components/TagsInput.tsx"
import Autocomplete from "@/components/Autocomplete.tsx"
import {InputGroup, InputGroupAddon, InputGroupInput, InputGroupText} from "@/components/ui/input-group.tsx"
import {Trash2} from "lucide-react"
import {useApiClient} from "@/api/ApiClientProvider.tsx"
import type {VendorSuggestion} from "@/api/ApiTypes.ts"
import type {SplitFormValues} from "@/features/transactions/SplitTransactionDialog.tsx"

interface SplitPartEditorProps {
    index: number
    control: Control<SplitFormValues>
    register: UseFormRegister<SplitFormValues>
    setValue: UseFormSetValue<SplitFormValues>
    remove: UseFieldArrayRemove
    canRemove: boolean
}

export const SplitPartEditor = memo(function SplitPartEditor({index, control, register, setValue, remove, canRemove}: SplitPartEditorProps) {
    const {vendorsClient, categoriesClient, tagsClient} = useApiClient()
    const lastVendorSuggestions = useRef<VendorSuggestion[]>([])

    const dictionariesConfig = {staleTime: 1000 * 60 * 5}
    const categoriesQuery = useQuery({queryKey: ['categories'], queryFn: () => categoriesClient.getCategories(), ...dictionariesConfig})
    const tagsQuery = useQuery({queryKey: ['tags'], queryFn: () => tagsClient.getTags(), ...dictionariesConfig})

    const currentSubcategoryId = useWatch({control, name: `splits.${index}.subcategoryId`})
    const {errors} = useFormState({control, name: `splits.${index}` as "splits"})

    return (
        <div className="border rounded-md p-3 grid gap-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Część {index + 1}</span>
                {canRemove && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                )}
            </div>

            <div className="grid gap-2">
                <Label>Kwota</Label>
                <InputGroup>
                    <InputGroupInput type="number" step="0.01" placeholder="0.00" {...register(`splits.${index}.amount`)} />
                    <InputGroupAddon align="inline-end"><InputGroupText>zł</InputGroupText></InputGroupAddon>
                </InputGroup>
                {errors.splits?.[index]?.amount && (
                    <span className="text-red-500 text-xs">{errors.splits[index].amount?.message}</span>
                )}
            </div>

            <div className="grid gap-2">
                <Label>Sprzedawca</Label>
                <Controller
                    control={control}
                    name={`splits.${index}.vendor`}
                    render={({field: f}) => (
                        <Autocomplete
                            fetchSuggestions={async input => {
                                const suggestions = await vendorsClient.autocompleteVendors(input)
                                lastVendorSuggestions.current = suggestions
                                return suggestions.map(s => ({id: s.vendorId, name: s.vendorName}))
                            }}
                            value={f.value.name}
                            clearQueryAfterSelection={false}
                            onChange={value => {
                                f.onChange(value ? {...value} : {id: undefined, name: ""})
                                if (value?.id) {
                                    const suggestion = lastVendorSuggestions.current.find(s => s.vendorId === value.id)
                                    if (suggestion?.defaultSubcategoryId && !currentSubcategoryId) {
                                        setValue(`splits.${index}.subcategoryId`, suggestion.defaultSubcategoryId)
                                        const isIncomeCategory = categoriesQuery.data?.find(c =>
                                            c.subcategories.some(s => s.id === suggestion.defaultSubcategoryId))?.isIncome
                                        if (isIncomeCategory !== undefined) {
                                            setValue(`splits.${index}.isExpense`, !isIncomeCategory)
                                        }
                                    }
                                }
                            }}
                            allowCustomValues={true}
                        />
                    )}
                />
                {errors.splits?.[index]?.vendor?.name && (
                    <span className="text-red-500 text-xs">{errors.splits[index].vendor?.name?.message}</span>
                )}
            </div>

            <div className="grid gap-2">
                <Label>Kategoria</Label>
                <Controller
                    control={control}
                    name={`splits.${index}.subcategoryId`}
                    render={({field: f}) => (
                        <Select
                            onValueChange={val => {
                                const parsed = Number(val)
                                f.onChange(parsed || undefined)
                                if (parsed) {
                                    const isIncomeCategory = categoriesQuery.data?.find(c =>
                                        c.subcategories.some(s => s.id === parsed))?.isIncome
                                    if (isIncomeCategory !== undefined) {
                                        setValue(`splits.${index}.isExpense`, !isIncomeCategory)
                                    }
                                }
                            }}
                            value={f.value ? f.value.toString() : ""}
                        >
                            <SelectTrigger className="w-full overflow-hidden">
                                <SelectValue placeholder="Wybierz kategorię">
                                    {(() => {
                                        if (!f.value) return "Kategoria"
                                        const selectedCat = categoriesQuery.data?.find(c => c.subcategories.some(s => s.id === f.value))
                                        return selectedCat
                                            ? `${selectedCat.name} / ${selectedCat.subcategories.find(s => s.id === f.value)!.name}`
                                            : "Kategoria"
                                    })()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {categoriesQuery.data?.map(category => (
                                    <SelectGroup key={category.id}>
                                        <SelectLabel>{category.name}</SelectLabel>
                                        {category.subcategories.map(sub => (
                                            <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.splits?.[index]?.subcategoryId && (
                    <span className="text-red-500 text-xs">{errors.splits[index].subcategoryId?.message}</span>
                )}
            </div>

            <div className="grid gap-2">
                <Label>Tagi</Label>
                <Controller
                    control={control}
                    name={`splits.${index}.tags`}
                    render={({field: f}) => (
                        <TagsInput options={tagsQuery.data || []} value={f.value} onChange={f.onChange}/>
                    )}
                />
            </div>
        </div>
    )
})
