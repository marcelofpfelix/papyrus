#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(new URL("../..", import.meta.url).pathname);
const dist = join(root, "dist");
const failures = [];
const themeProfiles = [
  "pure",
  "catppuccin",
  "tokyo-night",
  "kanagawa",
  "rose-pine",
  "everforest",
  "dracula",
  "gruvbox",
  "nord",
];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function contentType(filePath) {
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".mmd": "text/plain; charset=utf-8",
    ".puml": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
  };

  return types[extname(filePath)] ?? "application/octet-stream";
}

async function fileForUrl(url) {
  const requestUrl = new URL(url, "http://127.0.0.1");
  const rawPath = decodeURIComponent(requestUrl.pathname);
  const candidates = rawPath.endsWith("/")
    ? [join(dist, rawPath, "index.html")]
    : [join(dist, rawPath), join(dist, rawPath, "index.html")];

  for (const candidate of candidates) {
    if (!candidate.startsWith(dist)) continue;
    if (!existsSync(candidate)) continue;
    const info = await stat(candidate);
    if (info.isFile()) return candidate;
  }

  return null;
}

async function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const filePath = await fileForUrl(request.url ?? "/");
      if (!filePath) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, { "content-type": contentType(filePath) });
      response.end(await readFile(filePath));
    } catch (error) {
      response.writeHead(500);
      response.end(String(error));
    }
  });

  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not bind local test server");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  };
}

async function clipboardText(page) {
  return page.evaluate(() => navigator.clipboard.readText());
}

async function assertPackageNavScope(page, routeName) {
  const navLabels = await page.locator(".papyrus-nav a").allTextContents();
  const normalized = navLabels.map((label) => label.trim());
  assert(normalized.join("|") === "Posts|Projects|Collections|Profile|About", `${routeName} nav labels were ${normalized.join(", ")}`);
  assert(!normalized.some((label) => /timeline/i.test(label)), `${routeName} nav should not include timeline tabs: ${normalized.join(", ")}`);
}

async function assertFooterControlPopoverLayout(page, origin, viewport, label) {
  await page.setViewportSize(viewport);
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });

  const menus = page.locator(".papyrus-footer details.papyrus-control-menu");
  const count = await menus.count();
  assert(count === 1, `${label} expected 1 footer control menu, found ${count}`);

  for (let index = 0; index < count; index += 1) {
    const menu = menus.nth(index);
    await menu.locator("summary").click();
    const state = await menu.evaluate((element) => {
      const summary = element.querySelector("summary");
      const popover = element.querySelector(".papyrus-control-popover");
      const footer = element.closest(".papyrus-footer");
      const serialize = (rect) => ({
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      });
      return {
        footer: footer ? serialize(footer.getBoundingClientRect()) : null,
        open: element.hasAttribute("open"),
        popover: popover ? serialize(popover.getBoundingClientRect()) : null,
        summary: summary ? serialize(summary.getBoundingClientRect()) : null,
        viewportWidth: window.innerWidth,
      };
    });

    assert(state.open, `${label} footer menu ${index} did not open`);
    assert(Boolean(state.popover), `${label} footer menu ${index} popover missing`);
    assert(Boolean(state.summary), `${label} footer menu ${index} summary missing`);
    if (state.popover && state.summary) {
      assert(state.popover.left >= 8, `${label} footer menu ${index} popover overflowed left: ${JSON.stringify(state)}`);
      assert(state.popover.right <= state.viewportWidth - 8, `${label} footer menu ${index} popover overflowed right: ${JSON.stringify(state)}`);
      assert(state.popover.bottom <= state.summary.top - 6, `${label} footer menu ${index} popover should open above the footer control: ${JSON.stringify(state)}`);
      assert(state.popover.width >= 140, `${label} footer menu ${index} popover was too narrow: ${JSON.stringify(state)}`);
    }

    await menu.locator("summary").click();
    await page.waitForFunction((menuIndex) => !document.querySelectorAll(".papyrus-footer details.papyrus-control-menu")[menuIndex]?.hasAttribute("open"), index);
  }
}

async function footerModeButtonState(page) {
  return page.locator("[data-papyrus-theme-toggle]").evaluate((button) => {
    const box = button.getBoundingClientRect();
    const iconVisibility = Array.from(button.querySelectorAll(".papyrus-mode-icon")).map((icon) => ({
      className: icon.getAttribute("class") ?? "",
      display: getComputedStyle(icon).display,
    }));
    return {
      ariaLabel: button.getAttribute("aria-label") ?? "",
      height: box.height,
      dataTheme: button.getAttribute("data-theme") ?? "",
      localStorageMode: localStorage.getItem("papyrus-mode") ?? "",
      text: button.textContent?.trim() ?? "",
      visibleIcons: iconVisibility.filter((icon) => icon.display !== "none").map((icon) => icon.className),
      width: box.width,
    };
  });
}

