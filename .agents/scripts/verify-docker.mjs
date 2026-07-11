#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const [dockerfile, makefile, packageJsonText, deployDocs] = await Promise.all([
  readFile("Dockerfile", "utf8"),
  readFile("Makefile", "utf8"),
  readFile("package.json", "utf8"),
  readFile("docs/deploy.md", "utf8"),
]);
const packageJson = JSON.parse(packageJsonText);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(dockerfile.includes("FROM node:24-alpine AS build"), "Dockerfile should use current Node 24 build stage");
assert(dockerfile.includes("pnpm install --frozen-lockfile"), "Dockerfile should install from pnpm lockfile");
assert(dockerfile.includes("RUN pnpm run build"), "Dockerfile should build the static Astro demo");
assert(dockerfile.includes("FROM nginx:1.29-alpine AS runtime"), "Dockerfile should use pinned nginx static runtime");
assert(dockerfile.includes("COPY --from=build /app/dist /usr/share/nginx/html"), "Dockerfile should serve dist from nginx");

for (const target of ["docker-build", "docker-run", "docker-stop", "verify-docker"]) {
  assert(makefile.includes(`${target}:`), `Makefile missing ${target} target`);
}

assert(makefile.includes("DOCKER_IMAGE ?= papyrus-demo"), "Makefile missing DOCKER_IMAGE default");
assert(makefile.includes("DOCKER_PORT ?= 4327"), "Makefile missing DOCKER_PORT default");
assert(makefile.includes("docker run --rm -d --name $(DOCKER_IMAGE) -p $(DOCKER_PORT):80 $(DOCKER_IMAGE)"), "Makefile docker-run target is not the expected local preview command");
assert(packageJson.scripts?.["verify:docker"] === "node .agents/scripts/verify-docker.mjs", "verify:docker package script missing");

assert(deployDocs.includes("## Docker preview"), "deploy docs missing Docker preview section");
assert(deployDocs.includes("make docker-build"), "deploy docs missing docker-build instruction");
assert(deployDocs.includes("make docker-run"), "deploy docs missing docker-run instruction");
assert(deployDocs.includes("make deploy-demo"), "deploy docs should keep Cloudflare deploy target documented");
assert(deployDocs.includes("One-time setup"), "deploy docs should distinguish one-time setup from repeatable commands");

console.log("Verified Dockerfile, Docker Make targets, package script/bin, and deploy docs.");
