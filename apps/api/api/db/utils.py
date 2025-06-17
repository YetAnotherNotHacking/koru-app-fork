from typing import Any

from sqlalchemy import tuple_
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import Session


def upsert_db(
    values: list[Any],
    session: Session,
    model: Any,
    update_whitelist: list[str],
    index_elements: list[Any],
    update_override: dict[str, Any] | None = None,
) -> None:
    if update_override is None:
        update_override = {}

    insert_stmt = insert(model).values(values)

    update_columns = {
        **{col: getattr(insert_stmt.excluded, col) for col in update_whitelist},
        **update_override,
    }

    where_tuple_existing = tuple_(*[getattr(model, col) for col in update_whitelist])
    where_tuple_new = tuple_(
        *[getattr(insert_stmt.excluded, col) for col in update_whitelist]
    )

    insert_stmt = insert_stmt.on_conflict_do_update(
        index_elements=index_elements,
        set_=update_columns,
        where=where_tuple_existing.is_distinct_from(where_tuple_new),
    )

    session.execute(insert_stmt)
    session.commit()
