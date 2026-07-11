HOST ?= 0.0.0.0
SITE_HOST ?= 192.168.1.102
PORT ?= 4326
SITE_URL ?= http://$(SITE_HOST):$(PORT)
PAGES_PROJECT ?= papyrus
DOCKER_IMAGE ?= papyrus-demo
DOCKER_PORT ?= 4327

.PHONY: install dev dev-stop build preview serve check check-links audit-status \
	llms ai-indexes ai-validate rss-tags theme compress-images date-check \
	date-touch docker-build docker-run docker-stop deploy-demo verify-%

install:
	pnpm install

dev:
	$(MAKE) dev-stop
	pnpm exec astro dev --host=$(HOST) --allowed-hosts --port $(PORT)

dev-stop:
	-pnpm exec astro dev stop
	@pids=$$(lsof -tiTCP:$(PORT) -sTCP:LISTEN 2>/dev/null); \
	if [ -n "$$pids" ]; then \
		echo "Stopping process(es) on port $(PORT): $$pids"; \
		kill $$pids; \
	fi

build:
	pnpm run build

preview serve: build
	$(MAKE) dev-stop
	$(if $(filter preview,$@),pnpm exec astro preview --host=$(HOST) --allowed-hosts --port $(PORT),python3 scripts/serve-static.py dist $(PORT) $(SITE_HOST))

check:
	pnpm run check

check-links: build
	pnpm run check:links

audit-status:
	CI=true pnpm run audit:status

llms:
	pnpm run llms -- src/content/posts public $(SITE_URL)

ai-indexes:
	pnpm run ai:indexes -- src/content/posts public/ai $(SITE_URL) public/demo/site-data.json

ai-validate:
	pnpm run ai:validate -- src/content/posts public/demo/site-data.json

rss-tags:
	pnpm run rss:tags -- src/content/posts public/rss/tags $(SITE_URL)

theme:
	pnpm run theme -- validate

compress-images:
	pnpm run compress -- public/images

date-check:
	pnpm run post:date -- check src/content/posts

date-touch:
	pnpm run post:date -- touch src/content/posts

docker-build:
	docker build -t $(DOCKER_IMAGE) .

docker-run:
	$(MAKE) docker-stop
	docker run --rm -d --name $(DOCKER_IMAGE) -p $(DOCKER_PORT):80 $(DOCKER_IMAGE)

docker-stop:
	-docker stop $(DOCKER_IMAGE)

deploy-demo: build
	pnpm exec wrangler pages deploy dist --project-name $(PAGES_PROJECT)

verify-a4 verify-demo verify-lighthouse verify-browser verify-responsive: build
	CI=true pnpm run verify:$(@:verify-%=%)

verify-%:
	CI=true pnpm run verify:$*
