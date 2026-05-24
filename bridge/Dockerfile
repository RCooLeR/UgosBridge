# --- Stage 1: Build the Go binary ---
FROM golang:1.26.2-alpine AS builder

# Install git and CA certs (if needed for Go modules)
RUN apk upgrade --no-cache && apk add --no-cache git ca-certificates

# Set working directory inside the container
WORKDIR /app

ARG VERSION=dev
ARG COMMIT=none
ARG DATE=unknown

# Copy Go source code into the container
COPY . .

# Enable Go Modules (optional if using go.mod)
ENV GO111MODULE=on

# Download deps
RUN if [ -f /app/bridge/go.mod ]; then \
        cd /app/bridge; \
    elif [ -f /app/go.mod ]; then \
        cd /app; \
    else \
        echo "go.mod not found in /app or /app/bridge" >&2; \
        exit 1; \
    fi \
    && go mod download

RUN if [ -f /app/bridge/go.mod ]; then \
        cd /app/bridge; \
    elif [ -f /app/go.mod ]; then \
        cd /app; \
    else \
        echo "go.mod not found in /app or /app/bridge" >&2; \
        exit 1; \
    fi \
    && CGO_ENABLED=0 GOOS=linux go build -trimpath \
        -ldflags="-s -w -X main.version=${VERSION} -X main.commit=${COMMIT} -X main.date=${DATE}" \
        -o /ugos-bridge .

FROM debian:bookworm-slim

ARG TARGETARCH

RUN apt-get update \
    && packages="ca-certificates libvirt-clients nut-client" \
    && if [ "$TARGETARCH" = "amd64" ]; then packages="$packages intel-gpu-tools"; fi \
    && apt-get install --no-install-recommends -y $packages \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /ugos-bridge /usr/local/bin/ugos-bridge

EXPOSE 9877

ENTRYPOINT ["/usr/local/bin/ugos-bridge"]

