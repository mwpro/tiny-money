import type {TransactionsClient} from './clients/TransactionsClient'
import type {TagsClient} from './clients/TagsClient'
import type {VendorsClient} from './clients/VendorsClient'
import type {CategoriesClient} from './clients/CategoriesClient'
import type {BudgetClient} from './clients/BudgetClient'
import type {ReportsClient} from './clients/ReportsClient'
import type {ApiKeysClient} from './clients/ApiKeysClient'
import type {PlansClient} from './clients/PlansClient'
import type {SavingsClient} from './clients/SavingsClient'

export type ApiClient = {
    transactionsClient: TransactionsClient
    tagsClient: TagsClient
    vendorsClient: VendorsClient
    categoriesClient: CategoriesClient
    budgetClient: BudgetClient
    reportsClient: ReportsClient
    apiKeysClient: ApiKeysClient
    plansClient: PlansClient
    savingsClient: SavingsClient
}
