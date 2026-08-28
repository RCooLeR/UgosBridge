# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM golang:1.27.0-alpine3.24@sha256:4c9fe60190a2a3350ddc51de80d0224b8a6698d12bdfc999fee45ea9d6c46dbc AS builder

RUN apk add --no-cache git

WORKDIR /src/bridge

ARG TARGETOS=linux
ARG TARGETARCH
ARG VERSION=dev
ARG COMMIT=none
ARG DATE=unknown

COPY --link bridge/go.mod bridge/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY --link bridge/ ./
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath \
      -ldflags="-s -w -X main.version=$VERSION -X main.commit=$COMMIT -X main.date=$DATE" \
      -o /out/ugos-bridge .

FROM debian:13.6-slim@sha256:d7e12182ce18b85b93007c1dedf31f2d29e01ccf3182cc4017c709b6259bc132

ARG TARGETARCH
ARG VERSION=dev
ARG COMMIT=none
ARG DATE=1970-01-01T00:00:00Z

RUN apt-get update \
    && packages="ca-certificates libvirt-clients nut-client" \
    && if [ "$TARGETARCH" = "amd64" ]; then packages="$packages intel-gpu-tools"; fi \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y $packages \
    && rm -rf /var/lib/apt/lists/*

LABEL org.opencontainers.image.title="ugos-bridge" \
      org.opencontainers.image.description="Lightweight UGOS and Docker metrics bridge for NAS hosts and Compose stacks" \
      org.opencontainers.image.source="https://github.com/RCooLeR/UgosBridge" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="$VERSION" \
      org.opencontainers.image.revision="$COMMIT" \
      org.opencontainers.image.created="$DATE"

COPY --link --from=builder /out/ugos-bridge /usr/local/bin/ugos-bridge

EXPOSE 9877
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/usr/local/bin/ugos-bridge", "healthcheck"]

ENTRYPOINT ["/usr/local/bin/ugos-bridge"]