async function runHomeChecks(page, origin) {
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  await assertPackageNavScope(page, "home");

  const homeState = await page.evaluate(() => {
    const brand = document.querySelector(".papyrus-logo-link");
    const postsSection = Array.from(document.querySelectorAll(".papyrus-section")).find((section) => section.querySelector("h2")?.textContent?.trim() === "Posts");
    const projectsSection = Array.from(document.querySelectorAll(".papyrus-section")).find((section) => section.querySelector("h2")?.textContent?.trim() === "Projects");
    const docsSection = Array.from(document.querySelectorAll(".papyrus-section")).find((section) => section.querySelector("h2")?.textContent?.trim() === "Docs");
    const listPostCount = postsSection?.querySelectorAll(".papyrus-post-list-list li").length ?? 0;
    const firstListLink = postsSection?.querySelector(".papyrus-post-list-list a:has(.papyrus-post-cover)");
    const firstListCover = firstListLink?.querySelector(".papyrus-post-cover");
    const firstListLinkBox = firstListLink?.getBoundingClientRect();
    const firstListCoverBox = firstListCover?.getBoundingClientRect();
    const firstListPost = postsSection?.querySelector(".papyrus-post-list-list li");
    const firstListPostMeta = firstListPost?.querySelector(".papyrus-post-meta")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const firstListPostStyles = firstListPost ? getComputedStyle(firstListPost) : null;
    const firstFreshMeta = firstListPost?.querySelector(".papyrus-post-fresh");
    const firstFreshMetaStyles = firstFreshMeta ? getComputedStyle(firstFreshMeta) : null;
    const firstUpdatedMeta = postsSection?.querySelector(".papyrus-post-list-list .papyrus-post-recently-updated");
    const firstUpdatedMetaStyles = firstUpdatedMeta ? getComputedStyle(firstUpdatedMeta) : null;
    const firstUpdatedMetaIcon = firstUpdatedMeta?.querySelector("svg");
    const firstUpdatedMetaIconStyles = firstUpdatedMetaIcon ? getComputedStyle(firstUpdatedMetaIcon) : null;
    const accentProbe = document.createElement("span");
    accentProbe.style.color = "var(--papyrus-accent)";
    document.body.append(accentProbe);
    const accentColor = getComputedStyle(accentProbe).color;
    accentProbe.remove();
    const projectCards = Array.from(document.querySelectorAll(".papyrus-project-card")).map((card) => ({
      backgroundColor: getComputedStyle(card).backgroundColor,
      footerCount: card.querySelectorAll("footer").length,
      title: card.querySelector("h3")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    }));
    const noteList = document.querySelector(".papyrus-note-list");
    const noteListStyles = noteList ? getComputedStyle(noteList) : null;
    const noteCards = Array.from(document.querySelectorAll(".papyrus-note-list li")).map((note) => {
      const styles = getComputedStyle(note);
      const firstTag = note.querySelector("footer a");
      const firstTagStyles = firstTag ? getComputedStyle(firstTag) : null;
      return {
        backgroundColor: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        date: note.querySelector("time")?.textContent?.trim() ?? "",
        gap: noteListStyles?.gap ?? "",
        id: note.getAttribute("id") ?? "",
        paddingTop: styles.paddingTop,
        tagColor: firstTagStyles?.color ?? "",
        tags: Array.from(note.querySelectorAll("footer a")).map((link) => ({
          href: link.getAttribute("href"),
          text: link.textContent?.trim(),
        })),
        text: note.querySelector("p")?.textContent?.trim() ?? "",
      };
    });
    const tag = postsSection?.querySelector(".papyrus-post-inline-tag");
    const tagStyles = tag ? getComputedStyle(tag) : null;
    const homeMore = Array.from(document.querySelectorAll(".papyrus-home-more a")).find((link) => link.textContent?.trim() === "about me");
    const sectionLinks = Array.from(document.querySelectorAll(".papyrus-section-more a")).map((link) => {
      const styles = getComputedStyle(link);
      return {
        borderBottom: styles.borderBottomWidth,
        borderLeft: styles.borderLeftWidth,
        borderRight: styles.borderRightWidth,
        borderTop: styles.borderTopWidth,
        href: link.getAttribute("href"),
        text: link.textContent?.trim() ?? "",
      };
    });
    const homeMoreStyles = homeMore ? getComputedStyle(homeMore) : null;
    const homeMoreParentStyles = homeMore?.parentElement ? getComputedStyle(homeMore.parentElement) : null;
    const docsItems = Array.from(docsSection?.querySelectorAll(".papyrus-doc-list li") ?? []).map((item) => ({
      description: item.querySelector(".papyrus-post-description")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      href: item.querySelector("a")?.getAttribute("href") ?? "",
      title: item.querySelector(".papyrus-post-title")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    }));
    const search = document.querySelector('.papyrus-header-actions a[aria-label="Search"]');
    const rss = document.querySelector('.papyrus-footer-social a[aria-label="RSS"]');
    const github = document.querySelector('.papyrus-footer-social a[aria-label="GitHub"]');
    const poweredBy = document.querySelector(".papyrus-powered-by");
    const poweredByLinks = Array.from(poweredBy?.querySelectorAll("a") ?? []).map((link) => ({
      href: link.getAttribute("href"),
      text: link.textContent?.trim(),
    }));
    const iconButtons = Array.from(document.querySelectorAll(".papyrus-icon-button")).map((button) => {
      const styles = getComputedStyle(button);
      return {
        ariaLabel: button.getAttribute("aria-label"),
        backgroundColor: styles.backgroundColor,
        borderBottom: styles.borderBottomWidth,
        borderLeft: styles.borderLeftWidth,
        borderRight: styles.borderRightWidth,
        borderTop: styles.borderTopWidth,
      };
    });
    const linkPreviews = Array.from(document.querySelectorAll(".papyrus-link-preview")).map((card) => {
      const styles = getComputedStyle(card);
      return {
        borderColor: styles.borderTopColor,
        borderWidth: styles.borderTopWidth,
        borderRadius: styles.borderRadius,
        description: card.querySelector("small")?.textContent?.trim() ?? "",
        display: styles.display,
        href: card.getAttribute("href"),
        site: card.querySelector("em")?.textContent?.trim() ?? "",
        title: card.querySelector("strong")?.textContent?.trim() ?? "",
      };
    });
    return {
      brandAriaLabel: brand?.getAttribute("aria-label") ?? "",
      brandHref: brand?.getAttribute("href") ?? "",
      brandHasMark: Boolean(brand?.querySelector(".papyrus-brand-mark")),
      brandHasCursor: Boolean(brand?.querySelector(".papyrus-cursor")),
      brandText: brand?.textContent?.replace(/\s+/g, "").trim() ?? "",
      coverHeight: firstListCoverBox?.height ?? 0,
      coverIsRightAligned: firstListCoverBox && firstListLinkBox ? firstListCoverBox.left > firstListLinkBox.left + (firstListLinkBox.width / 2) : false,
      coverSrc: firstListCover?.getAttribute("src") ?? "",
      coverWidth: firstListCoverBox?.width ?? 0,
      firstListPostMeta,
      firstListPostBackground: firstListPostStyles?.backgroundColor ?? "",
      firstListPostFreshColor: firstFreshMetaStyles?.color ?? "",
      firstListPostFreshText: firstFreshMeta?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      firstListPostUpdatedColor: firstUpdatedMetaStyles?.color ?? "",
      firstListPostUpdatedIconColor: firstUpdatedMetaIconStyles?.color ?? "",
      firstListPostUpdatedIconPath: firstUpdatedMetaIcon?.querySelector("path")?.getAttribute("d") ?? "",
      firstListPostTitle: firstListPost?.querySelector(".papyrus-post-title")?.textContent?.trim() ?? "",
      githubHref: github?.getAttribute("href") ?? "",
      hasTag: Boolean(tag),
      homeMore: {
        borderBottom: homeMoreStyles?.borderBottomWidth ?? "",
        borderLeft: homeMoreStyles?.borderLeftWidth ?? "",
        borderRight: homeMoreStyles?.borderRightWidth ?? "",
        borderTop: homeMoreStyles?.borderTopWidth ?? "",
        href: homeMore?.getAttribute("href") ?? "",
        textAlign: homeMoreParentStyles?.textAlign ?? "",
        text: homeMore?.textContent?.trim() ?? "",
      },
      iconButtons,
      linkPreviews,
      docsItems,
      docsGithubPreviewCount: docsSection?.querySelectorAll(".papyrus-github-preview").length ?? 0,
      docsLinkPreviewCount: docsSection?.querySelectorAll(".papyrus-link-preview").length ?? 0,
      docsMetaCount: docsSection?.querySelectorAll(".papyrus-post-meta").length ?? 0,
      docsProjectCardCount: docsSection?.querySelectorAll(".papyrus-project-card").length ?? 0,
      docsTagsCount: docsSection?.querySelectorAll(".papyrus-post-list-tags").length ?? 0,
      listPostCount,
      noteCards,
      navLabels: Array.from(document.querySelectorAll(".papyrus-nav a")).map((link) => link.textContent?.trim() ?? ""),
      poweredByIconCount: poweredBy?.querySelectorAll("svg").length ?? 0,
      poweredByLinks,
      poweredByText: poweredBy?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      projectCards,
      themeAccentColor: accentColor,
      rssHref: rss?.getAttribute("href") ?? "",
      searchHref: search?.getAttribute("href") ?? "",
      postMoreAfterList: postsSection ? Array.from(postsSection.children).findIndex((child) => child.matches(".papyrus-section-more")) > Array.from(postsSection.children).findIndex((child) => child.matches(".papyrus-post-list")) : false,
      projectMoreAfterGrid: projectsSection ? Array.from(projectsSection.children).findIndex((child) => child.matches(".papyrus-section-more")) > Array.from(projectsSection.children).findIndex((child) => child.matches(".papyrus-project-grid")) : false,
      sectionLinks,
      tagBorderBottom: tagStyles?.borderBottomWidth ?? "",
      tagBorderLeft: tagStyles?.borderLeftWidth ?? "",
      tagBorderRight: tagStyles?.borderRightWidth ?? "",
      tagBorderTop: tagStyles?.borderTopWidth ?? "",
    };
  });

  assert(homeState.brandText === "papyrus", `home brand text was ${homeState.brandText}`);
  assert(homeState.brandHasMark, "home brand is missing the Twinkling mark");
  assert(!homeState.brandHasCursor, "home brand should not render the terminal cursor by default");
  assert(homeState.brandHref === "/", `home brand href was ${homeState.brandHref}`);
  assert(homeState.brandAriaLabel === "Home", `home brand aria-label was ${homeState.brandAriaLabel}`);
  assert(!homeState.navLabels.includes("Home"), `home nav should not include a Home tab: ${homeState.navLabels.join(", ")}`);
  assert(homeState.searchHref === "/search/", `header search icon href was ${homeState.searchHref}`);
  assert(homeState.rssHref === "/rss.xml", `footer RSS icon href was ${homeState.rssHref}`);
  assert(homeState.githubHref === "https://github.com/marcelofpfelix/papyrus", `footer GitHub social href was ${homeState.githubHref}`);
  assert(homeState.poweredByText === "Powered by papyrus and astro © 2026 papyrus", `powered-by text was ${homeState.poweredByText}`);
  assert(homeState.poweredByIconCount === 1, `powered-by icon count was ${homeState.poweredByIconCount}`);
  assert(homeState.poweredByLinks.some((link) => link.text === "papyrus" && link.href === "https://github.com/marcelofpfelix/papyrus"), `powered-by missing papyrus link: ${JSON.stringify(homeState.poweredByLinks)}`);
  assert(homeState.poweredByLinks.some((link) => link.text === "astro" && link.href === "https://astro.build/"), `powered-by missing astro link: ${JSON.stringify(homeState.poweredByLinks)}`);
  assert(homeState.iconButtons.length >= 5, `expected at least 5 icon buttons, found ${homeState.iconButtons.length}`);
  for (const button of homeState.iconButtons) {
    assert(button.backgroundColor === "rgba(0, 0, 0, 0)", `icon button ${button.ariaLabel} background was ${button.backgroundColor}`);
    assert(button.borderTop === "0px" && button.borderRight === "0px" && button.borderBottom === "0px" && button.borderLeft === "0px", `icon button ${button.ariaLabel} borders were ${JSON.stringify(button)}`);
  }
  await page.locator('.papyrus-icon-button[aria-label="Search"]').hover();
  const hoveredSearchBackground = await page.locator('.papyrus-icon-button[aria-label="Search"]').evaluate((button) => getComputedStyle(button).backgroundColor);
  assert(hoveredSearchBackground === "rgba(0, 0, 0, 0)", `hovered search icon background was ${hoveredSearchBackground}`);
  assert(homeState.homeMore.text === "about me" && homeState.homeMore.href === "/about/", `home about me link was ${JSON.stringify(homeState.homeMore)}`);
  assert(homeState.homeMore.textAlign === "right", `home more-about link parent alignment was ${homeState.homeMore.textAlign}`);
  assert(homeState.homeMore.borderTop === "0px" && homeState.homeMore.borderRight === "0px" && homeState.homeMore.borderBottom === "0px" && homeState.homeMore.borderLeft === "0px", `home more-about link had borders: ${JSON.stringify(homeState.homeMore)}`);
  assert(homeState.sectionLinks.some((link) => link.text === "more posts" && link.href === "/posts/"), `missing home more posts link: ${JSON.stringify(homeState.sectionLinks)}`);
  assert(homeState.sectionLinks.some((link) => link.text === "more projects" && link.href === "/projects/"), `missing home more projects link: ${JSON.stringify(homeState.sectionLinks)}`);
  assert(homeState.postMoreAfterList, "home more posts link was not after the posts list");
  assert(homeState.projectMoreAfterGrid, "home more projects link was not after the projects grid");
  for (const link of homeState.sectionLinks) {
    assert(link.borderTop === "0px" && link.borderRight === "0px" && link.borderBottom === "0px" && link.borderLeft === "0px", `section link ${link.text} had borders: ${JSON.stringify(link)}`);
  }
  assert(homeState.docsItems.length === 3, `expected three docs post-list items, found ${homeState.docsItems.length}: ${JSON.stringify(homeState.docsItems)}`);
  assert(homeState.docsItems.some((item) => item.title === "Docs" && item.href === "/collections/docs/"), `docs collection item was missing: ${JSON.stringify(homeState.docsItems)}`);
  assert(homeState.docsItems.some((item) => item.title === "Use the template" && item.href === "/collections/docs/install-configure-papyrus/"), `template guide item was missing: ${JSON.stringify(homeState.docsItems)}`);
  assert(homeState.docsItems.some((item) => item.title === "Package boundary" && item.href === "/collections/docs/papyrus-package-shape/"), `package boundary item was missing: ${JSON.stringify(homeState.docsItems)}`);
  assert(homeState.docsProjectCardCount === 0, `home Docs section still had ${homeState.docsProjectCardCount} project cards`);
  assert(homeState.docsLinkPreviewCount === 0, `home Docs section still had ${homeState.docsLinkPreviewCount} link preview cards`);
  assert(homeState.docsGithubPreviewCount === 0, `home Docs section still had ${homeState.docsGithubPreviewCount} GitHub preview cards`);
  assert(homeState.docsMetaCount === 0, `home Docs section still had ${homeState.docsMetaCount} date/meta rows`);
  assert(homeState.docsTagsCount === 0, `home Docs section still had ${homeState.docsTagsCount} tag rows`);
  assert(homeState.listPostCount === 6, `home list post count was ${homeState.listPostCount}`);
  assert(homeState.firstListPostTitle === "Install and configure Papyrus", `home first post title was ${homeState.firstListPostTitle}`);
  assert(!homeState.firstListPostMeta.includes("pinned"), `home pinned posts should use the pin icon without text: ${homeState.firstListPostMeta}`);
  assert(!homeState.firstListPostMeta.includes("updated"), `home first post should color updates instead of showing updated text: ${homeState.firstListPostMeta}`);
  assert(homeState.firstListPostUpdatedColor !== homeState.themeAccentColor, `home updated date text should stay muted, got accent ${homeState.firstListPostUpdatedColor}`);
  assert(homeState.firstListPostUpdatedIconColor === "", `old demo posts should not carry a recent-update icon color: ${homeState.firstListPostUpdatedIconColor}`);
  assert(homeState.firstListPostUpdatedIconPath === "", `old demo posts should not carry a recent-update icon: ${homeState.firstListPostUpdatedIconPath}`);
  assert(homeState.firstListPostBackground === homeState.projectCards[0]?.backgroundColor, `home pinned post background ${homeState.firstListPostBackground} did not match project card background ${homeState.projectCards[0]?.backgroundColor}`);
  assert(homeState.coverSrc === "/images/papyrus-layout.svg", `home list cover src was ${homeState.coverSrc}`);
  assert(homeState.coverWidth > 90 && homeState.coverWidth <= 170, `home list cover width was ${homeState.coverWidth}`);
  assert(homeState.coverHeight > 45 && homeState.coverHeight <= 110, `home list cover height was ${homeState.coverHeight}`);
  assert(homeState.coverIsRightAligned, "home list cover was not placed in the right-side column");
  const demoCoverSvg = await page.evaluate(async () => {
    const sources = Array.from(document.querySelectorAll(".papyrus-post-cover"))
      .map((image) => image.getAttribute("src"))
      .filter((source) => source?.startsWith("/demo/covers/") || source === "/images/papyrus-package-shape.svg");
    return Object.fromEntries(await Promise.all(sources.map(async (source) => [source, await fetch(source).then((response) => response.text())])));
  });
  for (const [source, svg] of Object.entries(demoCoverSvg)) {
    assert(svg.includes("var(--papyrus-"), `demo cover ${source} does not use theme tokens`);
  }
  assert(homeState.hasTag, "home page inline first tag did not render");
  assert(homeState.projectCards.some((project) => project.title === "Papyrus theme"), `home Papyrus theme card missing: ${JSON.stringify(homeState.projectCards)}`);
  assert(homeState.projectCards.every((project) => project.footerCount === 0), `home project cards should not render footer metadata rows: ${JSON.stringify(homeState.projectCards)}`);
  assert(homeState.noteCards.length === 3, `home note card count was ${homeState.noteCards.length}`);
  assert(homeState.noteCards.some((note) => note.id === "template-first" && note.text.includes("papyrus-template") && note.date === "Jul 01"), `template-first note missing or malformed: ${JSON.stringify(homeState.noteCards)}`);
  assert(homeState.noteCards.some((note) => note.tags.some((tag) => tag.text === "#config" && tag.href === "/search/?tag=config")), `note #config tag link missing: ${JSON.stringify(homeState.noteCards)}`);
  assert(homeState.noteCards.every((note) => note.backgroundColor !== "rgba(0, 0, 0, 0)" && note.borderRadius === "8px" && note.paddingTop === "14px"), `note cards do not look card-like: ${JSON.stringify(homeState.noteCards)}`);
  assert(homeState.noteCards.every((note) => note.gap === "12px"), `note list gap was not 12px: ${JSON.stringify(homeState.noteCards)}`);
  assert(homeState.noteCards.every((note) => note.tagColor !== "rgb(0, 0, 0)"), `note tag color fell back to black: ${JSON.stringify(homeState.noteCards)}`);
  assert(homeState.tagBorderTop === "0px", `post-list tag top border was ${homeState.tagBorderTop}`);
  assert(homeState.tagBorderRight === "0px", `post-list tag right border was ${homeState.tagBorderRight}`);
  assert(homeState.tagBorderBottom === "0px", `post-list tag bottom border was ${homeState.tagBorderBottom}`);
  assert(homeState.tagBorderLeft === "0px", `post-list tag left border was ${homeState.tagBorderLeft}`);
}

async function runAboutChecks(page, origin) {
  await page.goto(`${origin}/about/`, { waitUntil: "networkidle" });
  await assertPackageNavScope(page, "about");

  const aboutState = await page.evaluate(() => {
    const previews = Array.from(document.querySelectorAll(".papyrus-link-preview")).map((card) => ({
      description: card.querySelector("small")?.textContent?.trim() ?? "",
      href: card.getAttribute("href"),
      site: card.querySelector("em")?.textContent?.trim() ?? "",
      title: card.querySelector("strong")?.textContent?.trim() ?? "",
    }));
    const githubCard = document.querySelector(".papyrus-github-preview");
    return {
      githubHref: githubCard?.querySelector("a")?.getAttribute("href") ?? "",
      h1: document.querySelector("h1")?.textContent?.trim() ?? "",
      previews,
      title: document.title,
    };
  });

  assert(aboutState.h1 === "About", `about h1 was ${aboutState.h1}`);
  assert(aboutState.title.includes("About"), `about document title was ${aboutState.title}`);
  assert(aboutState.previews.some((card) => card.href === "/profile/" && card.title === "Profile"), `about page missing profile link: ${JSON.stringify(aboutState.previews)}`);
  assert(aboutState.previews.length === 1, `about page should keep one profile preview: ${JSON.stringify(aboutState.previews)}`);
  assert(aboutState.githubHref === "https://github.com/marcelofpfelix/marcelofelix", `about showcase href was ${aboutState.githubHref}`);
}

