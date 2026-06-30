FastAPI backend for Health Dashboard.

Endpoints (initial migration):
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me
- GET /records/ (scoped list)
- POST /records/ (create)
- GET /admin/users
- POST /admin/users
- POST /admin/assign
- GET /admin/staff/assigned

Auth:
- JWT access + refresh (stateless; refresh generates new access/refresh)

