import { createCommentNotationTransformer } from "./shared-notation-transformer.mjs";

const RE_ESCAPE_SPECIAL = /[.*+?^${}()|[\]\\]/g;

function escapeRegExp(str) {
  return str.replace(RE_ESCAPE_SPECIAL, "\\$&");
}

export function transformerNotationMap(options = {}, name = "@shikijs/transformers:notation-map") {
  const { classMap = {}, classActivePre = undefined, classActiveCode = undefined } = options;

  return createCommentNotationTransformer(
    name,
    new RegExp(`#?\\s*\\[!code (${Object.keys(classMap).map(escapeRegExp).join("|")})(:\\d+)?\\]`, "gi"),
    function ([_, match, range = ":1"], _line, _comment, lines, index) {
      const lineNum = Number.parseInt(range.slice(1), 10);

      for (let i = index; i < Math.min(index + lineNum, lines.length); i += 1) {
        this.addClassToHast(lines[i], classMap[match]);
      }

      if (classActivePre) this.addClassToHast(this.pre, classActivePre);
      if (classActiveCode) this.addClassToHast(this.code, classActiveCode);
      return true;
    },
    options.matchAlgorithm
  );
}
