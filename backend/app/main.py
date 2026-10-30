
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.packages import router as packages_router
from app.routers.orders import router as orders_router
from app.routers.coverage import router as coverage_router
from app.routers.callbacks import router as callbacks_router
from app.routers.auth import router as auth_router
from app.routers.agents import router as agents_router
from app.routers.dashboard import router as dashboard_router
from app.routers.future_leads import router as future_leads_router

app = FastAPI(
    title="ISP Sales Management API",
    description="ISP packages, customer orders and chatbot API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(packages_router)
app.include_router(orders_router)
app.include_router(coverage_router)
app.include_router(callbacks_router)
app.include_router(auth_router)
app.include_router(agents_router)
app.include_router(dashboard_router)
app.include_router(future_leads_router)


@app.get("/")
def home():
    return {"message": "ISP Sales Management API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
