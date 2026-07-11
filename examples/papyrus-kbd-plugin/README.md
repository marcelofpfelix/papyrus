# papyrus kbd plugin example

Tiny external plugin fixture for papyrus community plugin support. It shows
the intended package shape without making papyrus depend on this plugin.

```ts
import paperPureKbdPlugin from "@example/papyrus-kbd";
import { resolvePaperPluginConfig } from "astro-theme-papyrus/utils";

const config = resolvePaperPluginConfig([paperPureKbdPlugin], {
  rss: false,
});
```

Real plugins should keep rendering, markdown transforms, credentials, and site
configuration owned by the consuming site.
