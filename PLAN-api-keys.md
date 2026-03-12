# Plan: Apple Shortcuts API Key Integration

## Context

The app needs to support import via Apple Shortcuts (or any automation tool) without requiring a full Auth0 JWT flow. Users will generate named API keys in a Settings page, then use those keys in Shortcuts to call `POST /api/transactions/import/file` directly. Keys are per-user (userId stored on the key), multi-user safe, no expiry.

---

## Branch

`claude/apple-shortcuts-api-integration-2UFSQ`

---

## Backend Changes

### 1. Database — new `api_key` table

Add to `/home/user/tiny-money/scripts/dbschema.sql`:

```sql
CREATE TABLE api_key (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key_hash CHAR(64) NOT NULL,   -- SHA-256 hex of the raw key
    key_prefix CHAR(8) NOT NULL,  -- first 8 chars of raw key, for display
    user_id VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME NULL,
    INDEX idx_key_hash (key_hash),
    INDEX idx_user_id (user_id)
);
```

Also run this SQL manually (or note it in a comment) since there's no migration runner — raw SQL scripts only.

---

### 2. New module: `ApiKeys/`

**File: `backend/MW.TinyMoney.Api/ApiKeys/IApiKeyStore.cs`**

```csharp
public record ApiKeySummary(int Id, string Name, string KeyPrefix, DateTime CreatedAt, DateTime? LastUsedAt);
public record ApiKeyRecord(int Id, string UserId);

public interface IApiKeyStore
{
    Task<ApiKeyRecord?> FindByHash(string keyHash);
    Task<IEnumerable<ApiKeySummary>> GetByUser(string userId);
    Task<int> Create(string name, string keyHash, string keyPrefix, string userId);
    Task Delete(int id, string userId);
    Task UpdateLastUsed(int id);
}
```

**MySqlApiKeyStore** in same file — follows existing pattern (MySqlConnectionFactory + Dapper). Use parameterized SQL constants. Register in Program.cs: `services.AddTransient<IApiKeyStore, MySqlApiKeyStore>()`.

---

### 3. Custom Authentication Scheme

**File: `backend/MW.TinyMoney.Api/ApiKeys/ApiKeyAuthenticationHandler.cs`**

- Inherits `AuthenticationHandler<AuthenticationSchemeOptions>`
- Reads `Authorization: ApiKey <rawKey>` header
- Computes `SHA256(rawKey)` as hex string
- Calls `IApiKeyStore.FindByHash(hash)`
- On success: builds `ClaimsPrincipal` with claims:
  - `ClaimTypes.NameIdentifier` = `record.UserId`
  - `"sub"` = `record.UserId`
