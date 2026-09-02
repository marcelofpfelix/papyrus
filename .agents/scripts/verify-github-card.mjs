#!/usr/bin/env node
import assert from "node:assert/strict";
import { parseGithubRepository, renderGithubCard } from "../../src/utils/github-card.mjs";

assert.deepEqual(parseGithubRepository("marcelofpfelix/papyrus"), {
  owner: "marcelofpfelix",
  name: "papyrus",
  slug: "marcelofpfelix/papyrus",
  url: "https://github.com/marcelofpfelix/papyrus",
});
assert.equal(parseGithubRepository("https://github.com/marcelofpfelix/papyrus/").slug, "marcelofpfelix/papyrus");
assert.throws(() => parseGithubRepository("github.com/owner/repo"), /Invalid GitHub repository/);
assert.throws(() => parseGithubRepository("owner/repo/extra"), /Invalid GitHub repository/);

const markup = renderGithubCard("owner/repo", '<script>alert("x")</script>');
assert.match(markup, /class="papyrus-github-preview"/);
assert.match(markup, /href="https:\/\/github\.com\/owner\/repo"/);
assert.doesNotMatch(markup, /<script>/);
assert.match(markup, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);

console.log("Verified GitHub repository parsing, safe shared card rendering, and the external-plugin export boundary.");
