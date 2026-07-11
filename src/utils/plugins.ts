import type { PapyrusFeatureConfig } from "./features";
import { resolvePapyrusFeatures } from "./features";

export type PapyrusPluginKind = "component" | "markdown" | "script" | "style" | "integration" | "route" | "data";

export type PapyrusPluginCapability = {
  kind: PapyrusPluginKind;
  name: string;
  description?: string;
};

export type PapyrusPluginSetupContext = {
  addCapability: (capability: PapyrusPluginCapability) => void;
  setFeatureDefaults: (features: PapyrusFeatureConfig) => void;
};

export type PapyrusPluginSetup = (context: PapyrusPluginSetupContext) => void;

export type PapyrusPluginDefinition = {
  name: string;
  description: string;
  packageName?: string;
  docsUrl?: string;
  featureDefaults?: PapyrusFeatureConfig;
  capabilities?: PapyrusPluginCapability[];
  setup?: PapyrusPluginSetup;
};

export type ResolvedPapyrusPluginConfig = {
  features: Required<PapyrusFeatureConfig>;
  plugins: PapyrusPluginDefinition[];
  capabilities: PapyrusPluginCapability[];
};

export function definePapyrusPlugin(plugin: PapyrusPluginDefinition): PapyrusPluginDefinition {
  return plugin;
}

export function resolvePapyrusPluginConfig(
  plugins: PapyrusPluginDefinition[] = [],
  siteFeatures: PapyrusFeatureConfig = {},
): ResolvedPapyrusPluginConfig {
  const setupFeatureDefaults = new Map<string, PapyrusFeatureConfig>();
  const setupCapabilities = new Map<string, PapyrusPluginCapability[]>();

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

  const pluginFeatures = plugins.reduce<PapyrusFeatureConfig>((features, plugin) => ({
    ...features,
    ...plugin.featureDefaults,
    ...setupFeatureDefaults.get(plugin.name),
  }), {});

  return {
    features: resolvePapyrusFeatures({
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
