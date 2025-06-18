import requests

from api.core.config import settings
from api.core.exceptions import GoCardlessAPIError
from api.schemas.gocardless import (
    AccountDetails,
    AccountDetailsResponse,
    CreateRequisitionResponse,
    GetRequisitionResponse,
    Institution,
    InstitutionsResponse,
    RefreshResponse,
    TokenResponse,
    TransactionsContainer,
    TransactionsResponse,
)

from .redis import redis_client

GOCARDLESS_URL = "https://bankaccountdata.gocardless.com/api/v2"
TOKEN_EXPIRY_BUFFER = 60


def get_token() -> str:
    token = redis_client.get(f"{settings.REDIS_PREFIX}gocardless:token")

    if token:
        assert isinstance(token, str)

        return token

    refresh_token = redis_client.get(f"{settings.REDIS_PREFIX}gocardless:refresh_token")

    if refresh_token:
        response = requests.post(
            f"{GOCARDLESS_URL}/token/refresh/",
            data={
                "refresh": refresh_token,
            },
        )

        if not response.ok:
            raise GoCardlessAPIError(
                "refresh GoCardless token",
                response.text,
                status_code=response.status_code,
            )

        token = RefreshResponse.model_validate_json(response.text)
        redis_client.set(
            f"{settings.REDIS_PREFIX}gocardless:token",
            token.access,
            token.access_expires - TOKEN_EXPIRY_BUFFER,
        )
        return token.access

    response = requests.post(
        f"{GOCARDLESS_URL}/token/new/",
        data={
            "secret_id": settings.GOCARDLESS_SECRET_ID,
            "secret_key": settings.GOCARDLESS_SECRET_KEY,
        },
    )

    if not response.ok:
        raise GoCardlessAPIError(
            "create GoCardless token",
            response.text,
            status_code=response.status_code,
        )

    token = TokenResponse.model_validate_json(response.text)
    redis_client.set(
        f"{settings.REDIS_PREFIX}gocardless:token",
        token.access,
        token.access_expires - TOKEN_EXPIRY_BUFFER,
    )

    redis_client.set(
        f"{settings.REDIS_PREFIX}gocardless:refresh_token",
        token.refresh,
        token.refresh_expires - TOKEN_EXPIRY_BUFFER,
    )

    return token.access


def get_institutions(country: str | None = None) -> list[Institution]:
    value = redis_client.get(
        f"{settings.REDIS_PREFIX}gocardless:institutions"
        f"{f':{country}' if country else ''}"
    )

    if value:
        return InstitutionsResponse.validate_json(value)

    token = get_token()
    response = requests.get(
        f"{GOCARDLESS_URL}/institutions/",
        headers={"Authorization": f"Bearer {token}"},
        params={"country": country} if country else None,
    )

    if not response.ok:
        raise GoCardlessAPIError(
            "fetch institutions",
            response.text,
            status_code=response.status_code,
        )

    institutions = InstitutionsResponse.validate_json(response.text)
    redis_client.set(
        f"{settings.REDIS_PREFIX}gocardless:institutions"
        f"{f':{country}' if country else ''}",
        InstitutionsResponse.dump_json(institutions),
        60 * 60 * 24,
    )
    return institutions


def create_requisition(
    institution_id: str, redirect_url: str
) -> CreateRequisitionResponse:
    token = get_token()
    response = requests.post(
        f"{GOCARDLESS_URL}/requisitions/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "institution_id": institution_id,
            "redirect": redirect_url,
        },
    )

    if not response.ok:
        raise GoCardlessAPIError(
            "create requisition",
            response.text,
            status_code=response.status_code,
        )

    return CreateRequisitionResponse.model_validate_json(response.text)


def get_accounts(requisition_id: str) -> list[str]:
    token = get_token()
    response = requests.get(
        f"{GOCARDLESS_URL}/requisitions/{requisition_id}/",
        headers={"Authorization": f"Bearer {token}"},
    )

    if not response.ok:
        raise GoCardlessAPIError(
            "fetch accounts",
            response.text,
            status_code=response.status_code,
        )

    return GetRequisitionResponse.model_validate_json(response.text).accounts


def get_account_details(account_id: str) -> AccountDetails:
    token = get_token()
    response = requests.get(
        f"{GOCARDLESS_URL}/accounts/{account_id}/details/",
        headers={"Authorization": f"Bearer {token}"},
    )

    if not response.ok:
        raise GoCardlessAPIError(
            "fetch account details",
            response.text,
            status_code=response.status_code,
        )

    return AccountDetailsResponse.model_validate_json(response.text).account


def get_transactions(account_id: str) -> TransactionsContainer:
    token = get_token()
    response = requests.get(
        f"{GOCARDLESS_URL}/accounts/{account_id}/transactions/",
        headers={"Authorization": f"Bearer {token}"},
    )

    if not response.ok:
        raise GoCardlessAPIError(
            "fetch transactions",
            response.text,
            status_code=response.status_code,
        )

    return TransactionsResponse.model_validate_json(response.text).transactions