async function runProjectsChecks(page, origin) {
  await page.goto(`${origin}/projects/`, { waitUntil: "networkidle" });
  await assertPackageNavScope(page, "projects");

  const projectsState = await page.evaluate(() => {
    const projectCards = Array.from(document.querySelectorAll(".papyrus-project-card")).map((card) => ({
      descriptionHref: card.querySelector(".papyrus-project-description-link")?.getAttribute("href") ?? "",
      footerCount: card.querySelectorAll("footer").length,
      githubClass: card.classList.contains("papyrus-github-card"),
      imageHref: card.querySelector(".papyrus-project-image-link")?.getAttribute("href") ?? "",
      imageSrc: card.querySelector("img")?.getAttribute("src") ?? "",
      links: Array.from(card.querySelectorAll(".papyrus-project-links a")).map((link) => {
        const styles = getComputedStyle(link);
        return {
          borderBottom: styles.borderBottomWidth,
          borderLeft: styles.borderLeftWidth,
          borderRight: styles.borderRightWidth,
          borderTop: styles.borderTopWidth,
          href: link.getAttribute("href") ?? "",
          text: link.textContent?.replace(/\s+/g, " ").trim() ?? "",
        };
      }),
      repoHeaderCount: card.querySelectorAll(".papyrus-project-repo").length,
      title: card.querySelector("h3")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    }));
    return {
      githubPreviewCount: document.querySelectorAll(".papyrus-github-preview").length,
      h1: document.querySelector("h1")?.textContent?.trim() ?? "",
      projectCards,
      title: document.title,
    };
  });

  assert(projectsState.h1 === "Projects", `projects h1 was ${projectsState.h1}`);
  assert(projectsState.title.includes("Projects"), `projects document title was ${projectsState.title}`);
  assert(projectsState.projectCards.some((project) => project.title === "Papyrus theme"), `projects page Papyrus theme card missing: ${JSON.stringify(projectsState.projectCards)}`);
  assert(projectsState.projectCards.every((project) => project.footerCount === 0), `projects page should not render project footer metadata rows: ${JSON.stringify(projectsState.projectCards)}`);
  assert(projectsState.projectCards.every((project) => project.links.every((link) => link.borderTop === "0px" && link.borderRight === "0px" && link.borderBottom === "0px" && link.borderLeft === "0px")), `projects page action links should be borderless: ${JSON.stringify(projectsState.projectCards)}`);
  assert(projectsState.projectCards.every((project) => project.repoHeaderCount === 0), `projects page should not render duplicate top repo links: ${JSON.stringify(projectsState.projectCards)}`);
  assert(projectsState.projectCards.some((project) => project.githubClass && project.links.some((link) => link.text === "marcelofpfelix/papyrus" && link.href === "https://github.com/marcelofpfelix/papyrus")), `projects page repo action link missing: ${JSON.stringify(projectsState.projectCards)}`);
  assert(projectsState.projectCards.length === 2, `projects page should show the theme and template cards: ${JSON.stringify(projectsState.projectCards)}`);
  assert(projectsState.projectCards.some((project) => project.title === "Papyrus theme" && project.descriptionHref === "/collections/docs/" && project.links.some((link) => link.text === "docs" && link.href === "/collections/docs/") && project.links.some((link) => link.text === "marcelofpfelix/papyrus" && link.href === "https://github.com/marcelofpfelix/papyrus")), `projects page Papyrus theme links were wrong: ${JSON.stringify(projectsState.projectCards)}`);
  assert(projectsState.projectCards.some((project) => project.title === "Papyrus template" && project.descriptionHref === "https://github.com/marcelofpfelix/papyrus-template" && project.links.some((link) => link.text === "docs" && link.href === "/collections/docs/install-configure-papyrus/") && project.links.some((link) => link.text === "marcelofpfelix/papyrus-template" && link.href === "https://github.com/marcelofpfelix/papyrus-template")), `projects page Papyrus template links were wrong: ${JSON.stringify(projectsState.projectCards)}`);
  assert(projectsState.githubPreviewCount === 0, `projects page should not render duplicate standalone GitHub previews: ${projectsState.githubPreviewCount}`);
}

