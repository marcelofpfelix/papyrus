# Deploying Papyrus

A Papyrus site is static Astro output. The current public demo target is:

- `https://papyrus.marcelofelix.com/`

When publishing a fork or consuming site on Cloudflare Pages, use your own Pages
project name, branch, and custom domain. A Pages project may still have a
provider URL such as `https://<project>.pages.dev/`, but public metadata should
use the final production origin.

## Local preview

```sh
make dev
```

Open `http://localhost:4326/` for local editing with HMR.

For a LAN-safe static preview:

```sh
make serve
```

Open `http://192.168.1.102:4326/`.

## Docker preview

The Dockerfile is for repeatable local/static preview of the example site. It does
not deploy anything.

```sh
make docker-build
make docker-run
```

Open `http://localhost:4327/`.

Stop the container:

```sh
make docker-stop
```

## Cloudflare Pages

The repo pins `wrangler@4.106.0` as a dev dependency, so no global Wrangler
install is required. `workerd` is allowed in `pnpm-workspace.yaml` because
Wrangler needs it.

One-time setup:

- create or confirm the Cloudflare Pages project
- create a token with Cloudflare Pages write access
- store the token outside this repo

Repeatable deploy command:

Use a token with Cloudflare Pages write access, then deploy the built `dist`
directory:

```sh
CLOUDFLARE_API_TOKEN="$TOKEN" make deploy-demo
```

The target is repeatable because it updates the same Pages project:

```sh
make deploy-demo PAGES_PROJECT=papyrus
```

Do not put personal token lookup helpers in this package. Consuming machines can
wrap the command locally, for example with `cloudflare-token` from dotfiles.

## After deploy

Open the published URL, confirm the generated routes load, and check that
`/robots.txt`, `/sitemap-index.xml`, `/rss.xml`, `/search/`, `/posts/`, and
`/collections/docs/` match the site URL configured for that deployment.
