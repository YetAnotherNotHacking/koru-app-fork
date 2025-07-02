from fastapi import FastAPI
from fastapi.routing import APIRoute

# Import our routers
from .routers import items, users


def custom_generate_unique_id(route: APIRoute) -> str:
    """Generate unique IDs for OpenAPI documentation"""
    if route.operation_id:
        return route.operation_id

    name_parts = route.name.split("_")
    return name_parts[0] + "".join(part.capitalize() for part in name_parts[1:])


# Create the FastAPI app
app = FastAPI(
    title="SpaceTalk API",
    description="Backend for the SpaceTalk application",
    version="0.1.0",
    generate_unique_id_function=custom_generate_unique_id,
    root_path="/api",  # This means all routes will be prefixed with /api
)

# Include routers
app.include_router(users.router)
app.include_router(items.router)


# Basic health check endpoint
@app.get("/")
async def root():
    """Root endpoint - returns basic API info"""
    return {
        "message": "Welcome to SpaceTalk API!",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}
