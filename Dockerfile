# Stage 1: Build frontend
FROM node:lts-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json webpack.config.js index.html ./
COPY src/ ./src/
COPY img/ ./img/
COPY assets/ ./assets/
RUN npm run build:production

# Stage 2: Build backend
FROM golang:1.26-alpine AS backend-builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY server/ ./server/
RUN go build -ldflags="-w -s" -o build/server ./server/

# Stage 3: Run
FROM alpine:latest
WORKDIR /app
COPY --from=backend-builder /app/build/server ./server
COPY --from=frontend-builder /app/build/frontend/ ./build/frontend/
EXPOSE 80
CMD ["./server", "-port", "80"]
