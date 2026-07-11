import { parseComments, v1ClearEndCommentPrefix } from "./shared-parse-comments.mjs";

export function createCommentNotationTransformer(name, regex, onMatch, matchAlgorithm) {
  matchAlgorithm ??= "v3";

  return {
    name,
    code(code) {
      const lines = code.children.filter((i) => i.type === "element");
      const linesToRemove = [];

      code.data ??= {};
      const data = code.data;

      data._shiki_notation ??= parseComments(lines, ["jsx", "tsx"].includes(this.options.lang), matchAlgorithm);
      const parsed = data._shiki_notation;

      for (const comment of parsed) {
        if (comment.info[1].length === 0) continue;

        let lineIdx = lines.indexOf(comment.line);
        if (comment.isLineCommentOnly && matchAlgorithm !== "v1") lineIdx += 1;

        let replaced = false;
        comment.info[1] = comment.info[1].replace(regex, (...match) => {
          if (onMatch.call(this, match, comment.line, comment.token, lines, lineIdx)) {
            replaced = true;
            return "";
          }

          return match[0];
        });

        if (!replaced) continue;

        if (matchAlgorithm === "v1") comment.info[1] = v1ClearEndCommentPrefix(comment.info[1]);

        const isEmpty = comment.info[1].trim().length === 0;
        if (isEmpty) comment.info[1] = "";

        if (isEmpty && comment.isLineCommentOnly) {
          linesToRemove.push(comment.line);
        } else if (isEmpty && comment.isJsxStyle) {
          comment.line.children.splice(comment.line.children.indexOf(comment.token) - 1, 3);
        } else if (isEmpty) {
          if (comment.additionalTokens) {
            for (let j = comment.additionalTokens.length - 1; j >= 0; j -= 1) {
              const additionalToken = comment.additionalTokens[j];
              const tokenIndex = comment.line.children.indexOf(additionalToken);
              if (tokenIndex !== -1) {
                comment.line.children.splice(tokenIndex, 1);
              }
            }
          }
          comment.line.children.splice(comment.line.children.indexOf(comment.token), 1);
        } else {
          const head = comment.token.children[0];

          if (head.type === "text") {
            head.value = comment.info.join("");

            if (comment.additionalTokens) {
              for (const additionalToken of comment.additionalTokens) {
                const additionalHead = additionalToken.children[0];
                if (additionalHead?.type === "text") {
                  additionalHead.value = "";
                }
              }
            }
          }
        }
      }

      for (const line of linesToRemove) {
        const index = code.children.indexOf(line);
        const nextLine = code.children[index + 1];
        let removeLength = 1;
        if (nextLine?.type === "text" && nextLine?.value === "\n") removeLength = 2;
        code.children.splice(index, removeLength);
      }
    },
  };
}
