FROM node:18-alpine
WORKDIR /app

# Install dependencies
RUN npm install -g pnpm

# Copy package.json and install dependencies
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install

# Copy the rest of the application
COPY web/ .

# Next.js collects anonymous telemetry data. Disable it.
ENV NEXT_TELEMETRY_DISABLED 1

# Setup for development mode
ENV NODE_ENV=production
ENV PORT=${PORT:-3000}

# Create required directories
RUN mkdir -p .next
RUN mkdir -p public

EXPOSE 3000

# API URL for frontend to connect to
ENV NEXT_PUBLIC_API_URL http://localhost:8000

# Run in development mode
CMD ["pnpm", "start", "--", "-p", "$PORT"]