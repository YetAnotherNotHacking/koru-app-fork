FROM node:22-alpine AS base

FROM base AS build

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY services services

RUN pnpm deploy --filter=email-service email

RUN cd email && pnpm build

FROM base AS runner

WORKDIR /app

COPY --from=build /app/email/dist ./dist
COPY --from=build /app/email/node_modules ./node_modules

ENTRYPOINT [ "node", "dist/index.cjs" ]