async function runAssetChecks(page, origin) {
  await page.goto(`${origin}/logo.svg`, { waitUntil: "load" });
  await page.locator("svg").evaluate((svg) => {
    svg.style.color = "rgb(24, 24, 27)";
    svg.style.pointerEvents = "none";
    svg.style.setProperty("--papyrus-accent", "rgb(180, 190, 254)");
  });

  const logoState = await page.locator("svg").evaluate((svg) => {
    const path = svg.querySelector("path");
    const rect = svg.querySelector("rect");
    return {
      ariaLabel: svg.getAttribute("aria-label"),
      animationName: path ? getComputedStyle(path).animationName : "",
      backgroundFill: rect ? getComputedStyle(rect).fill : "",
      fillBeforeHover: path ? getComputedStyle(path).fill : "",
      pathCount: svg.querySelectorAll("path").length,
      role: svg.getAttribute("role"),
    };
  });

  await page.locator("svg").evaluate((svg) => {
    svg.style.pointerEvents = "auto";
  });
  await page.locator("svg").hover();
  const fillAfterHover = await page.locator("path").evaluate((path) => getComputedStyle(path).fill);

  assert(logoState.role === "img", `logo role was ${logoState.role}`);
  assert(logoState.ariaLabel === "Twinkling papyrus logo", `logo aria-label was ${logoState.ariaLabel}`);
  assert(logoState.pathCount === 1, `logo path count was ${logoState.pathCount}`);
  assert(logoState.animationName === "twinkle", `logo animation was ${logoState.animationName}`);
  assert(logoState.backgroundFill === "rgb(249, 245, 215)", `logo background fill was ${logoState.backgroundFill}`);
  assert(logoState.fillBeforeHover === "rgb(101, 71, 53)", `logo fill before hover was ${logoState.fillBeforeHover}`);
  assert(fillAfterHover === "rgb(180, 190, 254)", `logo fill after hover was ${fillAfterHover}`);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${origin}/logo.svg`, { waitUntil: "load" });
  const reducedLogoCursorCount = await page.locator(".cursor").count();
  assert(reducedLogoCursorCount === 0, `Twinkling logo should not render a cursor, found ${reducedLogoCursorCount}`);
  const reducedLogoAnimation = await page.locator("path").evaluate((path) => getComputedStyle(path).animationName);
  assert(reducedLogoAnimation === "none", `reduced-motion logo animation was ${reducedLogoAnimation}`);
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  const reducedHeaderCursorCount = await page.locator(".papyrus-cursor").count();
  assert(reducedHeaderCursorCount === 0, `default Twinkling header should not render a cursor, found ${reducedHeaderCursorCount}`);
  const reducedHeaderAnimation = await page.locator(".papyrus-brand-mark").evaluate((mark) => getComputedStyle(mark).animationName);
  assert(reducedHeaderAnimation === "none", `reduced-motion header logo animation was ${reducedHeaderAnimation}`);
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

async function runMobileHeaderChecks(page, origin) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });

  const mobileState = await page.evaluate(() => {
    const desktopNav = document.querySelector(".papyrus-nav");
    const search = document.querySelector('.papyrus-header-actions a[aria-label="Search"]');
    const mobileNav = document.querySelector("details.papyrus-mobile-nav");
    const mobileSummary = mobileNav?.querySelector("summary");
    return {
      desktopNavDisplay: desktopNav ? getComputedStyle(desktopNav).display : "",
      mobileNavDisplay: mobileNav ? getComputedStyle(mobileNav).display : "",
      mobileSummaryVisible: mobileSummary ? getComputedStyle(mobileSummary).display !== "none" : false,
      searchDisplay: search ? getComputedStyle(search).display : "",
      searchHref: search?.getAttribute("href") ?? "",
    };
  });

  assert(mobileState.desktopNavDisplay === "none", `mobile desktop nav display was ${mobileState.desktopNavDisplay}`);
  assert(mobileState.searchHref === "/search/", `mobile search href was ${mobileState.searchHref}`);
  assert(mobileState.searchDisplay !== "none", `mobile search display was ${mobileState.searchDisplay}`);
  assert(mobileState.mobileNavDisplay !== "none", `mobile hamburger display was ${mobileState.mobileNavDisplay}`);
  assert(mobileState.mobileSummaryVisible, "mobile hamburger summary was not visible");
  await page.setViewportSize({ width: 1280, height: 900 });
}

async function runDocsChecks(page, origin) {
  await page.goto(`${origin}/collections/docs/`, { waitUntil: "networkidle" });

  const indexState = await page.evaluate(() => {
    const root = document.querySelector(".papyrus-content-index");
    const rootStyles = root ? getComputedStyle(root) : null;
    const nested = root?.querySelector(".papyrus-content-index");
    const nestedStyles = nested ? getComputedStyle(nested) : null;
    const rows = Array.from(document.querySelectorAll(".papyrus-content-index-row"));
    const links = Array.from(document.querySelectorAll(".papyrus-content-index a")).map((link) => ({
      href: link.getAttribute("href"),
      text: link.textContent?.trim(),
    }));
    return {
      descriptions: Array.from(document.querySelectorAll(".papyrus-content-index small")).map((item) => item.textContent?.trim() ?? ""),
      bodyText: document.body.textContent?.replace(/\s+/g, " ").trim() ?? "",
      display: rootStyles?.display ?? "",
      iconCount: document.querySelectorAll(".papyrus-content-index-row svg").length,
      linkCount: links.length,
      links,
      nestedBorderLeft: nestedStyles?.borderLeftWidth ?? "",
      nestedExists: Boolean(nested),
      rawJsonVisible: document.body.textContent?.includes('"children"') ?? false,
      rowCount: rows.length,
      rowText: rows.map((row) => row.textContent?.replace(/\s+/g, " ").trim() ?? ""),
    };
  });

  assert(indexState.display === "grid", `content index display was ${indexState.display}`);
  assert(indexState.rowCount >= 10, `content index row count was ${indexState.rowCount}`);
  assert(indexState.iconCount === indexState.rowCount, `content index icon count ${indexState.iconCount} did not match rows ${indexState.rowCount}`);
  assert(indexState.linkCount >= 10, `content index link count was ${indexState.linkCount}`);
  assert(indexState.nestedExists, "content index did not render nested children");
  assert(indexState.nestedBorderLeft === "1px", `nested content index border-left was ${indexState.nestedBorderLeft}`);
  assert(indexState.links.some((link) => link.text === "Papyrus docs" && link.href === "/collections/docs/papyrus-docs/"), `content index missing Papyrus docs link: ${JSON.stringify(indexState.links)}`);
  assert(indexState.rowText.some((text) => text.startsWith("Authoring")), `content index missing Authoring section: ${JSON.stringify(indexState.rowText)}`);
  assert(indexState.rowText.some((text) => text.startsWith("References")), `content index missing References section: ${JSON.stringify(indexState.rowText)}`);
  assert(indexState.links.some((link) => link.text === "Generated content structure" && link.href === "/collections/docs/content-structure/"), `content index missing Generated content structure link: ${JSON.stringify(indexState.links)}`);
  assert(indexState.links.some((link) => link.text === "Markdown code guide" && link.href === "/collections/docs/code-demo/"), `content index missing Markdown code guide link: ${JSON.stringify(indexState.links)}`);
  assert(indexState.links.some((link) => link.text === "Papyrus package shape" && link.href === "/collections/docs/papyrus-package-shape/"), `content index missing package boundary guide: ${JSON.stringify(indexState.links)}`);
  assert(indexState.descriptions.some((description) => description.includes("package boundary")), "content index missing package-boundary description");
  assert(!indexState.rawJsonVisible, "content index appears to expose raw JSON data");

  const sectionMenuState = await page.evaluate(() => {
    const menu = document.querySelector(".papyrus-toc");
    const summary = menu?.querySelector("[data-papyrus-toc-toggle]");
    const styles = menu ? getComputedStyle(menu) : null;
    const links = Array.from(menu?.querySelectorAll("a") ?? []).map((link) => ({
      href: link.getAttribute("href"),
      text: link.textContent?.trim(),
    }));
    return {
      ariaLabel: summary?.getAttribute("aria-label") ?? "",
      display: styles?.display ?? "",
      iconCount: summary?.querySelectorAll("svg").length ?? 0,
      links,
      position: styles?.position ?? "",
    };
  });
  assert(sectionMenuState.position === "relative", `docs collection TOC position was ${sectionMenuState.position}`);
  assert(sectionMenuState.iconCount === 1, `docs section menu icon count was ${sectionMenuState.iconCount}`);
  assert(sectionMenuState.ariaLabel === "Sections", `docs section menu aria-label was ${sectionMenuState.ariaLabel}`);
  assert(sectionMenuState.links.length >= 10, `docs section menu link count was ${sectionMenuState.links.length}`);
  assert(sectionMenuState.links.some((link) => link.text === "Authoring" && link.href === "#collection-section-authoring"), `docs section menu missing Authoring section: ${JSON.stringify(sectionMenuState.links)}`);
  assert(sectionMenuState.links.some((link) => link.text === "Feature config" && link.href === "/collections/docs/features/"), `docs section menu missing Feature config: ${JSON.stringify(sectionMenuState.links)}`);

  await page.locator("[data-papyrus-toc-toggle]").click();
  const sectionMenuOpen = await page.locator(".papyrus-toc").getAttribute("data-open");
  assert(sectionMenuOpen === "true", `docs section menu open state was ${sectionMenuOpen}`);
  await page.locator('.papyrus-toc a[href="#collection-section-authoring"]').click();
  await page.waitForTimeout(100);
  const docsHash = await page.evaluate(() => location.hash);
  assert(docsHash === "#collection-section-authoring", `docs section menu did not navigate to Authoring, hash was ${docsHash}`);

  await page.goto(`${origin}/collections/docs/features/`, { waitUntil: "networkidle" });
  const featureDocsState = await page.evaluate(() => {
    return {
      hasPluginContract: Boolean(document.querySelector("#plugin-contract")),
    };
  });
  assert(featureDocsState.hasPluginContract, "feature docs missing plugin contract section");
}

async function runContentStructureChecks(page, origin) {
  await page.goto(`${origin}/collections/docs/content-structure/`, { waitUntil: "networkidle" });
  await assertPackageNavScope(page, "generated content structure");

  const state = await page.evaluate(() => {
    return {
      bodyText: document.querySelector(".papyrus-prose")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      h1: document.querySelector("h1")?.textContent?.trim() ?? "",
      sourceHref: document.querySelector('.papyrus-prose a[href="/demo/content-structure.md"]')?.getAttribute("href") ?? "",
    };
  });

  assert(state.h1 === "Generated content structure", `generated content structure h1 was ${state.h1}`);
  assert(state.bodyText.includes("public/demo/content-tree") && state.bodyText.includes("public/demo/content-structure.md"), `generated content structure missing fixture explanation: ${state.bodyText}`);
  assert(state.bodyText.includes("Keep canonical slugs in frontmatter"), `generated content structure missing stable-route guidance: ${state.bodyText}`);
  assert(state.bodyText.includes("Development-only notes stay under .agents/"), `generated content structure missing public-boundary guidance: ${state.bodyText}`);
  assert(state.sourceHref === "/demo/content-structure.md", `generated content structure source href was ${state.sourceHref}`);
}

async function runSearchChecks(page, origin) {
  await page.goto(`${origin}/search/?tag=cv`, { waitUntil: "networkidle" });
  await page.waitForSelector(".pf-input, .pagefind-ui__search-input");
  await page.waitForFunction(() => document.querySelector(".pf-input, .pagefind-ui__search-input")?.value === "cv");
  await page.waitForFunction(() => document.body.textContent?.includes("Profile and CV"));

  const searchState = await page.evaluate(() => {
    const visiblePosts = Array.from(document.querySelectorAll(".pf-result, .pagefind-ui__result")).map((post) =>
      post.textContent?.replace(/\s+/g, " ").trim() ?? ""
    );
    const empty = document.querySelector(".papyrus-search-empty");
    return {
      inputValue: document.querySelector(".pf-input, .pagefind-ui__search-input")?.value ?? "",
      emptyHidden: empty?.hasAttribute("hidden") ?? false,
      visiblePosts,
    };
  });

  assert(searchState.inputValue === "cv", `search input value was ${searchState.inputValue}`);
  assert(searchState.visiblePosts.some((post) => post.includes("Profile and CV")), `visible search posts were ${searchState.visiblePosts.join(", ")}`);
  assert(!searchState.visiblePosts.some((post) => post.includes("Markdown authoring guide")), `search filter did not remove markdown post: ${searchState.visiblePosts.join(", ")}`);
  assert(!searchState.visiblePosts.some((post) => post.includes("Theme profiles")), `search filter did not remove theme post: ${searchState.visiblePosts.join(", ")}`);
  assert(!searchState.visiblePosts.some((post) => post.includes("Folder tags for nested posts")), `normal search should not show hidden posts: ${searchState.visiblePosts.join(", ")}`);
  assert(!searchState.emptyHidden, "search empty state should not render for #cv");

  await page.goto(`${origin}/search/?archive=hidden`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.body.textContent?.includes("Folder tags for nested posts"));
  const archiveSearchState = await page.evaluate(() => ({
    inputValue: document.querySelector(".pf-input, .pagefind-ui__search-input")?.value ?? "",
    visiblePosts: Array.from(document.querySelectorAll(".papyrus-post-list > li")).map((post) =>
      post.querySelector(".papyrus-post-title")?.textContent?.trim() ?? ""
    ),
  }));
  assert(archiveSearchState.inputValue === "", `archive search input value was ${archiveSearchState.inputValue}`);
  assert(archiveSearchState.visiblePosts.includes("Folder tags for nested posts"), `archive search did not include the hidden folder-tag post: ${archiveSearchState.visiblePosts.join(", ")}`);
  assert(archiveSearchState.visiblePosts.length >= 1, "archive search did not return hidden posts");
}

async function runPostsIndexChecks(page, origin) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${origin}/posts/`, { waitUntil: "networkidle" });
  await assertPackageNavScope(page, "posts index");

  const desktopState = await page.evaluate(() => {
    const actionLinks = Array.from(document.querySelectorAll(".papyrus-posts-hero .papyrus-actions a")).map((link) => ({
      href: link.getAttribute("href"),
      text: link.textContent?.trim(),
      iconCount: link.querySelectorAll("svg").length,
    }));
    const firstPostTag = document.querySelector("[data-posts-view='list'] .papyrus-post-inline-tag");
    const firstPostTagStyles = firstPostTag ? getComputedStyle(firstPostTag) : null;
    const listCover = document.querySelector('[data-posts-view="list"] .papyrus-post-list-list .papyrus-post-cover');
    const listCoverBox = listCover?.getBoundingClientRect();
    const listLinkBox = listCover?.closest("a")?.getBoundingClientRect();
	    const timelineLink = actionLinks.find((link) => link.href === "/posts/timeline/");
	    const archiveLink = actionLinks.find((link) => link.href === "/search/?archive=hidden");
    const firstTitles = {
      list: document.querySelector('[data-posts-view="list"] .papyrus-post-list-list li .papyrus-post-title')?.textContent?.trim() ?? "",
    };
    const firstListItem = document.querySelector('[data-posts-view="list"] .papyrus-post-list-list li');
    const firstListMeta = firstListItem?.querySelector(".papyrus-post-meta")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const firstUpdatedMeta = document.querySelector('[data-posts-view="list"] .papyrus-post-recently-updated');
    const firstUpdatedIcon = firstUpdatedMeta?.querySelector("svg");
    const firstUpdatedMetaStyles = firstUpdatedMeta ? getComputedStyle(firstUpdatedMeta) : null;
    const firstUpdatedIconStyles = firstUpdatedIcon ? getComputedStyle(firstUpdatedIcon) : null;
    const accentProbe = document.createElement("span");
    accentProbe.style.color = "var(--papyrus-accent)";
    document.body.append(accentProbe);
    const accentColor = getComputedStyle(accentProbe).color;
    accentProbe.remove();
    return {
	      alternateViewCount: document.querySelectorAll('[data-posts-view="compact"], [data-posts-view="cards"]').length,
	      archiveHref: archiveLink?.href ?? "",
	      archiveIconCount: archiveLink?.iconCount ?? 0,
	      archiveText: archiveLink?.text?.replace(/\s+/g, " ").trim() ?? "",
	      hiddenPostVisible: Array.from(document.querySelectorAll('[data-posts-view="list"] .papyrus-post-list-list li .papyrus-post-title')).some((title) => title.textContent?.trim() === "Folder tags for nested posts"),
      firstPostTagBorderWidths: firstPostTagStyles
        ? [
            firstPostTagStyles.borderTopWidth,
            firstPostTagStyles.borderRightWidth,
            firstPostTagStyles.borderBottomWidth,
            firstPostTagStyles.borderLeftWidth,
          ]
        : [],
      firstPostTagText: firstPostTag?.textContent?.trim() ?? "",
      firstListHasUpdatedColorState: Boolean(firstUpdatedMeta),
      firstListUpdatedTextColor: firstUpdatedMetaStyles?.color ?? "",
      firstListUpdatedIconColor: firstUpdatedIconStyles?.color ?? "",
      firstListUpdatedIconPath: firstUpdatedIcon?.querySelector("path")?.getAttribute("d") ?? "",
      firstListMeta,
      firstTitles,
      themeAccentColor: accentColor,
      actionLinks,
      listCount: document.querySelectorAll('[data-posts-view="list"] .papyrus-post-list-list li').length,
      listCoverIsRightAligned: listCoverBox && listLinkBox ? listCoverBox.left > listLinkBox.left + (listLinkBox.width / 2) : false,
      listCoverWidth: listCoverBox?.width ?? 0,
      timelineIconCount: timelineLink?.iconCount ?? 0,
      timelineHref: timelineLink?.href ?? "",
      title: document.querySelector("h1")?.textContent?.trim() ?? "",
    };
  });

  assert(desktopState.title === "Posts", `posts index title was ${desktopState.title}`);
  assert(desktopState.listCount === 20, `posts list should respect the configured default limit of 20, got ${desktopState.listCount}`);
  assert(!desktopState.hiddenPostVisible, "posts list should not show hidden posts by default");
  assert(desktopState.alternateViewCount === 0, `posts index should only render list view, got ${desktopState.alternateViewCount} alternate views`);
  assert(desktopState.firstTitles.list === "Install and configure Papyrus", `posts list first title was ${desktopState.firstTitles.list}`);
  assert(!desktopState.firstListMeta.includes("pinned"), `posts pinned meta should use the pin icon without text: ${desktopState.firstListMeta}`);
  assert(!desktopState.firstListMeta.includes("updated"), `posts first list item should color updates instead of showing updated text: ${desktopState.firstListMeta}`);
  assert(!desktopState.firstListHasUpdatedColorState, "old demo posts should not be marked as recently updated");
  assert(desktopState.firstListUpdatedIconColor === "" && desktopState.firstListUpdatedIconPath === "", `old demo posts should not carry a recent-update icon: ${JSON.stringify(desktopState)}`);
  assert(desktopState.listCoverWidth > 90 && desktopState.listCoverWidth <= 170, `posts list cover width was ${desktopState.listCoverWidth}`);
  assert(desktopState.listCoverIsRightAligned, "posts list cover was not right aligned");
  assert(desktopState.actionLinks.some((link) => link.text === "Tags" && link.href === "/tag/" && link.iconCount === 1), `posts actions missing Tags link: ${JSON.stringify(desktopState.actionLinks)}`);
  assert(desktopState.firstPostTagText.startsWith("#"), `post-list tag should include # prefix, got ${desktopState.firstPostTagText}`);
  assert(desktopState.firstPostTagBorderWidths.every((width) => width === "0px"), `post-list tag borders were ${desktopState.firstPostTagBorderWidths.join(", ")}`);
	  assert(desktopState.timelineHref === "/posts/timeline/", `posts timeline href was ${desktopState.timelineHref}`);
	  assert(desktopState.timelineIconCount === 1, `posts timeline icon count was ${desktopState.timelineIconCount}`);
  assert(desktopState.archiveHref === "/search/?archive=hidden", `posts archive href was ${desktopState.archiveHref}`);
  assert(desktopState.archiveText === "Archive", `posts archive text was ${desktopState.archiveText}`);
  assert(desktopState.archiveIconCount === 1, `posts archive icon count was ${desktopState.archiveIconCount}`);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${origin}/posts/`, { waitUntil: "networkidle" });
  const mobileState = await page.evaluate(() => {
    const actions = Array.from(document.querySelectorAll(".papyrus-posts-hero .papyrus-actions a")).map((link) => link.textContent?.trim());
    const inlineTags = Array.from(document.querySelectorAll("[data-posts-view='list'] .papyrus-post-inline-tag")).map((tag) => tag.textContent?.trim());
    return {
      alternateViewCount: document.querySelectorAll('[data-posts-view="compact"], [data-posts-view="cards"]').length,
      listCount: document.querySelectorAll('[data-posts-view="list"] .papyrus-post-list-list li').length,
      mobileNavDisplay: getComputedStyle(document.querySelector(".papyrus-mobile-nav")).display,
      actions,
      inlineTags,
    };
  });

  assert(mobileState.mobileNavDisplay !== "none", `posts mobile hamburger display was ${mobileState.mobileNavDisplay}`);
	  assert(mobileState.listCount === 20 && mobileState.alternateViewCount === 0, `mobile posts view counts were ${JSON.stringify(mobileState)}`);
  assert(mobileState.actions.includes("Tags") && mobileState.actions.includes("Timeline"), `mobile posts actions missing expected links: ${JSON.stringify(mobileState)}`);
  assert(mobileState.inlineTags.some((tag) => tag?.startsWith("#")), `mobile inline first tags missing: ${JSON.stringify(mobileState)}`);

  await page.goto(`${origin}/posts/timeline/`, { waitUntil: "networkidle" });
  const timelineState = await page.evaluate(() => ({
    archiveYears: document.querySelectorAll(".papyrus-archive-list h2").length,
    linkCount: document.querySelectorAll(".papyrus-archive-list a").length,
    title: document.querySelector("h1")?.textContent?.trim() ?? "",
  }));
  assert(timelineState.title === "Timeline", `timeline page title was ${timelineState.title}`);
  assert(timelineState.archiveYears >= 1, `timeline year group count was ${timelineState.archiveYears}`);
  assert(timelineState.linkCount >= 20, `timeline should include at least the posts-index page size, got ${timelineState.linkCount}`);
}

async function runPostChecks(page, origin) {
  await page.goto(`${origin}/posts/markdown-feature-sample/`, { waitUntil: "networkidle" });
  await assertPackageNavScope(page, "markdown feature post");
  await page.waitForSelector(".astro-code");

  const tocState = await page.evaluate(() => {
    const toc = document.querySelector("details.papyrus-toc");
    const summary = toc?.querySelector("summary");
    return {
      open: toc?.hasAttribute("open") ?? null,
      summaryText: summary?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    };
  });
  assert(tocState.open === false, "post TOC should be collapsed by default");
  assert(tocState.summaryText === "On this page", `post TOC summary was ${tocState.summaryText}`);

  const codeButtons = await page.locator(".papyrus-copy-button, [data-papyrus-copy]").count();
  assert(codeButtons === 0, `Pure code-block behavior should not inject copy buttons, found ${codeButtons}`);

  await page.locator("[data-papyrus-copy-source]").click();
  await page.waitForFunction(() => document.querySelector("[data-papyrus-copy-source] .papyrus-button-label")?.textContent === "Markdown copied");
  const sourceCopy = await clipboardText(page);
  assert(sourceCopy.includes("# Markdown source reference"), "copy markdown did not copy source markdown title");
  assert(sourceCopy.includes("```console"), "copy markdown did not copy source code fence");
  const sourceLabel = await page.locator("[data-papyrus-copy-source] .papyrus-button-label").textContent();
  assert(sourceLabel === "Markdown copied", `copy markdown label was ${sourceLabel}`);

  await page.locator("[data-papyrus-share]").click();
  await page.waitForFunction(() => document.querySelector("[data-papyrus-share] .papyrus-button-label")?.textContent === "Link copied");
  const shareCopy = await clipboardText(page);
  assert(shareCopy.includes("/posts/markdown-feature-sample/"), "share fallback did not copy current URL");
  const shareState = await page.locator("[data-papyrus-share]").evaluate((button) => {
    const styles = getComputedStyle(button);
    const sourceButton = document.querySelector("[data-papyrus-copy-source]");
    const sourceStyles = sourceButton ? getComputedStyle(sourceButton) : null;
    const backLink = document.querySelector(".papyrus-post-back a[href='/posts/']");
    const backLinkBox = backLink?.getBoundingClientRect();
    const headerBox = document.querySelector(".papyrus-post-header")?.getBoundingClientRect();
    const proseBox = document.querySelector(".papyrus-prose")?.getBoundingClientRect();
    const footerBox = document.querySelector(".papyrus-post-footer")?.getBoundingClientRect();
    const icon = button.querySelector(".papyrus-share-icon");
    const iconStyles = icon ? getComputedStyle(icon) : null;
    const hint = button.querySelector(".papyrus-share-copy small");
    return {
      backgroundColor: styles.backgroundColor,
      sourceBackgroundColor: sourceStyles?.backgroundColor ?? "",
      borderRadius: styles.borderRadius,
      borderWidths: [styles.borderTopWidth, styles.borderRightWidth, styles.borderBottomWidth, styles.borderLeftWidth],
      sourceBorderWidths: sourceStyles
        ? [sourceStyles.borderTopWidth, sourceStyles.borderRightWidth, sourceStyles.borderBottomWidth, sourceStyles.borderLeftWidth]
        : [],
      backAboveHeader: backLinkBox && headerBox ? backLinkBox.bottom <= headerBox.top : false,
      footerAfterProse: footerBox && proseBox ? footerBox.top >= proseBox.bottom : false,
      headerMetaCount: document.querySelectorAll(".papyrus-post-header .papyrus-meta-item").length,
      headerTagCount: document.querySelectorAll(".papyrus-post-header .papyrus-tags a").length,
      headerToolCount: document.querySelectorAll(".papyrus-post-header .papyrus-post-tools button, .papyrus-post-header .papyrus-post-tools a").length,
      backLabel: backLink?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      backIconCount: backLink?.querySelectorAll("svg").length ?? 0,
      display: styles.display,
      gridTemplateColumns: styles.gridTemplateColumns,
      hasIconBadge: Boolean(icon),
      hint: hint?.textContent?.trim() ?? "",
      iconBackground: iconStyles?.backgroundColor ?? "",
      label: button.querySelector(".papyrus-button-label")?.textContent?.trim() ?? "",
      state: button.getAttribute("data-state") ?? "",
    };
  });
  const shareLabel = shareState.label;
  assert(shareLabel === "Link copied", `share label was ${shareLabel}`);
  assert(["grid", "inline-grid"].includes(shareState.display), `share button display was ${shareState.display}`);
  assert(shareState.hasIconBadge, "share button missing icon badge");
  assert(shareState.hint === "Copy link", `share hint was ${shareState.hint}`);
  assert(shareState.borderRadius === "999px", `share button radius was ${shareState.borderRadius}`);
  assert(shareState.state === "link-copied", `share button state was ${shareState.state}`);
  assert(shareState.backLabel === "Back", `post back link label was ${shareState.backLabel}`);
  assert(shareState.backIconCount === 1, `post back link icon count was ${shareState.backIconCount}`);
  assert(shareState.backAboveHeader, "post back link should render above the post header");
  assert(shareState.headerMetaCount === 0, `post header should not contain date metadata, found ${shareState.headerMetaCount}`);
  assert(shareState.headerTagCount === 0, `post header should not contain tags, found ${shareState.headerTagCount}`);
  assert(shareState.headerToolCount === 0, `post header should not contain share/source tools, found ${shareState.headerToolCount}`);
  assert(shareState.footerAfterProse, "post footer with metadata/tags/actions should render after prose");
  assert(shareState.borderWidths.every((width) => width === "0px"), `share button borders were ${shareState.borderWidths.join(", ")}`);
  assert(shareState.sourceBorderWidths.every((width) => width === "0px"), `source button borders were ${shareState.sourceBorderWidths.join(", ")}`);
  assert(shareState.backgroundColor === shareState.sourceBackgroundColor, `share background ${shareState.backgroundColor} did not match normal button ${shareState.sourceBackgroundColor}`);
  assert(["rgba(0, 0, 0, 0)", "transparent"].includes(shareState.iconBackground), `share icon background should be transparent, got ${shareState.iconBackground}`);

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: (data) => Boolean(data?.url),
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data) => {
        window.__papyrusSharePayload = data;
      },
    });
  });
  await page.goto(`${origin}/posts/markdown-feature-sample/`, { waitUntil: "networkidle" });
  await page.locator("[data-papyrus-share]").click();
  await page.waitForFunction(() => Boolean(window.__papyrusSharePayload));
  const webShareState = await page.evaluate(() => ({
    buttonLabel: document.querySelector("[data-papyrus-share] .papyrus-button-label")?.textContent?.trim() ?? "",
    description: document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "",
    payload: window.__papyrusSharePayload,
    title: document.title,
  }));
  assert(webShareState.buttonLabel === "Share", `web share should not use copy fallback label, got ${webShareState.buttonLabel}`);
  assert(webShareState.payload?.title === webShareState.title, `web share title was ${webShareState.payload?.title}`);
  assert(webShareState.payload?.url?.includes("/posts/markdown-feature-sample/"), `web share URL was ${webShareState.payload?.url}`);
  assert(webShareState.payload?.text === webShareState.description, `web share text was ${webShareState.payload?.text}`);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${origin}/posts/markdown-feature-sample/`, { waitUntil: "networkidle" });
  const mobileShare = await page.locator("[data-papyrus-share]").evaluate((button) => {
    const box = button.getBoundingClientRect();
    return {
      display: getComputedStyle(button).display,
      height: box.height,
      width: box.width,
    };
  });
  assert(["grid", "inline-grid"].includes(mobileShare.display), `mobile share display was ${mobileShare.display}`);
  assert(mobileShare.height >= 42, `mobile share height was ${mobileShare.height}`);
  assert(mobileShare.width <= 180, `mobile share width was ${mobileShare.width}`);

  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async () => {
        throw new Error("forced clipboard rejection");
      },
    });
    window.prompt = () => null;
  });

  await page.locator("[data-papyrus-copy-source]").click();
  await page.waitForFunction(() => document.querySelector("[data-papyrus-copy-source]")?.getAttribute("data-state") === "copy-markdown");
  await page.locator("[data-papyrus-share]").click();
  await page.waitForFunction(() => document.querySelector("[data-papyrus-share]")?.getAttribute("data-state") === "copy-link");
  await page.locator("[data-papyrus-copy-citation]").click();
  await page.waitForFunction(() => document.querySelector("[data-papyrus-copy-citation]")?.getAttribute("data-state") === "copy-title-+-link");
  const rejectedCopyStates = await page.evaluate(() => ({
    citation: document.querySelector("[data-papyrus-copy-citation]")?.getAttribute("data-state") ?? "",
    source: document.querySelector("[data-papyrus-copy-source]")?.getAttribute("data-state") ?? "",
    share: document.querySelector("[data-papyrus-share]")?.getAttribute("data-state") ?? "",
  }));
  assert(!Object.values(rejectedCopyStates).includes("failed"), `clipboard rejection showed false failed state: ${JSON.stringify(rejectedCopyStates)}`);
  assert(rejectedCopyStates.source === "copy-markdown", `source fallback state was ${rejectedCopyStates.source}`);
  assert(rejectedCopyStates.share === "copy-link", `share fallback state was ${rejectedCopyStates.share}`);
  assert(rejectedCopyStates.citation === "copy-title-+-link", `citation fallback state was ${rejectedCopyStates.citation}`);

  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.evaluate(() => localStorage.setItem("papyrus-mode", "system"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelectorAll(".papyrus-mermaid svg").length >= 2, null, { timeout: 10000 });
  const mermaidCount = await page.locator(".papyrus-mermaid svg").count();
  assert(mermaidCount >= 2, `expected inline and artifact Mermaid SVGs, found ${mermaidCount}`);
  const mermaidErrors = await page.locator('.papyrus-mermaid[data-error="true"]').count();
  assert(mermaidErrors === 0, `found ${mermaidErrors} Mermaid render errors`);
  const mermaidBeforeTheme = await page.locator(".papyrus-mermaid svg").first().evaluate((svg) => ({
    fg: getComputedStyle(document.documentElement).getPropertyValue("--papyrus-fg").trim(),
    id: svg.id,
    html: svg.outerHTML,
  }));
  const blockquoteBeforeTheme = await page.locator("blockquote").first().evaluate((blockquote) => ({
    borderLeftColor: getComputedStyle(blockquote).borderLeftColor,
    color: getComputedStyle(blockquote).color,
  }));
  assert(blockquoteBeforeTheme.borderLeftColor !== "rgb(0, 0, 0)", "blockquote border color is black before theme change");

  const plantUmlStatus = await page.locator('a[href="/demo/call-flow.puml"] .papyrus-artifact-status').textContent();
  assert(plantUmlStatus?.includes("needs a local or server renderer"), "PlantUML artifact status was not explicit");
  const excalidrawStatus = await page.locator('a[href="/demo/sketch.excalidraw"] .papyrus-artifact-status').textContent();
  assert(excalidrawStatus?.includes("needs an Excalidraw renderer"), "Excalidraw artifact status was not explicit");

  const meta = await page.locator(".papyrus-meta-item").allTextContents();
  assert(meta.some((item) => item.includes("July")), "post metadata did not include published date");
  assert(meta.some((item) => item.includes("3 min read")), "post metadata did not include read time");
  await page.waitForFunction(() => document.querySelector('[data-papyrus-remote-stats] [data-papyrus-stat="views"]')?.textContent?.trim() === "321 views");
  const postStatsState = await page.evaluate(() => {
    const stats = Array.from(document.querySelectorAll(".papyrus-post-stats")).map((item) => item.textContent?.replace(/\s+/g, " ").trim() ?? "");
    const remote = document.querySelector("[data-papyrus-remote-stats]");
    const comments = document.querySelector(".papyrus-comments");
    return {
      commentsText: comments?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      remoteAfterComments: Boolean(comments && remote && (comments.compareDocumentPosition(remote) & Node.DOCUMENT_POSITION_FOLLOWING)),
      remoteComments: remote?.querySelector('[data-papyrus-stat="comments"]')?.textContent?.trim() ?? "",
      remoteEndpoint: remote?.getAttribute("data-endpoint") ?? "",
      remoteSlug: remote?.getAttribute("data-slug") ?? "",
      remoteViews: remote?.querySelector('[data-papyrus-stat="views"]')?.textContent?.trim() ?? "",
      stats,
    };
  });
  assert(postStatsState.stats.some((item) => item.includes("128 views") && item.includes("4 comments")), `static post stats missing: ${JSON.stringify(postStatsState.stats)}`);
  assert(postStatsState.remoteEndpoint === "/demo/post-stats.json", `remote stats endpoint was ${postStatsState.remoteEndpoint}`);
  assert(postStatsState.remoteSlug === "markdown-feature-sample", `remote stats slug was ${postStatsState.remoteSlug}`);
  assert(postStatsState.remoteViews === "321 views", `remote views text was ${postStatsState.remoteViews}`);
  assert(postStatsState.remoteComments === "7 comments", `remote comments text was ${postStatsState.remoteComments}`);
  assert(postStatsState.remoteAfterComments, "remote stats should render after the comments section in the bottom stats slot");
  assert(postStatsState.commentsText.includes("Demo mode: configure Giscus"), `Giscus fallback missing: ${postStatsState.commentsText}`);
  const tags = await page.locator(".papyrus-tags a").allTextContents();
  assert(tags.includes("#authoring") && tags.includes("#markdown"), `post tags missing expected # links: ${tags.join(", ")}`);
  const postTagBorders = await page.locator(".papyrus-tags a").first().evaluate((tag) => {
    const styles = getComputedStyle(tag);
    return [styles.borderTopWidth, styles.borderRightWidth, styles.borderBottomWidth, styles.borderLeftWidth];
  });
  assert(postTagBorders.every((width) => width === "0px"), `post tag link borders were ${postTagBorders.join(", ")}`);

  const sideLinks = await page.locator(".papyrus-post-side-links a").evaluateAll((links) => {
    const sideNav = document.querySelector(".papyrus-post-side-links");
    const adjacentNav = document.querySelector(".papyrus-adjacent-posts");
    const sideBox = sideNav?.getBoundingClientRect();
    const adjacentBox = adjacentNav?.getBoundingClientRect();
    return links.map((link) => {
      const styles = getComputedStyle(link);
      return {
        borderWidths: [styles.borderTopWidth, styles.borderRightWidth, styles.borderBottomWidth, styles.borderLeftWidth],
        href: link.getAttribute("href"),
        sideAfterAdjacent: sideBox && adjacentBox ? sideBox.top >= adjacentBox.bottom : false,
        text: link.textContent?.trim(),
      };
    });
  });
  assert(sideLinks.length >= 1, `expected at least 1 post side link, found ${sideLinks.length}`);
  assert(sideLinks.some((link) => link.text === "more posts" && link.href === "/posts/" && link.sideAfterAdjacent), `missing end-of-post more posts link after adjacent nav: ${JSON.stringify(sideLinks)}`);
  assert(!sideLinks.some((link) => link.text?.toLowerCase().includes("search") || link.href?.includes("search")), "post side links should not include search");
  for (const link of sideLinks) {
    assert(link.borderWidths.every((width) => width === "0px"), `post side link borders were ${link.borderWidths.join(", ")}`);
  }

  const adjacentLinks = await page.locator(".papyrus-adjacent-posts a").evaluateAll((links) => {
    const nav = document.querySelector(".papyrus-adjacent-posts");
    const navBox = nav?.getBoundingClientRect();
    const navStyles = nav ? getComputedStyle(nav) : null;
    return links.map((link) => {
      const box = link.getBoundingClientRect();
      return {
        href: link.getAttribute("href"),
        label: link.querySelector("span")?.textContent?.trim(),
        leftAligned: navBox ? box.left < navBox.left + navBox.width * 0.25 : false,
        navBorderTop: navStyles?.borderTopWidth ?? "",
        rightAligned: navBox ? box.right > navBox.right - navBox.width * 0.25 : false,
        title: link.querySelector("strong")?.textContent?.trim(),
      };
    });
  });
  assert(adjacentLinks.length === 2, `expected 2 adjacent post links, found ${adjacentLinks.length}`);
  assert(adjacentLinks.some((link) => link.label === "Previous" && link.title === "Theme profiles" && link.href === "/posts/theme-profiles/"), `missing previous adjacent link: ${JSON.stringify(adjacentLinks)}`);
  assert(adjacentLinks.some((link) => link.label === "Next" && link.title === "Markdown authoring guide" && link.href === "/posts/markdown-feature-sample/"), `missing next adjacent link: ${JSON.stringify(adjacentLinks)}`);
	  assert(adjacentLinks.every((link) => link.navBorderTop === "0px"), `adjacent posts nav should be borderless: ${JSON.stringify(adjacentLinks)}`);
	  assert(adjacentLinks.some((link) => link.label === "Previous" && link.leftAligned), `previous adjacent link should align left: ${JSON.stringify(adjacentLinks)}`);
	  assert(adjacentLinks.some((link) => link.label === "Next" && link.rightAligned), `next adjacent link should align right: ${JSON.stringify(adjacentLinks)}`);

	  await page.setViewportSize({ width: 390, height: 900 });
	  await page.goto(`${origin}/posts/dark-mode-and-search/`, { waitUntil: "networkidle" });
	  const mobileAdjacentLinks = await page.locator(".papyrus-adjacent-posts a").evaluateAll((links) => {
	    const nav = document.querySelector(".papyrus-adjacent-posts");
	    const navBox = nav?.getBoundingClientRect();
	    const navColumns = nav ? getComputedStyle(nav).gridTemplateColumns : "";
	    return links.map((link) => {
	      const box = link.getBoundingClientRect();
	      return {
	        label: link.querySelector("span")?.textContent?.trim(),
	        leftAligned: navBox ? box.left < navBox.left + navBox.width * 0.25 : false,
	        navColumns,
	        rightAligned: navBox ? box.right > navBox.right - navBox.width * 0.25 : false,
	      };
	    });
	  });
	  assert(mobileAdjacentLinks.length === 2, `expected 2 mobile adjacent post links, found ${mobileAdjacentLinks.length}`);
	  assert(!mobileAdjacentLinks.some((link) => link.navColumns === "1fr"), `mobile adjacent posts collapsed to one column: ${JSON.stringify(mobileAdjacentLinks)}`);
	  assert(mobileAdjacentLinks.some((link) => link.label === "Previous" && link.leftAligned), `mobile previous adjacent link should align left: ${JSON.stringify(mobileAdjacentLinks)}`);
	  assert(mobileAdjacentLinks.some((link) => link.label === "Next" && link.rightAligned), `mobile next adjacent link should align right: ${JSON.stringify(mobileAdjacentLinks)}`);
	
	  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForFunction(() => document.querySelector("[data-papyrus-header]")?.getAttribute("data-papyrus-hidden") === "true");
  await page.waitForFunction(() => document.querySelector("[data-papyrus-back-to-top]")?.getAttribute("data-visible") === "true");
  const backToTopLabel = await page.locator("[data-papyrus-back-to-top]").getAttribute("aria-label");
  assert(backToTopLabel === "Back to top", `back-to-top label was ${backToTopLabel}`);
  const hiddenBackground = await page.locator("[data-papyrus-header]").evaluate((element) => getComputedStyle(element).backgroundColor);
  assert(hiddenBackground && hiddenBackground !== "rgba(0, 0, 0, 0)", "header background is transparent while hidden");
  await page.locator("[data-papyrus-back-to-top]").click();
  await page.waitForFunction(() => window.scrollY < 20);
  await page.evaluate(() => window.scrollTo(0, 120));
  await page.waitForFunction(() => document.querySelector("[data-papyrus-header]")?.getAttribute("data-papyrus-hidden") === "false");

  const modeButtonInitial = await footerModeButtonState(page);
  assert(modeButtonInitial.dataTheme === "system", `initial mode button theme was ${modeButtonInitial.dataTheme}`);
  assert(modeButtonInitial.localStorageMode === "system", `initial stored mode was ${modeButtonInitial.localStorageMode}`);
  assert(modeButtonInitial.ariaLabel === "Color mode: system", `initial mode aria label was ${modeButtonInitial.ariaLabel}`);
  assert(modeButtonInitial.text === "", `mode button should be icon-only, found text ${modeButtonInitial.text}`);
  assert(modeButtonInitial.width >= 32 && modeButtonInitial.width <= 44, `mode button width was ${modeButtonInitial.width}`);
  assert(modeButtonInitial.height >= 32 && modeButtonInitial.height <= 44, `mode button height was ${modeButtonInitial.height}`);
  assert(Math.abs(modeButtonInitial.width - modeButtonInitial.height) <= 2, `mode button was not square: ${modeButtonInitial.width}x${modeButtonInitial.height}`);
  assert(modeButtonInitial.visibleIcons.length === 1 && modeButtonInitial.visibleIcons[0].includes("papyrus-mode-system"), `initial visible mode icons were ${JSON.stringify(modeButtonInitial.visibleIcons)}`);

  await page.locator("[data-papyrus-theme-toggle]").click();
  const modeButtonDark = await footerModeButtonState(page);
  assert(modeButtonDark.dataTheme === "dark", `dark mode button theme was ${modeButtonDark.dataTheme}`);
  assert(modeButtonDark.localStorageMode === "dark", `stored mode after first click was ${modeButtonDark.localStorageMode}`);
  assert(modeButtonDark.ariaLabel === "Color mode: dark", `dark mode aria label was ${modeButtonDark.ariaLabel}`);
  assert(modeButtonDark.visibleIcons.length === 1 && modeButtonDark.visibleIcons[0].includes("papyrus-mode-dark"), `dark visible mode icons were ${JSON.stringify(modeButtonDark.visibleIcons)}`);
  await page.waitForFunction((previousId) => {
    const svg = document.querySelector(".papyrus-mermaid svg");
    return Boolean(svg && svg.id && svg.id !== previousId);
  }, mermaidBeforeTheme.id);
  const mermaidAfterTheme = await page.locator(".papyrus-mermaid svg").first().evaluate((svg) => ({
    fg: getComputedStyle(document.documentElement).getPropertyValue("--papyrus-fg").trim(),
    id: svg.id,
    html: svg.outerHTML,
  }));
  assert(mermaidAfterTheme.id !== mermaidBeforeTheme.id, "Mermaid SVG did not re-render after theme change");
  assert(mermaidAfterTheme.fg !== mermaidBeforeTheme.fg, "theme foreground token did not change before Mermaid assertion");
  assert(mermaidAfterTheme.html.includes(mermaidAfterTheme.fg), `Mermaid SVG did not include active foreground ${mermaidAfterTheme.fg}`);
  const blockquoteAfterTheme = await page.locator("blockquote").first().evaluate((blockquote) => ({
    borderLeftColor: getComputedStyle(blockquote).borderLeftColor,
    color: getComputedStyle(blockquote).color,
  }));
  assert(blockquoteAfterTheme.borderLeftColor !== blockquoteBeforeTheme.borderLeftColor, "blockquote border color did not change with theme");
  assert(blockquoteAfterTheme.color !== blockquoteBeforeTheme.color, "blockquote text color did not change with theme");

  await page.locator("[data-papyrus-theme-toggle]").click();
  const modeButtonLight = await footerModeButtonState(page);
  assert(modeButtonLight.dataTheme === "light", `light mode button theme was ${modeButtonLight.dataTheme}`);
  assert(modeButtonLight.localStorageMode === "light", `stored mode after second click was ${modeButtonLight.localStorageMode}`);
  assert(modeButtonLight.ariaLabel === "Color mode: light", `light mode aria label was ${modeButtonLight.ariaLabel}`);
  assert(modeButtonLight.visibleIcons.length === 1 && modeButtonLight.visibleIcons[0].includes("papyrus-mode-light"), `light visible mode icons were ${JSON.stringify(modeButtonLight.visibleIcons)}`);

  await page.locator("[data-papyrus-theme-toggle]").click();
  const modeButtonSystem = await footerModeButtonState(page);
  assert(modeButtonSystem.dataTheme === "system", `cycled mode button theme was ${modeButtonSystem.dataTheme}`);
  assert(modeButtonSystem.localStorageMode === "system", `stored mode after third click was ${modeButtonSystem.localStorageMode}`);
  assert(modeButtonSystem.ariaLabel === "Color mode: system", `cycled mode aria label was ${modeButtonSystem.ariaLabel}`);
  assert(modeButtonSystem.visibleIcons.length === 1 && modeButtonSystem.visibleIcons[0].includes("papyrus-mode-system"), `cycled visible mode icons were ${JSON.stringify(modeButtonSystem.visibleIcons)}`);

  await page.locator("details.papyrus-control-menu").first().locator("summary").click();
  const availableThemeProfiles = await page.locator("[data-papyrus-theme-profile-value]").evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("data-papyrus-theme-profile-value"))
  );
  for (const profile of themeProfiles) {
    assert(availableThemeProfiles.includes(profile), `theme profile control missing ${profile}: ${JSON.stringify(availableThemeProfiles)}`);
  }
  await page.locator('[data-papyrus-theme-profile-value="tokyo-night"]').click();
  await page.waitForFunction(() => {
    const root = document.documentElement;
    return root.dataset.papyrusTheme === "tokyo-night"
      && localStorage.getItem("papyrus-theme") === "tokyo-night"
      && getComputedStyle(root).getPropertyValue("--papyrus-theme-color").trim() === "#e1e2e7";
  });
  const tokyoThemeProfile = await page.evaluate(() => document.documentElement.dataset.papyrusTheme);
  assert(tokyoThemeProfile === "tokyo-night", `Tokyo Night theme profile was ${tokyoThemeProfile}`);

  await page.locator("details.papyrus-control-menu").first().locator("summary").click();
  await page.locator('[data-papyrus-theme-profile-value="pure"]').click();
  await page.waitForFunction(() => {
    const root = document.documentElement;
    return root.dataset.papyrusTheme === "pure"
      && getComputedStyle(root).getPropertyValue("--papyrus-theme-color").trim() === "#fcfcfd"
      && document.querySelector('meta[name="theme-color"]')?.getAttribute("content") === "#fcfcfd";
  });
  const themeProfile = await page.evaluate(() => document.documentElement.dataset.papyrusTheme);
  assert(themeProfile === "pure", `theme profile was ${themeProfile}`);
  const pureLightBackgroundState = await page.evaluate(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    return {
      htmlBackground: styles.backgroundColor,
      rootBackground: styles.getPropertyValue("--papyrus-bg").trim(),
      themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? "",
    };
  });
  assert(pureLightBackgroundState.rootBackground === "#fcfcfd", `pure light --papyrus-bg was ${pureLightBackgroundState.rootBackground}`);
  assert(pureLightBackgroundState.themeColor === "#fcfcfd", `pure light theme-color was ${pureLightBackgroundState.themeColor}`);
  assert(pureLightBackgroundState.htmlBackground === "rgb(252, 252, 253)", `pure light html background was ${pureLightBackgroundState.htmlBackground}`);
  const themeDetailsOpen = await page.locator("details.papyrus-control-menu").first().getAttribute("open");
  assert(themeDetailsOpen === null, "theme dropdown did not close after choosing a profile");
  const themeProfileActiveState = await page.locator("[data-papyrus-theme-profile-value]").evaluateAll((buttons) =>
    buttons.map((button) => ({
      active: button.getAttribute("data-active"),
      value: button.getAttribute("data-papyrus-theme-profile-value"),
    }))
  );
  assert(themeProfileActiveState.some((button) => button.value === "pure" && button.active === "true"), `pure theme profile was not active: ${JSON.stringify(themeProfileActiveState)}`);
  assert(themeProfileActiveState.some((button) => button.value === "catppuccin" && button.active === "false"), `catppuccin theme profile should be inactive: ${JSON.stringify(themeProfileActiveState)}`);

  await page.locator("[data-papyrus-theme-toggle]").click();
  await page.waitForFunction(() => {
    const root = document.documentElement;
    return root.classList.contains("dark")
      && root.dataset.papyrusTheme === "pure"
      && localStorage.getItem("papyrus-mode") === "dark"
      && getComputedStyle(root).getPropertyValue("--papyrus-theme-color").trim() === "#0b0b10"
      && document.querySelector('meta[name="theme-color"]')?.getAttribute("content") === "#0b0b10";
  });
  const pureDarkBackgroundState = await page.evaluate(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    return {
      htmlBackground: styles.backgroundColor,
      mode: localStorage.getItem("papyrus-mode") ?? "",
      rootBackground: styles.getPropertyValue("--papyrus-bg").trim(),
      themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? "",
    };
  });
  assert(pureDarkBackgroundState.mode === "dark", `pure dark mode storage was ${pureDarkBackgroundState.mode}`);
  assert(pureDarkBackgroundState.rootBackground === "#0b0b10", `pure dark --papyrus-bg was ${pureDarkBackgroundState.rootBackground}`);
  assert(pureDarkBackgroundState.themeColor === "#0b0b10", `pure dark theme-color was ${pureDarkBackgroundState.themeColor}`);
  assert(pureDarkBackgroundState.htmlBackground === "rgb(11, 11, 16)", `pure dark html background was ${pureDarkBackgroundState.htmlBackground}`);

  await page.evaluate(() => {
    localStorage.setItem("papyrus-font", "theme");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-papyrus-font-profile-toggle]").click();
  const fontProfile = await page.evaluate(() => document.documentElement.dataset.papyrusFont);
  assert(fontProfile === "readable", `font profile was ${fontProfile}`);
  const fontToggleState = await page.locator("[data-papyrus-font-profile-toggle]").evaluate((button) => ({
    ariaLabel: button.getAttribute("aria-label") ?? "",
    font: button.getAttribute("data-font") ?? "",
    storedFont: localStorage.getItem("papyrus-font") ?? "",
  }));
  assert(fontToggleState.font === "readable", `font toggle state was ${JSON.stringify(fontToggleState)}`);
  assert(fontToggleState.storedFont === "readable", `stored font profile was ${fontToggleState.storedFont}`);
  assert(fontToggleState.ariaLabel === "Font profile: readable", `font toggle label was ${fontToggleState.ariaLabel}`);

  await page.locator("[data-papyrus-font-profile-toggle]").click();
  const nextFontProfile = await page.evaluate(() => document.documentElement.dataset.papyrusFont);
  assert(nextFontProfile === "code", `next font profile was ${nextFontProfile}`);

  await page.locator("[data-papyrus-font-profile-toggle]").click();
  const wrappedFontProfile = await page.evaluate(() => document.documentElement.dataset.papyrusFont);
  assert(wrappedFontProfile === "readable", `wrapped font profile was ${wrappedFontProfile}`);
}

