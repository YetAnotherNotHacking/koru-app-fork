from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

# Create a router for item-related endpoints
router = APIRouter(
    prefix="/items",  # All routes will be prefixed with /items
    tags=["items"],  # This groups endpoints in the OpenAPI docs
)


# Pydantic models
class Item(BaseModel):
    id: int
    name: str
    description: str | None = None
    price: float
    category: str


class ItemCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
    category: str


# In-memory storage for demo
items_db: list[Item] = [
    Item(
        id=1,
        name="Laptop",
        description="Gaming laptop",
        price=999.99,
        category="Electronics",
    ),
    Item(
        id=2,
        name="Coffee Mug",
        description="Ceramic mug",
        price=12.50,
        category="Kitchen",
    ),
    Item(
        id=3,
        name="Book",
        description="Programming guide",
        price=29.99,
        category="Education",
    ),
]
next_item_id = 4


@router.get("/", response_model=list[Item])
async def get_items(
    category: str | None = Query(None, description="Filter by category"),
    min_price: float | None = Query(None, description="Minimum price filter"),
    max_price: float | None = Query(None, description="Maximum price filter"),
):
    """Get all items with optional filtering"""
    filtered_items = items_db

    # Apply filters if provided
    if category:
        filtered_items = [
            item for item in filtered_items if item.category.lower() == category.lower()
        ]

    if min_price is not None:
        filtered_items = [item for item in filtered_items if item.price >= min_price]

    if max_price is not None:
        filtered_items = [item for item in filtered_items if item.price <= max_price]

    return filtered_items


@router.get("/{item_id}", response_model=Item)
async def get_item(item_id: int):
    """Get a specific item by ID"""
    item = next((item for item in items_db if item.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/", response_model=Item)
async def create_item(item_data: ItemCreate):
    """Create a new item"""
    global next_item_id

    new_item = Item(
        id=next_item_id,
        name=item_data.name,
        description=item_data.description,
        price=item_data.price,
        category=item_data.category,
    )
    items_db.append(new_item)
    next_item_id += 1
    return new_item


@router.get("/categories/list")
async def get_categories():
    """Get all unique categories"""
    categories = list({item.category for item in items_db})
    return {"categories": sorted(categories)}


@router.get("/search/{search_term}")
async def search_items(search_term: str):
    """Search items by name or description"""
    matching_items = [
        item
        for item in items_db
        if search_term.lower() in item.name.lower()
        or (item.description and search_term.lower() in item.description.lower())
    ]
    return {"search_term": search_term, "results": matching_items}
