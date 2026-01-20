.PHONY: build dev down clean deploy fullclean

IMAGE_NAME := caution-docs
CONTAINER_NAME := caution-docs-dev

build:
	docker build --target dev -t $(IMAGE_NAME):dev .

build-prod:
	docker build --target prod -t $(IMAGE_NAME) .

dev: build
	docker run --rm -it \
		--name $(CONTAINER_NAME) \
		-p 5000:5000 \
		-v $(PWD)/docs:/app/docs:ro \
		-v $(PWD)/overrides:/app/overrides:ro \
		-v $(PWD)/zensical.toml:/app/zensical.toml:ro \
		$(IMAGE_NAME):dev

down:
	docker stop $(CONTAINER_NAME)

clean:
	rm -rf _site || true

fullclean: clean
	-docker stop $(CONTAINER_NAME) 2>/dev/null || true
	-docker rmi $(IMAGE_NAME) $(IMAGE_NAME):dev 2>/dev/null || true
	docker image prune -f --filter label=stage=caution-docs-builder || true

_site: build-prod
	mkdir -p _site
	docker run $(IMAGE_NAME) tar c -C /usr/share/nginx/html . | tar x -C _site

deploy: _site
	rsync -arv --info=progress2 _site/ root@caution.co:/usr/share/caddy/docs.caution.co
