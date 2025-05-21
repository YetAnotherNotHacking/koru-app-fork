FROM node:22-alpine AS base

FROM base AS build

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY services services

# Install all dependencies for building
RUN pnpm deploy --filter=email-service email

RUN cd email && pnpm build

FROM base AS deps

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/email/package.json ./services/email/

# Install only production dependencies
RUN pnpm deploy --filter=email-service --prod email

FROM base AS runner

WORKDIR /app

COPY --from=build /app/email/dist ./dist
COPY --from=deps /app/email/node_modules ./node_modules

ENTRYPOINT [ "node", "dist/index.cjs" ]