async function runProfileNavChecks(page, origin) {
  await page.goto(`${origin}/posts/cv-profile/`, { waitUntil: "networkidle" });
  await assertPackageNavScope(page, "CV profile");

  const profilePostState = await page.evaluate(() => ({
    h1: document.querySelector("h1")?.textContent?.trim() ?? "",
    text: document.querySelector(".papyrus-prose")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
  }));
  assert(profilePostState.h1 === "Profile and CV", `CV profile post heading was ${profilePostState.h1}`);
  assert(profilePostState.text.includes("/profile/print/") || profilePostState.text.includes("print route"), `CV profile post did not describe printable output: ${profilePostState.text}`);

  await page.goto(`${origin}/profile/`, { waitUntil: "networkidle" });
  const profileState = await page.evaluate(() => {
    const actions = document.querySelector(".cv-actions");
    const tabs = document.querySelector(".cv-template-tabs");
    const actionsRect = actions?.getBoundingClientRect();
    const actionsParentRect = actions?.parentElement?.getBoundingClientRect();
    const tabsRect = tabs?.getBoundingClientRect();
    const tabsParentRect = tabs?.parentElement?.getBoundingClientRect();
    return {
      actionsJustify: actions ? getComputedStyle(actions).justifyContent : "",
      actionsCenterDelta: actionsRect && actionsParentRect
        ? Math.abs((actionsRect.left + actionsRect.width / 2) - (actionsParentRect.left + actionsParentRect.width / 2))
        : Number.POSITIVE_INFINITY,
      tabsJustify: tabs ? getComputedStyle(tabs).justifyContent : "",
      tabsCenterDelta: tabsRect && tabsParentRect
        ? Math.abs((tabsRect.left + tabsRect.width / 2) - (tabsParentRect.left + tabsParentRect.width / 2))
        : Number.POSITIVE_INFINITY,
      versionLinks: Array.from(document.querySelectorAll(".cv-print-menu a")).map((link) => link.getAttribute("href") ?? ""),
      timelineEvents: Array.from(document.querySelectorAll('[data-cv-panel="timeline"] .papyrus-timeline-item')).map((item) => item.textContent?.replace(/\s+/g, " ").trim() ?? ""),
    };
  });
  assert(profileState.actionsJustify === "center", `profile actions were not centered: ${JSON.stringify(profileState)}`);
  assert(profileState.actionsCenterDelta <= 1, `profile actions were not centered in their column: ${JSON.stringify(profileState)}`);
  assert(profileState.tabsJustify === "center", `profile tabs were not centered: ${JSON.stringify(profileState)}`);
  assert(profileState.tabsCenterDelta <= 1, `profile tabs were not centered in their column: ${JSON.stringify(profileState)}`);
  assert(profileState.versionLinks.includes("/profile/print/") && profileState.versionLinks.includes("/profile/ast/"), `profile print version links were ${JSON.stringify(profileState.versionLinks)}`);
  assert(profileState.timelineEvents.length >= 1, `profile timeline events were ${JSON.stringify(profileState.timelineEvents)}`);
  assert(profileState.timelineEvents.every((event) => /\b(?:19|20)\d{2}\b/.test(event)), `profile timeline should only include dated events: ${JSON.stringify(profileState.timelineEvents)}`);
  assert(!profileState.timelineEvents.some((event) => event.includes("Interests")), `profile timeline should only include dated events: ${JSON.stringify(profileState.timelineEvents)}`);
}

