from enum import Enum


class ProcessingStatus(str, Enum):
    UNPROCESSED = "UNPROCESSED"
    PROCESSED = "PROCESSED"
