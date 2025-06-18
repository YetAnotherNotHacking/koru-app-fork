from enum import Enum


class ConnectionType(str, Enum):
    MANUAL = "MANUAL"
    GOCARDLESS = "GOCARDLESS"
