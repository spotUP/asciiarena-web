FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Build requires DATABASE_URL — use a placeholder; real env is injected at runtime
ARG DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/placeholder"
ARG NEXTAUTH_SECRET="build-time-secret"
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy only what next start needs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# The collections/apps/mags dirs live on the host and are mounted as volumes
# so we don't copy them into the image

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
