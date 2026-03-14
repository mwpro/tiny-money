import {z} from "zod";

export const transactionSchema = z.object({
    amount: z.coerce.number().refine((val) => val > 0, "Kwota musi być większa od 0"),
    isExpense: z.boolean(),
    transactionDate: z.iso.date(),//.string().refine((val) => !isNaN(Date.parse(val)), "Nieprawidłowa data"),
    description: z.string().min(3, "Opis musi mieć min. 3 znaki").optional().or(z.literal('')),
    subcategoryId: z.coerce.number<number>().min(1, "Kategoria jest wymagana"),
    vendor: z.object({
        id: z.number().optional(),
        name: z.string().min(1, "Sprzedawca wymagany")
    }),
    tags: z.array(z.object({
        id: z.number().optional(),
        name: z.string()
    }))
})