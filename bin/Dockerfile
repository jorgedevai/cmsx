FROM alpine:3.21

RUN apk add --no-cache ca-certificates wget && \
    adduser -D -s /bin/false cmsx

WORKDIR /app

COPY cmsx-server ./cmsx-server
COPY config/ config/

RUN chmod +x cmsx-server && \
    mkdir -p uploads data && chown -R cmsx:cmsx /app

USER cmsx

ENV RUST_LOG=info

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["./cmsx-server"]
