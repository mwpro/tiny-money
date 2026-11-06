import {format} from "date-fns";
import type {Category, Subcategory} from "@/api/ApiTypes.ts";
import {dateFormat} from "@/lib/utils.ts";

export function isSubcategoryHiddenOn(subcategory: Subcategory, date: Date | string): boolean {
    if (!subcategory.hiddenFrom) return false;
    const day = typeof date === "string" ? date.slice(0, 10) : format(date, dateFormat);
    return subcategory.hiddenFrom.slice(0, 10) <= day;
}

// Subcategories hidden as of the given date (e.g. the transaction date) are left out of pickers,
// except the one currently selected, so existing values still display.
export function visibleCategories(categories: Category[], selectedSubcategoryId?: number | null, date: Date | string = new Date()): Category[] {
    return categories
        .map(c => ({...c, subcategories: c.subcategories.filter(s => !isSubcategoryHiddenOn(s, date) || s.id === selectedSubcategoryId)}))
        .filter((c, i) => c.subcategories.length > 0 || categories[i].subcategories.length === 0);
}
