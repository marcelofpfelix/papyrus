import type { PaperFeatureConfig } from "./features";
import { resolvePaperFeatures } from "./features";

export type PaperPluginKind = "component" | "markdown" | "script" | "style" | "integration" | "route" | "data";

export type PaperPluginCapability = {
  kind: PaperPluginKind;
  name: string;
  description?: string;
};

export type PaperPluginSetupContext = {
  addCapability: (capability: PaperPluginCapability) => void;
  setFeatureDefaults: (features: PaperFeatureConfig) => void;
};

export type PaperPluginSetup = (context: PaperPluginSetupContext) => void;

export type PaperPluginDefinition = {
  name: string;
  description: string;
  packageName?: string;
  docsUrl?: string;
  featureDefaults?: PaperFeatureConfig;
  capabilities?: PaperPluginCapability[];
  setup?: PaperPluginSetup;
};

export type ResolvedPaperPluginConfig = {
  features: Required<PaperFeatureConfig>;
  plugins: PaperPluginDefinition[];
  capabilities: PaperPluginCapability[];
};

export function definePaperPlugin(plugin: PaperPluginDefinition): PaperPluginDefinition {
  return plugin;
}

export function resolvePaperPluginConfig(
  plugins: PaperPluginDefinition[] = [],
  siteFeatures: PaperFeatureConfig = {},
): ResolvedPaperPluginConfig {
  const setupFeatureDefaults = new Map<string, PaperFeatureConfig>();
  const setupCapabilities = new Map<string, PaperPluginCapability[]>();

  plugins.forEach((plugin) => {
    plugin.setup?.({
      addCapability: (capability) => {
        setupCapabilities.set(plugin.name, [...setupCapabilities.get(plugin.name) ?? [], capability]);
      },
      setFeatureDefaults: (features) => {
        setupFeatureDefaults.set(plugin.name, {
          ...setupFeatureDefaults.get(plugin.name),
          ...features,
        });
      },
    });
  });

  const pluginFeatures = plugins.reduce<PaperFeatureConfig>((features, plugin) => ({
    ...features,
    ...plugin.featureDefaults,
    ...setupFeatureDefaults.get(plugin.name),
  }), {});

  return {
    features: resolvePaperFeatures({
      ...pluginFeatures,
      ...siteFeatures,
    }),
    plugins,
    capabilities: plugins.flatMap((plugin) => [
      ...(plugin.capabilities ?? []),
      ...(setupCapabilities.get(plugin.name) ?? []),
    ]),
  };
}
