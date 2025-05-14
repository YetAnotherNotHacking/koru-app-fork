FROM node:22-alpine AS base

FROM base AS builder

ARG NEXT_PUBLIC_API_URL=/api
ENV API_URL=${NEXT_PUBLIC_API_URL}

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# This is a workaround, because web and api-client expect tsconfig.base.json to be at ../../, but the deployed web is one level higher
COPY tsconfig.base.json /
COPY tsconfig.base.json /app

COPY apps ./apps
COPY packages ./packages

RUN pnpm install

RUN pnpm --filter api-client run build

RUN pnpm deploy --filter=web web

RUN cd web && pnpm build


FROM base AS runner

WORKDIR /app

COPY --from=builder /app/web/public ./public
COPY --from=builder /app/web/.next/standalone .
COPY --from=builder /app/web/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]