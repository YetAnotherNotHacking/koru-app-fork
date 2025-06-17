from fastapi import FastAPI
from fastapi.routing import APIRoute

from api.core.config import settings
from api.schemas.base import MessageResponse

from .middleware.cloudflare_ip import CloudflareMiddleware
from .routers import auth, import_router, transaction, waitlist


def custom_generate_unique_id(route: APIRoute) -> str:
    if route.operation_id:
        return route.operation_id

    name_parts = route.name.split("_")
    return name_parts[0] + "".join(part.capitalize() for part in name_parts[1:])


app = FastAPI(
    generate_unique_id_function=custom_generate_unique_id,
    root_path="/api",
)

app.add_middleware(CloudflareMiddleware)

app.include_router(auth.router)
app.include_router(waitlist.router)
app.include_router(import_router.router)
app.include_router(transaction.router)


@app.get("/hcaptcha/sitekey")
async def get_hcaptcha_sitekey() -> MessageResponse:
    return MessageResponse(message=settings.HCAPTCHA_SITEKEY)