async function runMetadataChecks(page, origin) {
  await page.goto(`${origin}/metadata-demo/`, { waitUntil: "networkidle" });
  await assertPackageNavScope(page, "metadata demo");

  const metadataState = await page.evaluate(() => {
    const metaItems = Array.from(document.querySelectorAll(".papyrus-kicker .papyrus-meta-item")).map((item) => ({
      iconCount: item.querySelectorAll("svg").length,
      text: item.textContent?.replace(/\s+/g, " ").trim() ?? "",
    }));
    const tags = Array.from(document.querySelectorAll(".papyrus-tags a")).map((link) => ({
      href: link.getAttribute("href"),
      text: link.textContent?.trim(),
    }));
    const tagIconCount = document.querySelectorAll(".papyrus-tags > svg").length;
    return {
      metaItems,
      tagIconCount,
      tags,
    };
  });

  assert(metadataState.metaItems.length === 3, `metadata demo meta item count was ${metadataState.metaItems.length}: ${JSON.stringify(metadataState.metaItems)}`);
  assert(metadataState.metaItems.every((item) => item.iconCount === 1), `metadata demo meta icons missing: ${JSON.stringify(metadataState.metaItems)}`);
  assert(metadataState.metaItems.some((item) => item.text === "Jul 01"), `metadata demo missing created date: ${JSON.stringify(metadataState.metaItems)}`);
  assert(metadataState.metaItems.some((item) => item.text === "Jul 03"), `metadata demo missing updated date: ${JSON.stringify(metadataState.metaItems)}`);
  assert(metadataState.metaItems.some((item) => item.text === "1 min"), `metadata demo missing read time: ${JSON.stringify(metadataState.metaItems)}`);
  assert(metadataState.tagIconCount === 1, `metadata demo tag icon count was ${metadataState.tagIconCount}`);
  assert(metadataState.tags.some((tag) => tag.text === "#authoring" && tag.href === "/tag/authoring/"), `metadata demo missing #authoring tag link: ${JSON.stringify(metadataState.tags)}`);
  assert(metadataState.tags.some((tag) => tag.text === "#papyrus" && tag.href === "/tag/papyrus/"), `metadata demo missing #papyrus tag link: ${JSON.stringify(metadataState.tags)}`);
}

