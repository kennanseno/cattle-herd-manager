# Database schema

## Current storage

Live application data is stored in Supabase Postgres. Every table row is
scoped to a `farm_id`; a farm's `owner_id` references the Supabase Auth user.
Row-level security permits authenticated users to access only the farm they
own. Each account is provisioned one farm.

Apply versioned SQL migrations from `supabase/migrations/` in filename order.
The current schema and important fields are:

| Table | Primary key | Fields |
| --- | --- | --- |
| `farms` | `id` | `owner_id`, `name`, `created_at`, `updated_at` |
| `cattle` | `(farm_id, tag_number)` | `nickname`, `date_of_birth`, sire/dam tags, `sex`, `breed`, birth/weaning weights, `notes`, `status`, timestamps |
| `breeding` | `(farm_id, id)` | cow/sire tags, breed date range, expected/actual calving dates, calf tag, `notes`, `status`, timestamps |
| `health` | `(farm_id, id)` | `record_date`, treatment/vaccination, tag numbers, veterinarian, cost, `notes`, timestamps |
| `finances` | `(farm_id, id)` | date range, `type`, `category`, `amount`, description, notes, related cattle tag, timestamps |
| `farm_settings` | `farm_id` | owner name, address, phone, email, website |
| `pdf_exports` | `(farm_id, id)` | cattle tag, generated timestamp, named owner, notes, sample-copy flag |

Some initial schema migrations retain legacy image columns for compatibility,
but image upload/download is no longer supported and the application does not
use those fields.

The `delete_own_farm` function is also created by a versioned migration.

Use versioned Supabase migrations to make database schema changes, and update
the record mappings in `lib/data.ts` and this document when changing
application fields.
