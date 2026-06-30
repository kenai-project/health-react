# Dummy data seeding (backend)

## Seed demo data (recommended)
Runs a full reset of the SQLite DB (`backend/health.db`) and inserts:
- Admin user (`admin` / `admin123`)
- Staff users (`staff1..N` / `staff123`)
- Normal users (`user1..N` / `user123`)
- Staff assignments
- Multiple health records across many dates

### Command
```bash
cd d:/codeing/python/health-react/backend
.[1m.venv\Scripts\activate[0m
python -c "import runpy; runpy.run_path('db/seed_reset_dummy_data.py', run_name='__main__')"
```

## Alternative (non-reset)
`python seed_dummy_data.py` seeds only if the DB has no health records (guarded). 

## Default login for admin
- username: `admin`
- password: `admin123`

