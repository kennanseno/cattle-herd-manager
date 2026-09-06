# Schema Documentation & Synchronization Guide

## Overview

This document defines the canonical schema for all data tables in cattle-herd-manager and ensures consistency between:
- **TypeScript type definitions** (`types/index.ts`)
- **Local CSV templates** (`data/*.csv`)
- **Google Sheets integration** (`lib/storage/google.ts`)

Image files are not stored in table cells. The local backend stores them under
`data/images/`; the Google backend stores them in the folder configured by
`GOOGLE_DRIVE_FOLDER_ID` through the OAuth Drive client.

## Table Schemas

### Cattle

**Purpose:** Core cattle records with pedigree, measurements, and status tracking.

| Column | Type | Optional | Notes |
|--------|------|----------|-------|
| tagNumber | string | No | Unique identifier for the animal |
| nickname | string | No | Display name |
| dateOfBirth | string | No | ISO date (YYYY-MM-DD) |
| sex | string | No | 'male' \| 'female' |
| breed | string | No | Breed type |
| sireTagNumber | string | No | Father's tag number |
| damTagNumber | string | No | Mother's tag number |
| birthWeight | string | No | Weight at birth (numeric string) |
| weaningWeight | string | No | Weight at weaning (numeric string) |
| status | string | No | 'active' \| 'sold' \| 'deceased' \| 'archived' |
| imagePath | string | No | Primary image path (legacy, deprecated) |
| photos | string | **Yes** | Comma-separated list of image paths (newer format) |
| notes | string | **Yes** | Free-text notes and observations |
| createdAt | string | No | ISO timestamp |
| updatedAt | string | No | ISO timestamp |

**CSV Column Order:**
```
tagNumber,nickname,dateOfBirth,sireTagNumber,damTagNumber,sex,breed,birthWeight,weaningWeight,status,notes,imagePath,photos,createdAt,updatedAt
```

---

### BreedingRecord

**Purpose:** Track breeding events and calving outcomes.

| Column | Type | Optional | Notes |
|--------|------|----------|-------|
| id | string | No | UUID |
| cowTagNumber | string | No | Tag of breeding female |
| sireTagNumber | string | No | Tag of breeding male |
| breedDate | string | No | ISO date when breeding occurred or started |
| breedDateTo | string | **Yes** | ISO date for end of breeding window (when exact date unknown) |
| possibleCalvingDate | string | No | Expected calving date (ISO format) |
| actualCalvingDate | string | No | Actual calving date (ISO format) |
| calfTagNumber | string | No | Tag of resulting calf |
| status | string | No | 'pending' \| 'calved' \| 'failed' |
| notes | string | No | Free-text notes |
| createdAt | string | No | ISO timestamp |
| updatedAt | string | No | ISO timestamp |

**CSV Column Order:**
```
id,cowTagNumber,sireTagNumber,breedDate,breedDateTo,possibleCalvingDate,actualCalvingDate,calfTagNumber,status,notes,createdAt,updatedAt
```

---

### HealthRecord

**Purpose:** Vaccination and health intervention records.

| Column | Type | Optional | Notes |
|--------|------|----------|-------|
| id | string | No | UUID |
| recordDate | string | No | Date of health event (ISO format) |
| vaccinationType | string | No | Type of vaccine or treatment |
| tagNumbers | string | No | Comma-separated tags or "all" for herd-wide treatment |
| veterinarian | string | No | Veterinarian name |
| cost | string | No | Cost in dollars (numeric string) |
| notes | string | No | Free-text notes |
| createdAt | string | No | ISO timestamp |
| updatedAt | string | No | ISO timestamp |

**CSV Column Order:**
```
id,recordDate,vaccinationType,tagNumbers,veterinarian,cost,notes,createdAt,updatedAt
```

---

### FinanceRecord

**Purpose:** Income and expense tracking with optional date ranges.

| Column | Type | Optional | Notes |
|--------|------|----------|-------|
| id | string | No | UUID |
| date | string | No | Transaction date (ISO format) or start date for ranges |
| dateTo | string | **Yes** | End date for multi-day transactions (ISO format) |
| type | string | No | 'income' \| 'expense' |
| category | string | No | Expense/income category |
| amount | string | No | Amount in dollars (numeric string) |
| description | string | No | Brief description |
| notes | string | No | Free-text notes |
| relatedTagNumber | string | No | Associated cattle tag (optional, empty if N/A) |
| createdAt | string | No | ISO timestamp |
| updatedAt | string | No | ISO timestamp |

**CSV Column Order:**
```
id,date,dateTo,type,category,amount,description,notes,relatedTagNumber,createdAt,updatedAt
```

---

### PdfExportRecord

**Purpose:** Audit trail of generated PDF certificates.

| Column | Type | Optional | Notes |
|--------|------|----------|-------|
| id | string | No | UUID printed on certificate |
| tagNumber | string | No | Cattle tag certificate was generated for |
| generatedAt | string | No | ISO timestamp |
| ownerName | string | No | New owner named on the certificate |
| notes | string | No | Free-text context for export |

**CSV Column Order:**
```
id,tagNumber,generatedAt,ownerName,notes
```

---

### FarmSettings

**Purpose:** Configuration and metadata stored in JSON locally or as key/value
rows in the Google Sheets `settings` tab.

| Field | Type | Optional | Notes |
|-------|------|----------|-------|
| farmName | string | No | Farm/ranch name |
| ownerName | string | No | Owner name |
| address | string | No | Physical address |
| phone | string | No | Contact phone |
| email | string | No | Contact email |
| website | string | No | Farm website URL |
| logoPath | string | No | Path to logo image |

**Storage:** `data/settings.json` locally; `settings` tab in Google Sheets when
the Google backend is active.

---

## Synchronization Rules

### When adding new features:

1. **Define the type** in `types/index.ts`
2. **Add column to CSV template** in `data/*.csv` (run schema validator)
3. **Update Google Sheets** integration (sheets auto-create with headers from data)
4. **Update this document** with the new column definition

### Schema Validation

Run the validation script to check consistency:

```bash
npm run validate:schema
```

This will:
- Compare TypeScript types against CSV headers
- Identify missing or extra columns
- Report optional vs required field mismatches
- Exit with code 1 if inconsistencies found

---

## Known Gaps (As of 2026-08-30)

| Table | Missing Column | Type | Impact |
|-------|-----------------|------|--------|
| cattle | photos | optional | Older exports may not contain multi-photo data |
| breeding | breedDateTo | optional | Older exports may not contain breeding date ranges |
| finances | dateTo | optional | Older exports may not contain multi-day transaction ranges |

These gaps do NOT cause crashes but may lose data when importing older backups.

---

## Migration Path

To add a new column:

1. Add to TypeScript interface in `types/index.ts`
2. Update CSV file headers with existing templates
3. Update this doc
4. Run `npm run validate:schema` to confirm

For existing data, new optional columns will be empty in old records.
