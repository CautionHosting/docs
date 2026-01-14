.PHONY: build dev down clean

IMAGE_NAME := caution-docs
CONTAINER_NAME := caution-docs-dev

build:
	docker build --no-cache -t $(IMAGE_NAME) .

dev: build
	docker run --rm -it \
		--name $(CONTAINER_NAME) \
		-p 5000:5000 \
		-v $(PWD)/docs:/app/docs:ro \
		-v $(PWD)/overrides:/app/overrides:ro \
		-v $(PWD)/zensical.toml:/app/zensical.toml:ro \
		$(IMAGE_NAME)

down:
	docker stop $(CONTAINER_NAME)

clean:
	-docker stop $(CONTAINER_NAME) 2>/dev/null || true
	-docker rmi $(IMAGE_NAME) 2>/dev/null || true
