from pydantic import BaseModel, TypeAdapter


class TokenResponse(BaseModel):
    access: str
    access_expires: int
    refresh: str
    refresh_expires: int


class RefreshResponse(BaseModel):
    access: str
    access_expires: int


class Institution(BaseModel):
    id: str
    name: str
    bic: str
    transaction_total_days: int
    countries: list[str]
    logo: str
    supported_features: list[str] | None = None
    identification_codes: list[str] | None = None
    max_access_valid_for_days: int


InstitutionsResponse = TypeAdapter(list[Institution])


class CreateRequisitionResponse(BaseModel):
    id: str
    link: str


class GetRequisitionResponse(BaseModel):
    created: str
    status: str
    institution_id: str
    agreement: str
    reference: str
    accounts: list[str]
    link: str


class AccountDetails(BaseModel):
    bban: str | None = None
    bic: str | None = None
    cashAccountType: str | None = None
    currency: str
    displayName: str | None = None
    iban: str | None = None
    name: str | None = None
    ownerName: str | None = None
    scan: str | None = None
    usage: str | None = None


class AccountDetailsResponse(BaseModel):
    account: AccountDetails


class TransactionAmount(BaseModel):
    currency: str
    amount: float


class AccountReference(BaseModel):
    iban: str | None = None
    bban: str | None = None


class CurrencyExchangeInstructedAmount(BaseModel):
    amount: float
    currency: str


class CurrencyExchange(BaseModel):
    instructedAmount: CurrencyExchangeInstructedAmount
    sourceCurrency: str
    exchangeRate: float
    targetCurrency: str


class Transaction(BaseModel):
    bookingDate: str | None = None
    bookingDateTime: str | None = None
    valueDate: str | None = None
    valueDateTime: str | None = None
    transactionAmount: TransactionAmount
    creditorName: str | None = None
    creditorAccount: AccountReference | None = None
    debitorName: str | None = None
    debitorAccount: AccountReference | None = None
    transactionId: str | None = None
    internalTransactionId: str | None = None
    currencyExchange: CurrencyExchange | None = None


class TransactionsContainer(BaseModel):
    booked: list[Transaction]
    pending: list[Transaction]


class TransactionsResponse(BaseModel):
    transactions: TransactionsContainer
