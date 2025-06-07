from collections.abc import Generator
from contextlib import suppress

import pika
import pika.adapters.blocking_connection
import pika.spec
from pika.exchange_type import ExchangeType

from api.core.config import settings

RABBITMQ_URL = (
    f"amqp://{settings.RABBITMQ_USER}:{settings.RABBITMQ_PASSWORD}@"
    f"{settings.RABBITMQ_HOST}:{settings.RABBITMQ_PORT}"
    f"{f'/{settings.RABBITMQ_VHOST}' if settings.RABBITMQ_VHOST else ''}"
)


class RabbitMQConnection:
    _connection: pika.BlockingConnection | None
    _channel: pika.adapters.blocking_connection.BlockingChannel | None
    _declared_exchanges: set[str]

    def __init__(self):
        self._connection = None
        self._channel = None
        self._declared_exchanges = set()

    def _connect(self):
        self._connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        self._channel = self._connection.channel()
        self._declared_exchanges.clear()

    def get_channel(self) -> pika.adapters.blocking_connection.BlockingChannel:
        if not self._channel or self._channel.is_closed:
            if self._connection and self._connection.is_closed:
                self._connection = None
            self._connect()

        if not self._channel:
            raise Exception("RabbitMQ channel unavailable after connection attempt.")
        return self._channel

    def _ensure_exchange_declared(
        self,
        exchange_name: str,
        exchange_type: ExchangeType,
    ) -> None:
        cache_key = f"{exchange_name}:{exchange_type}"
        if cache_key not in self._declared_exchanges:
            self.get_channel().exchange_declare(
                exchange=exchange_name,
                exchange_type=exchange_type,
                durable=True,
            )
            self._declared_exchanges.add(cache_key)

    def publish_message(
        self,
        message_body: str,
        exchange_name: str,
        routing_key: str,
        exchange_type: ExchangeType = ExchangeType.direct,
        content_type: str = "application/json",
    ) -> None:
        try:
            self._ensure_exchange_declared(exchange_name, exchange_type)

            self.get_channel().basic_publish(
                exchange=exchange_name,
                routing_key=routing_key,
                body=message_body,
                properties=pika.BasicProperties(
                    delivery_mode=pika.spec.PERSISTENT_DELIVERY_MODE,
                    content_type=content_type,
                ),
            )
        except Exception:
            if self._channel and not self._channel.is_closed:
                with suppress(Exception):
                    self._channel.close()

            self._channel = None

            if self._connection and not self._connection.is_closed:
                with suppress(Exception):
                    self._connection.close()

            self._connection = None

            self._declared_exchanges.clear()
            raise

    def close(self):
        if self._channel and self._channel.is_open:
            self._channel.close()
        if self._connection and self._connection.is_open:
            self._connection.close()

        self._channel = None
        self._connection = None
        self._declared_exchanges.clear()


def get_rabbitmq() -> Generator[RabbitMQConnection, None, None]:
    conn = RabbitMQConnection()
    try:
        yield conn
    finally:
        conn.close()