async function runMarkdownDemoChecks(page, origin) {
  await page.goto(`${origin}/collections/docs/code-demo/`, { waitUntil: "networkidle" });
  await page.waitForSelector(".astro-code");
  await page.waitForFunction(() => document.querySelectorAll(".papyrus-mermaid svg").length >= 1, null, { timeout: 10000 });
  const mermaidErrors = await page.locator('.papyrus-mermaid[data-error="true"]').count();
  assert(mermaidErrors === 0, `found ${mermaidErrors} Mermaid render errors on code demo`);
  const visibleText = await page.locator(".papyrus-prose").textContent();
  assert(!visibleText?.includes("```mermaid"), "code demo still shows raw Mermaid fence text");
  assert(await page.locator(".papyrus-artifact-link[data-artifact-type='mermaid']").count() >= 1, "code demo missing Mermaid artifact link");

  const codeState = await page.evaluate(() => {
    const rustPre = document.querySelector(".astro-code[data-language='rust']");
    const rustCode = rustPre?.querySelector("code");
    const rustToken = rustCode?.querySelector(".line span[style*='--astro-code']");
    const diffPre = document.querySelector(".astro-code[data-language='css']");
    const diffLines = Array.from(diffPre?.querySelectorAll(".line") ?? []);
    const highlightPre = document.querySelector(".astro-code[data-language='c']");
    const collapsedPre = Array.from(document.querySelectorAll(".astro-code[data-language='rust']")).find((block) => block.querySelector(".collapse-toggle"));
    const preStyles = rustPre ? getComputedStyle(rustPre) : null;
    const line = rustCode?.querySelector(".line");
    const lineStyles = line ? getComputedStyle(line) : null;
    const lineNumber = line ? getComputedStyle(line, "::before") : null;

    return {
      codeBackground: preStyles?.backgroundColor ?? "",
      codeColor: preStyles?.color ?? "",
      copyButtonCount: document.querySelectorAll(".astro-code button.copy").length,
      papyrusCodeButtonCount: document.querySelectorAll(".papyrus-copy-button, [data-papyrus-copy]").length,
      codeBorderWidth: preStyles?.borderTopWidth ?? "",
      codeBorderRadius: preStyles?.borderRadius ?? "",
      fontSize: preStyles?.fontSize ?? "",
      lineHeight: preStyles?.lineHeight ?? "",
      lineDisplay: lineStyles?.display ?? "",
      lineNumberContent: lineNumber?.content ?? "",
      lineNumberWidth: lineNumber?.width ?? "",
      titleText: rustPre?.querySelector(".title")?.textContent?.trim() ?? "",
      languageText: rustPre?.querySelector(".language")?.textContent?.trim() ?? "",
      diffClasses: diffLines.map((line) => Array.from(line.classList)),
      diffText: diffLines.map((line) => line.textContent?.trim() ?? ""),
      highlightedCount: highlightPre?.querySelectorAll(".highlighted").length ?? 0,
      collapseButtonText: collapsedPre?.querySelector(".collapse-toggle")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      collapsedClass: collapsedPre?.classList.contains("collapsed") ?? false,
      lineCount: rustCode?.querySelectorAll(".line").length ?? 0,
      shikiClass: rustPre?.className ?? "",
      frameCount: document.querySelectorAll(".papyrus-code-frame, .papyrus-code-title").length,
      tokenStyle: rustToken?.getAttribute("style") ?? "",
    };
  });
  assert(codeState.shikiClass.includes("astro-code"), `code block missing Astro/Shiki class: ${codeState.shikiClass}`);
  assert(codeState.shikiClass.includes("css-variables"), `code block should use Pure css-variables Shiki theme: ${codeState.shikiClass}`);
  assert(codeState.tokenStyle.includes("--astro-code"), `code block missing css-variables token style: ${codeState.tokenStyle}`);
  assert(codeState.lineCount >= 3, `rust code line count was ${codeState.lineCount}`);
  assert(codeState.frameCount === 0, `Pure code blocks should not use papyrus code frames/titles, found ${codeState.frameCount}`);
  assert(codeState.papyrusCodeButtonCount === 0, `Pure code blocks should not inject papyrus copy buttons, found ${codeState.papyrusCodeButtonCount}`);
  assert(codeState.copyButtonCount >= 5, `Pure Shiki copy buttons missing, found ${codeState.copyButtonCount}`);
  assert(codeState.titleText === "src/main.rs", `Pure Shiki title was ${codeState.titleText}`);
  assert(codeState.languageText === "rust", `Pure Shiki language label was ${codeState.languageText}`);
  assert(codeState.lineNumberContent !== "none", `line-number pseudo content missing: ${codeState.lineNumberContent}`);
  assert(codeState.lineNumberWidth !== "auto", `line-number gutter width missing: ${codeState.lineNumberWidth}`);
  assert(codeState.codeBorderWidth !== "0px", `code block should keep Pure-like rounded border, border was ${codeState.codeBorderWidth}`);
  assert(codeState.codeBorderRadius !== "0px", `code block should keep Pure-like rounded radius, radius was ${codeState.codeBorderRadius}`);
  assert(codeState.fontSize === "14px", `code font size should stay compact, got ${codeState.fontSize}`);
  assert(codeState.lineHeight === "21px", `code line height should stay compact, got ${codeState.lineHeight}`);
  assert(codeState.diffClasses.some((classes) => classes.includes("remove")), `diff removed line class missing: ${JSON.stringify(codeState.diffClasses)}`);
  assert(codeState.diffClasses.filter((classes) => classes.includes("add")).length >= 2, `diff added line classes missing: ${JSON.stringify(codeState.diffClasses)}`);
  assert(!codeState.diffText.some((line) => line.includes("[!code")), `Shiki notation leaked into rendered diff text: ${JSON.stringify(codeState.diffText)}`);
  assert(codeState.highlightedCount >= 1, `highlighted line count was ${codeState.highlightedCount}`);
  assert(codeState.collapsedClass, "long Pure Shiki code block should start collapsed");
  assert(codeState.collapseButtonText.includes("code"), `collapse button text was ${codeState.collapseButtonText}`);
  assert(codeState.codeBackground !== "rgba(0, 0, 0, 0)", "code background should be visible");
  assert(codeState.codeColor !== "rgb(0, 0, 0)", "code foreground should not be black");

  await page.locator(".astro-code[data-language='rust'] button.copy").first().click({ force: true });
  await page.waitForFunction(() => document.querySelector(".astro-code[data-language='rust'] button.copy")?.classList.contains("copied"));
  await page.mouse.move(1, 1);
  const copiedButtonState = await page.locator(".astro-code[data-language='rust'] button.copy").first().evaluate((button) => {
    const success = button.querySelector(".success");
    const ready = button.querySelector(".ready");
    return {
      opacity: getComputedStyle(button).opacity,
      readyDisplay: ready ? getComputedStyle(ready).display : "",
      successDisplay: success ? getComputedStyle(success).display : "",
    };
  });
  assert(copiedButtonState.successDisplay === "block", `Pure Shiki copied success display was ${copiedButtonState.successDisplay}`);
  assert(copiedButtonState.readyDisplay === "none", `Pure Shiki copied ready display was ${copiedButtonState.readyDisplay}`);
  assert(Number(copiedButtonState.opacity) > 0.95, `Pure Shiki copied button opacity was ${copiedButtonState.opacity}`);
  const copiedCode = await clipboardText(page);
  assert(copiedCode.includes('println!("papyrus");'), "Pure Shiki copy button did not copy Rust code");

  const calloutState = await page.evaluate(() => {
    const variants = ["note", "tip", "important", "warning", "caution"];
    return variants.map((variant) => {
      const callout = document.querySelector(`.callout[data-callout="${variant}"]`);
      const title = callout?.querySelector(".callout-title");
      const titleText = callout?.querySelector(".callout-title-text");
      const styles = callout ? getComputedStyle(callout) : null;
      const titleStyles = title ? getComputedStyle(title) : null;
      return {
        background: styles?.backgroundColor ?? "",
        borderRadius: styles?.borderRadius ?? "",
        color: titleStyles?.color ?? "",
        display: styles?.display ?? "",
        hasCallout: Boolean(callout),
        iconCount: title?.querySelectorAll(".callout-title-icon svg").length ?? 0,
        iconSignature: title?.querySelector(".callout-title-icon svg")?.innerHTML.replace(/\s+/g, " ").trim() ?? "",
        title: titleText?.textContent?.trim() ?? "",
        variant,
      };
    });
  });
  for (const callout of calloutState) {
    assert(callout.hasCallout, `missing rendered callout ${callout.variant}`);
    assert(callout.title.toLowerCase().includes(callout.variant), `callout ${callout.variant} title was ${callout.title}`);
    assert(callout.iconCount === 1, `callout ${callout.variant} should have one SVG icon, got ${callout.iconCount}`);
    assert(callout.color !== "rgb(0, 0, 0)", `callout ${callout.variant} title color is black`);
    assert(callout.background !== "rgba(0, 0, 0, 0)", `callout ${callout.variant} background is transparent`);
    assert(callout.borderRadius !== "0px", `callout ${callout.variant} should keep a rounded Obsidian callout shape`);
  }
  const githubAlertIcons = calloutState
    .filter((callout) => ["tip", "important", "warning", "caution"].includes(callout.variant))
    .map((callout) => callout.iconSignature);
  assert(new Set(githubAlertIcons).size === githubAlertIcons.length, "GitHub alert callout icons should be distinct for tip, important, warning, and caution");
  const collapsibleCallouts = await page.evaluate(() => {
    const closed = document.querySelector('details.callout[data-callout="warning"][data-collapsible="true"]');
    const open = document.querySelector('details.callout[data-callout="tip"][data-collapsible="true"]');
    return {
      closedOpen: closed?.hasAttribute("open") ?? null,
      closedTitle: closed?.querySelector(".callout-title-text")?.textContent?.trim() ?? "",
      openOpen: open?.hasAttribute("open") ?? null,
      openTitle: open?.querySelector(".callout-title-text")?.textContent?.trim() ?? "",
    };
  });
  assert(collapsibleCallouts.closedOpen === false, `collapsed warning callout open state was ${collapsibleCallouts.closedOpen}`);
  assert(collapsibleCallouts.closedTitle === "Collapsed warning", `collapsed warning title was ${collapsibleCallouts.closedTitle}`);
  assert(collapsibleCallouts.openOpen === true, `expanded tip callout open state was ${collapsibleCallouts.openOpen}`);
  assert(collapsibleCallouts.openTitle === "Expanded tip", `expanded tip title was ${collapsibleCallouts.openTitle}`);
  const taskListState = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll(".task-list-item"));
    const inputs = Array.from(document.querySelectorAll(".task-list-item input[type='checkbox']"));
    return {
      checked: inputs.filter((input) => input.checked).length,
      disabled: inputs.filter((input) => input.disabled).length,
      inputs: inputs.length,
      items: items.length,
      labelled: inputs.filter((input) => (input.getAttribute("aria-label") ?? "").startsWith("Task: ")).length,
      unchecked: inputs.filter((input) => !input.checked).length,
    };
  });
  assert(taskListState.items >= 3, `expected at least 3 task-list items, found ${taskListState.items}`);
  assert(taskListState.inputs >= 3, `expected at least 3 task-list checkboxes, found ${taskListState.inputs}`);
  assert(taskListState.checked >= 1, "task list missing checked checkbox");
  assert(taskListState.unchecked >= 1, "task list missing unchecked checkbox");
  assert(taskListState.disabled === taskListState.inputs, "task list checkboxes should be disabled/read-only");
  assert(taskListState.labelled === taskListState.inputs, "task list checkboxes should have generated aria labels");

  const tableState = await page.evaluate(() => {
    const table = document.querySelector("table");
    const cell = document.querySelector("td");
    const heading = document.querySelector("th");
    const tableStyles = table ? getComputedStyle(table) : null;
    const cellStyles = cell ? getComputedStyle(cell) : null;
    const headingStyles = heading ? getComputedStyle(heading) : null;
    return {
      cellBorderLeft: cellStyles?.borderLeftWidth ?? "",
      cellBorderRight: cellStyles?.borderRightWidth ?? "",
      cellBorderTop: cellStyles?.borderTopWidth ?? "",
      cellBorderBottom: cellStyles?.borderBottomWidth ?? "",
      display: tableStyles?.display ?? "",
      hasCell: Boolean(cell),
      hasHeading: Boolean(heading),
      hasTable: Boolean(table),
      headingColor: headingStyles?.color ?? "",
      overflowX: tableStyles?.overflowX ?? "",
    };
  });
  assert(tableState.hasTable && tableState.hasHeading && tableState.hasCell, "markdown table did not render table/heading/cell DOM");
  assert(tableState.display === "block", `table display was ${tableState.display}`);
  assert(tableState.overflowX === "auto", `table overflow-x was ${tableState.overflowX}`);
  assert(tableState.cellBorderLeft === "0px", `table cell left border was ${tableState.cellBorderLeft}`);
  assert(tableState.cellBorderRight === "0px", `table cell right border was ${tableState.cellBorderRight}`);
  assert(tableState.cellBorderTop === "0px", `table cell top border was ${tableState.cellBorderTop}`);
  assert(tableState.cellBorderBottom !== "0px", "table cell should keep a subtle row separator");
  assert(tableState.headingColor !== "rgb(0, 0, 0)", "table heading color is black");

  const fallbackState = await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll("h2")).find((item) => item.textContent?.trim() === "Fallback rendering");
    const tables = Array.from(document.querySelectorAll("table"));
    const table = tables[tables.length - 1];
    const rows = Array.from(table?.querySelectorAll("tbody tr") ?? []).map((row) =>
      Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? "")
    );
    return {
      hasHeading: Boolean(heading),
      rows,
    };
  });
  assert(fallbackState.hasHeading, "code demo missing fallback rendering heading");
  assert(fallbackState.rows.some(([name, status]) => name === "PlantUML inline rendering" && status?.startsWith("Keep as a file link")), `PlantUML fallback status missing: ${JSON.stringify(fallbackState.rows)}`);
  assert(fallbackState.rows.some(([name, status]) => name === "Excalidraw inline rendering" && status?.startsWith("Keep as a file link")), `Excalidraw fallback status missing: ${JSON.stringify(fallbackState.rows)}`);
  assert(fallbackState.rows.some(([name, status]) => name === "Wiki links like [[topic]]" && status?.startsWith("Keep as plain text")), `wiki-link fallback status missing: ${JSON.stringify(fallbackState.rows)}`);

  const image = page.locator('.papyrus-prose img[src="/demo/demo-profile-avatar.svg"]');
  await image.waitFor();
  const imageCursor = await image.evaluate((element) => getComputedStyle(element).cursor);
  assert(imageCursor === "zoom-in", `demo image cursor was ${imageCursor}`);
  await image.click();
  await page.waitForFunction(() => document.querySelector("[data-papyrus-image-zoom]")?.getAttribute("data-open") === "true");
  assert(await page.locator("[data-papyrus-image-zoom] img").count() === 1, "zoom overlay did not contain cloned image");
  await page.locator("[data-papyrus-image-zoom]").click();
  await page.waitForFunction(() => document.querySelector("[data-papyrus-image-zoom]")?.getAttribute("data-open") === "false");

  const diagram = page.locator(".papyrus-mermaid svg").first();
  const diagramCursor = await diagram.evaluate((element) => getComputedStyle(element).cursor);
  assert(diagramCursor === "zoom-in", `Mermaid SVG cursor was ${diagramCursor}`);
  await diagram.click();
  await page.waitForFunction(() => document.querySelector("[data-papyrus-image-zoom]")?.getAttribute("data-open") === "true");
  assert(await page.locator("[data-papyrus-image-zoom] svg").count() === 1, "zoom overlay did not contain cloned Mermaid SVG");
  await page.locator("[data-papyrus-image-zoom]").click();
  await page.waitForFunction(() => document.querySelector("[data-papyrus-image-zoom]")?.getAttribute("data-open") === "false");
}

