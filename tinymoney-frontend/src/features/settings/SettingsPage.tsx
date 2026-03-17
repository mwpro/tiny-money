import {CategoriesSettingsSection} from "@/features/settings/categories/CategoriesSettingsSection.tsx"
import {ApiKeysSettingsSection} from "@/features/settings/ApiKeysSettingsSection.tsx"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx"

export function SettingsPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Ustawienia</h1>

            <Tabs defaultValue="categories">
                <TabsList>
                    <TabsTrigger value="categories">Kategorie</TabsTrigger>
                    <TabsTrigger value="api-keys">Klucze API</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="mt-4">
                    <CategoriesSettingsSection />
                </TabsContent>

                <TabsContent value="api-keys" className="mt-4">
                    <ApiKeysSettingsSection />
                </TabsContent>
            </Tabs>
        </div>
    )
}
