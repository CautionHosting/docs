FROM python:3.12-slim AS base
WORKDIR /app
RUN pip install --no-cache-dir zensical

FROM base AS dev
COPY zensical.toml ./
COPY docs/ ./docs/
COPY overrides/ ./overrides/
EXPOSE 5000
CMD ["zensical", "serve", "--dev-addr", "0.0.0.0:5000"]

FROM base AS builder
LABEL stage=caution-docs-builder
COPY zensical.toml ./
COPY docs/ ./docs/
COPY overrides/ ./overrides/
RUN zensical build

FROM nginx AS prod
COPY --from=builder /app/site /usr/share/nginx/html
