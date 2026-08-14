import { definePapyrusPlugin } from "astro-papyrus/utils";

export const papyrusPureKbdPlugin = definePapyrusPlugin({
  name: "papyrus-kbd",
  description: "Example plugin that could add keyboard-shortcut markdown and matching prose styles.",
  packageName: "@example/papyrus-kbd",
  docsUrl: "https://example.com/papyrus-kbd",
  featureDefaults: {
    sourceActions: true,
  },
  capabilities: [
    {
      kind: "markdown",
      name: "kbd-shortcodes",
      description: "Turn shortcut syntax into semantic kbd markup.",
    },
    {
      kind: "style",
      name: "kbd-theme-tokens",
      description: "Use papyrus theme tokens for keyboard shortcut styling.",
    },
  ],
  setup({ addCapability, setFeatureDefaults }) {
    setFeatureDefaults({ sourceActions: true });
    addCapability({
      kind: "script",
      name: "kbd-copy-help",
      description: "Optional client helper for copying shortcut examples.",
    });
  },
});

export default papyrusPureKbdPlugin;
