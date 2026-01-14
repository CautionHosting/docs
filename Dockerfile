FROM python:3.12-slim
WORKDIR /app

RUN pip install --no-cache-dir zensical

COPY zensical.toml ./
COPY docs/ ./docs/
COPY overrides/ ./overrides/

EXPOSE 5000

CMD ["zensical", "serve", "--dev-addr", "0.0.0.0:5000"]
