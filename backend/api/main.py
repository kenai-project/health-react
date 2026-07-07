from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.auth import router as auth_router
from api.routes.records import router as records_router
from api.routes.admin import router as admin_router
from api.routes.admin_analytics import router as admin_analytics_router
from api.routes.exports import router as exports_router
from db.migrate import create_tables_if_needed
from db.session import get_db_session

from auth.bootstrap import bootstrap_admin_if_needed



def create_app() -> FastAPI:
    app = FastAPI(title="Health API", version="0.1.0")

    # Create database tables on startup
    create_tables_if_needed()

    # Ensure admin user exists (safe/idempotent)
    bootstrap_admin_if_needed(get_db_session)


    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )


    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    app.include_router(records_router, prefix="/records", tags=["records"])
    app.include_router(admin_router, prefix="/admin", tags=["admin"])
    app.include_router(
        admin_analytics_router,
        prefix="/admin",
        tags=["admin-analytics"],
    )
    app.include_router(exports_router, prefix="/exports", tags=["exports"])

    return app


app = create_app()