async function runCvChecks(page, origin) {
  await page.goto(`${origin}/profile/`, { waitUntil: "networkidle" });
  const profileState = await page.evaluate(() => ({
    actionLabels: Array.from(document.querySelectorAll(".cv-actions .cv-action")).map((item) => item.textContent?.replace(/\s+/g, " ").trim() ?? ""),
    name: document.querySelector(".cv-sidebar h1")?.textContent?.trim() ?? "",
    tabs: Array.from(document.querySelectorAll("[data-cv-tab]")).map((tab) => tab.textContent?.trim() ?? ""),
    versionHrefs: Array.from(document.querySelectorAll(".cv-print-menu a")).map((link) => link.getAttribute("href") ?? ""),
  }));
  assert(profileState.name === "Mira Lee", `profile name was ${profileState.name}`);
  assert(profileState.tabs.join(",") === "Resume,Timeline,Projects,Skills", `profile tabs were ${profileState.tabs.join(",")}`);
  assert(profileState.versionHrefs.includes("/profile/print/") && profileState.versionHrefs.includes("/profile/ast/"), `profile version links were ${JSON.stringify(profileState.versionHrefs)}`);
  assert(profileState.actionLabels.some((label) => label.includes("PDF / Print")), `profile actions were ${JSON.stringify(profileState.actionLabels)}`);

  await page.goto(`${origin}/profile/print/`, { waitUntil: "networkidle" });
  const printState = await page.evaluate(() => ({
    backHref: document.querySelector('[data-cv-actions] a[href="/profile/"]')?.getAttribute("href") ?? "",
    name: document.querySelector(".print-profile h1")?.textContent?.trim() ?? "",
    sheetCount: document.querySelectorAll(".sheet").length,
    versionHrefs: Array.from(Array.from(document.querySelectorAll(".cv-source-menu")).find((menu) => menu.querySelector("summary")?.textContent?.trim() === "Version")?.querySelectorAll("a") ?? []).map((link) => link.getAttribute("href") ?? ""),
  }));
  assert(printState.name === "Mira Lee", `print profile name was ${printState.name}`);
  assert(printState.sheetCount >= 1, `print sheet count was ${printState.sheetCount}`);
  assert(printState.backHref === "/profile/", `print back link was ${printState.backHref}`);
  assert(printState.versionHrefs.includes("/profile/ast/"), `print version links were ${JSON.stringify(printState.versionHrefs)}`);
  const sheet = await page.locator(".sheet").first().boundingBox();
  assert(Boolean(sheet), "print CV sheet is missing");
  if (sheet) {
    assert(Math.abs(sheet.width - 794) < 10, `print A4 width was ${sheet.width}`);
    assert(Math.abs(sheet.height - 1119) < 30, `print A4 height was ${sheet.height}`);
  }

  await page.goto(`${origin}/profile/ast/`, { waitUntil: "networkidle" });
  const astState = await page.evaluate(() => {
    const versionMenu = Array.from(document.querySelectorAll(".cv-source-menu")).find((menu) => menu.querySelector("summary")?.textContent?.trim() === "Version");
    return {
      backHref: document.querySelector('[data-cv-actions] a[href="/profile/"]')?.getAttribute("href") ?? "",
      hasProfessionalSummary: Boolean(document.querySelector("#summary-heading")),
      name: document.querySelector(".resume-header h1")?.textContent?.trim() ?? "",
      versionHrefs: Array.from(versionMenu?.querySelectorAll("a") ?? []).map((link) => link.getAttribute("href") ?? ""),
    };
  });
  assert(astState.name === "Mira Lee", `ATS profile name was ${astState.name}`);
  assert(astState.hasProfessionalSummary, "ATS profile missing professional summary");
  assert(astState.backHref === "/profile/", `ATS back link was ${astState.backHref}`);
  assert(astState.versionHrefs.includes("/profile/print/"), `ATS version links were ${JSON.stringify(astState.versionHrefs)}`);
}



if (!existsSync(join(dist, "index.html"))) {
  console.error("dist/index.html is missing. Run `make build` before browser verification.");
  process.exit(1);
}
assert(!existsSync(join(dist, "notes", "index.html")), "built demo should not include a /notes/ page");

const server = await startServer();
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext();
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: server.origin });
  const page = await context.newPage();
  await runAssetChecks(page, server.origin);
  await assertFooterControlPopoverLayout(page, server.origin, { width: 1280, height: 900 }, "desktop");
  await assertFooterControlPopoverLayout(page, server.origin, { width: 390, height: 844 }, "mobile");
  await page.setViewportSize({ width: 1280, height: 900 });
  await runHomeChecks(page, server.origin);
  await runAboutChecks(page, server.origin);
  await runProjectsChecks(page, server.origin);
  await runMobileHeaderChecks(page, server.origin);
  await runDocsChecks(page, server.origin);
  await runContentStructureChecks(page, server.origin);
  await runSearchChecks(page, server.origin);
  await runPostsIndexChecks(page, server.origin);
  await runProfileNavChecks(page, server.origin);
  await runMetadataChecks(page, server.origin);
  await runMarkdownDemoChecks(page, server.origin);
  await runCvChecks(page, server.origin);
} finally {
  await browser.close();
  await server.close();
}

if (failures.length) {
  console.error("Browser verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Verified current browser behavior for navigation, homepage/docs/projects content, collection TOC, search and hidden archive filtering, posts/timeline limits, post actions and adjacency, Pure/Shiki code, callouts, Markdown media and Mermaid, theme controls, metadata, profile tabs/actions, and modern/classic A4 routes.");