- Calls `IApiKeyStore.UpdateLastUsed(record.Id)` (fire-and-forget, don't await in hot path — use `_ = Task.Run(...)`)
- On failure: returns `AuthenticateResult.NoResult()` (not Fail, to allow JWT fallback)

---

### 4. Program.cs changes

```csharp
// In ConfigureServices, extend AddAuthentication chain:
services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => { /* existing config */ })
.AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>("ApiKey", _ => { });
```

Register store: `services.AddTransient<IApiKeyStore, MySqlApiKeyStore>();`

---

### 5. Import Controller — accept both schemes

**File: `backend/MW.TinyMoney.Api/Import/ImportController.cs`**

Change class-level `[Authorize]` to accept both schemes:

```csharp
[Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},ApiKey")]
```

---

### 6. ApiKey Controller

**File: `backend/MW.TinyMoney.Api/ApiKeys/ApiKeyController.cs`**

Route: `/api/apikeys` — JWT Bearer only (`[Authorize]` = default scheme)

```
GET    /api/apikeys        → list user's keys (ApiKeySummary[])
POST   /api/apikeys        → generate new key
DELETE /api/apikeys/{id}   → revoke key
```

**POST response** (one-time, raw key shown only here):
```json
{ "id": 1, "name": "My Shortcut", "keyPrefix": "tm_abc123", "rawKey": "tm_abc123..." }
```

**Key generation logic:**
1. Generate: `"tm_" + Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))` (URL-safe, ~44 chars)
2. Compute SHA-256 hash
3. Extract prefix = first 8 chars
4. Store hash + prefix; return raw key

**DELETE** must verify `userId` matches (pass sub to `IApiKeyStore.Delete(id, sub)` — SQL: `WHERE id=@id AND user_id=@userId`).

**Getting userId in controller:**
```csharp
private string UserId => User.FindFirstValue("sub")
    ?? User.FindFirstValue(ClaimTypes.NameIdentifier)!;
```

---

### 7. Unit Tests

**File: `backend/MW.TinyMoney.UnitTests/ApiKeys/ApiKeyAuthenticationHandlerTests.cs`**

The project uses **hand-written stubs** — no Moq/NSubstitute. Follow the pattern from `Helpers/VendorStoreStub.cs`:

**`Helpers/ApiKeyStoreStub.cs`** (new file):
```csharp
public class ApiKeyStoreStub : IApiKeyStore
{
    public ApiKeyRecord? FindByHashResult { get; set; }
    public int UpdateLastUsedCalledWithId { get; private set; }

    public Task<ApiKeyRecord?> FindByHash(string keyHash)
        => Task.FromResult(FindByHashResult);

    public Task UpdateLastUsed(int id)
    {
        UpdateLastUsedCalledWithId = id;
        return Task.CompletedTask;
    }

    public Task<IEnumerable<ApiKeySummary>> GetByUser(string userId) => throw new NotImplementedException();
    public Task<int> Create(string name, string keyHash, string keyPrefix, string userId) => throw new NotImplementedException();
    public Task Delete(int id, string userId) => throw new NotImplementedException();
}
```

Test cases:
- Missing `Authorization` header → `NoResult`
- Wrong header scheme (e.g. `Bearer`) → `NoResult`
- Unknown key hash (store returns null) → `NoResult`
- Valid key → `Success`, ClaimsPrincipal has correct `sub` / `NameIdentifier` claims
- Valid key → `UpdateLastUsed` called with correct id

---

## Frontend Changes

### 1. Types — `tinymoney-frontend/src/api/ApiTypes.ts`

Add:
```typescript
export type ApiKeySummary = {
    id: number;
    name: string;
    keyPrefix: string;
    createdAt: string;
    lastUsedAt: string | null;
};

export type CreateApiKeyResponse = {
    id: number;
    name: string;
    keyPrefix: string;
    rawKey: string;
};

export type CreateApiKeyRequest = {
    name: string;
};
```

---

### 2. API Client — `tinymoney-frontend/src/api/clients/ApiKeysClient.ts`

Follow pattern from existing clients (e.g. `TagsClient`). Extend `ApiBase`.

```typescript
export class ApiKeysClient extends ApiBase {
    getApiKeys(): Promise<ApiKeySummary[]> { ... }
    createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> { ... }
    deleteApiKey(id: number): Promise<void> { ... }
}
```

---

### 3. Wire up in ApiClient — `tinymoney-frontend/src/api/ApiClient.ts`

Add `apiKeysClient: ApiKeysClient` to the `ApiClient` type and provide in `ApiClientImpl.ts` and `ApiClientProvider.tsx`.

---

### 4. Settings Page — `tinymoney-frontend/src/features/settings/SettingsPage.tsx`

UI sections:
- **Heading**: "Settings"
- **API Keys subsection**:
  - Table/list: columns = Name, Prefix, Created, Last Used, [Delete button]
  - "Generate new key" button → opens dialog
  - Dialog: React Hook Form with single `name` text input, submit calls mutation
  - After success: show `rawKey` in a read-only input with copy button and warning "This key will only be shown once"
  - Delete: confirm then mutation

Follow pattern from `TagEditorDialog.tsx` for the form dialog.

---

### 5. Routing — `tinymoney-frontend/src/App.tsx`

Add route: `<Route path="/settings" element={<SettingsPage />} />`

---

### 6. Navigation — `tinymoney-frontend/src/components/Layout.tsx`

Add "Settings" link to:
- Desktop nav (around line 51-94, same Button+Link pattern as other nav items)
- Mobile "Więcej" (More) menu (around line 168-172)

---

## Verification

1. **Backend build**: `cd backend && dotnet build` — must succeed with no errors
2. **Backend tests**: `cd backend && dotnet test` — new ApiKey handler tests must pass
3. **Frontend build**: `cd tinymoney-frontend && npm run build` — must succeed
4. **Manual test flow**:
   - Log in via browser → go to Settings → generate a key → copy raw key
   - Use `curl -H "Authorization: ApiKey <rawKey>" -F "file=@statement.csv" -F "fileType=ING" http://localhost:52386/api/transactions/import/file`
   - Should return 201 with import results
   - Check "Last Used" updates in settings UI
   - Delete a key → curl with deleted key should get 401

---

## Key Files

| File | Action |
|------|--------|
| `scripts/dbschema.sql` | Add `api_key` table |
| `backend/.../ApiKeys/IApiKeyStore.cs` | New — interface + MySql impl |
| `backend/.../ApiKeys/ApiKeyAuthenticationHandler.cs` | New — auth scheme |
| `backend/.../ApiKeys/ApiKeyController.cs` | New — CRUD endpoints |
| `backend/.../Import/ImportController.cs` | Modify — accept ApiKey scheme |
| `backend/.../Program.cs` | Modify — register scheme + store |
| `backend/.../UnitTests/ApiKeys/...Tests.cs` | New — handler unit tests |
| `tinymoney-frontend/src/api/ApiTypes.ts` | Add API key types |
| `tinymoney-frontend/src/api/clients/ApiKeysClient.ts` | New — HTTP client |
| `tinymoney-frontend/src/api/ApiClient.ts` | Add apiKeysClient |
| `tinymoney-frontend/src/features/settings/SettingsPage.tsx` | New — settings page |
| `tinymoney-frontend/src/App.tsx` | Add /settings route |
| `tinymoney-frontend/src/components/Layout.tsx` | Add Settings nav link |
