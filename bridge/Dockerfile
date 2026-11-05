# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM golang:1.27.3-alpine3.24@sha256:d200d2dd76b03a99b52651fd1325aff7dcd35422c35c01bac56571b0507f3deb AS builder

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

FROM debian:13.7-slim@sha256:a72b4433de1cf7d6bae0c4cee74d0547f58601a643b3375f070c51600d63b6b2

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
