class KoruBaseException(Exception):
    """Base exception class for all Koru exceptions."""

    def __init__(self, message: str, error_code: str | None = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class TransactionException(KoruBaseException):
    """Raised when there are issues with transaction processing."""

    pass


class TransactionMissingDataError(TransactionException):
    """Raised when a transaction is missing required data."""

    def __init__(
        self,
        transaction_id: str | None = None,
        missing_field: str | None = None,
        message: str | None = None,
        error_code: str | None = None,
    ):
        self.transaction_id = transaction_id
        self.missing_field = missing_field
        if message is None:
            message = (
                f"Transaction {transaction_id} has no {missing_field}"
                if transaction_id and missing_field
                else f"Transaction {transaction_id} is missing required data"
            )
        super().__init__(message, error_code)


class GoCardlessException(KoruBaseException):
    """Raised when there are issues with GoCardless API operations."""

    pass


class GoCardlessAPIError(GoCardlessException):
    """Raised when GoCardless API returns an error response."""

    def __init__(
        self,
        operation: str,
        response_text: str,
        status_code: int | None = None,
        message: str | None = None,
        error_code: str | None = None,
    ):
        self.operation = operation
        self.status_code = status_code
        self.response_text = response_text
        if message is None:
            message = f"Failed to {operation}: {response_text}"
        super().__init__(message, error_code)


class ConnectionImportException(KoruBaseException):
    """Raised when there are issues with GoCardless connections."""

    pass


class ConnectionNotFoundError(ConnectionImportException):
    """Raised when a connection cannot be found."""

    def __init__(
        self,
        connection_id: str,
        message: str | None = None,
        error_code: str | None = None,
    ):
        self.connection_id = connection_id
        if message is None:
            message = f"GoCardless connection {connection_id} not found"
        super().__init__(message, error_code)


class ConnectionMissingDataError(ConnectionImportException):
    """Raised when a connection is missing required data."""

    def __init__(
        self,
        connection_id: str,
        missing_field: str,
        message: str | None = None,
        error_code: str | None = None,
    ):
        self.connection_id = connection_id
        self.missing_field = missing_field
        if message is None:
            message = f"GoCardless connection {connection_id} has no {missing_field}"
        super().__init__(message, error_code)
