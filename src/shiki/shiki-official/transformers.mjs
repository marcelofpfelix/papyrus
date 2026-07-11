// Copied from Pure's local Shiki transformer references.
import { transformerNotationMap } from "./shared-notation-map.mjs";

export function transformerNotationDiff(options = {}) {
  const {
    classLineAdd = "diff add",
    classLineRemove = "diff remove",
    classActivePre = "has-diff",
    classActiveCode,
  } = options;

  return transformerNotationMap(
    {
      classMap: {
        "++": classLineAdd,
        "--": classLineRemove,
      },
      classActivePre,
      classActiveCode,
      matchAlgorithm: options.matchAlgorithm,
    },
    "@shikijs/transformers:notation-diff"
  );
}

export function transformerNotationHighlight(options = {}) {
  const {
    classActiveLine = "highlighted",
    classActivePre = "has-highlighted",
    classActiveCode,
  } = options;

  return transformerNotationMap(
    {
      classMap: {
        highlight: classActiveLine,
        hl: classActiveLine,
      },
      classActivePre,
      classActiveCode,
      matchAlgorithm: options.matchAlgorithm,
    },
    "@shikijs/transformers:notation-highlight"
  );
}

export function transformerRemoveNotationEscape() {
  return {
    name: "@shikijs/transformers:remove-notation-escape",
    code(hast) {
      function replace(node) {
        if (node.type === "text") {
          node.value = node.value.replace("[\\!code", "[!code");
        } else if ("children" in node) {
          for (const child of node.children) {
            replace(child);
          }
        }
      }

      replace(hast);
      return hast;
    },
  };
}
