from starlette.types import ASGIApp, Receive, Scope, Send


class CloudflareMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "lifespan":
            return await self.app(scope, receive, send)

        headers = dict(scope["headers"])

        if b"cf-connecting-ip" in headers:
            ip = headers[b"cf-connecting-ip"].decode("latin1")

            if ip:
                port = 0
                scope["client"] = (ip, port)

        return await self.app(scope, receive, send)
