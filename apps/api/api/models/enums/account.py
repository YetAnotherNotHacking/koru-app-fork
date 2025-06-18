from enum import Enum


class AccountType(str, Enum):
    CASH = "CASH"
    BANK_GOCARDLESS = "BANK_GOCARDLESS"
    BANK_MANUAL = "BANK_MANUAL"


class UsageType(str, Enum):
    PRIV = "PRIV"
    ORGA = "ORGA"


class ISOAccountType(str, Enum):
    CACC = "CACC"
    """Current: Account used to post debits and credits when no specific
    account has been nominated."""
    CARD = "CARD"
    """CardAccount: Account used for credit card payments."""
    CASH = "CASH"
    """CashPayment: Account used for the payment of cash."""
    CHAR = "CHAR"
    """Charges: Account used for charges if different from the account for
    payment."""
    CISH = "CISH"
    """CashIncome: Account used for payment of income if different from the
    current cash account"""
    COMM = "COMM"
    """Commission: Account used for commission if different from the account
    for payment."""
    CPAC = "CPAC"
    """ClearingParticipantSettlementAccount: Account used to post settlement
    debit and credit entries on behalf of a designated Clearing
    Participant."""
    LLSV = "LLSV"
    """LimitedLiquiditySavingsAccount: Account used for savings with special
    interest and withdrawal terms."""
    LOAN = "LOAN"
    """Loan: Account used for loans."""
    MGLD = "MGLD"
    """MarginalLending: Account used for a marginal lending facility."""
    MOMA = "MOMA"
    """MoneyMarket: Account used for money markets if different from the cash
    account."""
    NREX = "NREX"
    """NonResidentExternal: Account used for non-resident external."""
    ODFT = "ODFT"
    """Overdraft: Account is used for overdrafts."""
    ONDP = "ONDP"
    """OverNightDeposit: Account used for overnight deposits."""
    OTHR = "OTHR"
    """OtherAccount: Account not otherwise specified."""
    SACC = "SACC"
    """Settlement: Account used to post debit and credit entries, as a result
    of transactions cleared and settled through a specific clearing and
    settlement system."""
    SLRY = "SLRY"
    """Salary: Accounts used for salary payments."""
    SVGS = "SVGS"
    """Savings: Account used for savings."""
    TAXE = "TAXE"
    """Tax: Account used for taxes if different from the account for payment."""
    TRAN = "TRAN"
    """TransactingAccount: A transacting account is the most basic type of bank
    account that you can get. The main difference between transaction and
    cheque accounts is that you usually do not get a cheque book with your
    transacting account and neither are you offered an overdraft facility."""
    TRAS = "TRAS"
    """CashTrading: Account used for trading if different from the current
    cash account."""
    VACC = "VACC"
    """VirtualAccount: Account created virtually to facilitate collection and
    reconciliation."""
    NFCA = "NFCA"
    """NonResidentForeignCurrencyAccount: Non-Resident Individual / Entity
    Foreign Current held domestically."""
