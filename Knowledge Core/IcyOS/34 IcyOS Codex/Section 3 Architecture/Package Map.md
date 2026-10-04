# 📦 Package Map
- `@icyos/shared`: types the app uses (priorities, statuses, the API envelope)
- `@icyos/learning`
- `@icyos/decision`
- `@icyos/ai`

`@icyos/database` and `@icyos/services` were removed in October 2026. They held stub repositories and services that returned made-up data. The app reads and writes Supabase directly, through the functions in `supabase/migrations/`.
