# ---------- Stage 1: build the app ----------
FROM docker.io/library/node:24-slim AS build
WORKDIR /app
# better-sqlite3 is partly C++; these tools let npm compile it if no ready-made copy fits
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Stage 2: run the app ----------
FROM docker.io/library/node:24-slim
LABEL org.opencontainers.image.source=https://github.com/PeyHunter/pathfinder
WORKDIR /app
ENV NODE_ENV=production PORT=4000 HOSTNAME=0.0.0.0 DATABASE_FILE=/app/data/pathfinder.db
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/prompts ./prompts
COPY --from=build --chown=node:node /app/drizzle ./drizzle
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 4000
CMD ["node", "server.js"]
