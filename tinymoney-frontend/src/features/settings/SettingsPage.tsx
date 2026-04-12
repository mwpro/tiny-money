import {CategoriesSettingsSection} from "@/features/settings/categories/CategoriesSettingsSection.tsx"
import {ApiKeysSettings} from "@/features/settings/ApiKeysSettings.tsx"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx"
import {useSearchParams, Navigate} from "react-router"
import {TagsPage} from "@/features/tags/TagsPage.tsx"
import {VendorsPage} from "@/features/vendors/VendorsPage.tsx"

const VALID_TABS = ["categories", "api-keys", "tags", "vendors"] as const
type TabValue = typeof VALID_TABS[number]

export function SettingsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabParam = searchParams.get("tab")

    if (!VALID_TABS.includes(tabParam as TabValue)) {
        return <Navigate to="/settings?tab=categories" replace />
    }

    const activeTab = tabParam as TabValue

    function handleTabChange(value: string) {
        setSearchParams({tab: value}, {replace: true})
    }

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Ustawienia</h1>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="categories">Kategorie</TabsTrigger>
                    <TabsTrigger value="api-keys">Klucze API</TabsTrigger>
                    <TabsTrigger value="tags">Tagi</TabsTrigger>
                    <TabsTrigger value="vendors">Sprzedawcy</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="mt-4">
                    <CategoriesSettingsSection />
                </TabsContent>

                <TabsContent value="api-keys" className="mt-4">
                    <ApiKeysSettings />
                </TabsContent>

                <TabsContent value="tags" className="mt-4">
                    <TagsPage />
                </TabsContent>

                <TabsContent value="vendors" className="mt-4">
                    <VendorsPage />
                </TabsContent>
            </Tabs>
        </div>
    )
}
