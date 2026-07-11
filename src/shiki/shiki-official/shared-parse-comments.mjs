const RE_SPLIT_COMMENT = /(\s+\/\/)/;
const RE_V1_END_COMMENT_PREFIX = /(?:\/\/|["'#]|;{1,2}|%{1,2}|--)(\s*)$/;
const RE_V3_END_COMMENT_PREFIX = /(?:\/\/|#|;{1,2}|%{1,2}|--)(\s*)$/;

const matchers = [
  [/^(<!--)(.+)(-->)$/, false],
  [/^(\/\*)(.+)(\*\/)$/, false],
  [/^(\/\/|["'#]|;{1,2}|%{1,2}|--)(.*)$/, true],
  [/^(\*)(.+)$/, true],
];

export function parseComments(lines, jsx, matchAlgorithm) {
  const out = [];

  for (const line of lines) {
    if (matchAlgorithm === "v3") {
      const splittedElements = line.children.flatMap((element, idx) => {
        if (element.type !== "element") return element;

        const token = element.children[0];
        if (token.type !== "text") return element;

        const isLast = idx === line.children.length - 1;
        const isComment = matchToken(token.value, isLast);
        if (!isComment) return element;
        const rawSplits = token.value.split(RE_SPLIT_COMMENT);
        if (rawSplits.length <= 1) return element;

        let splits = [rawSplits[0]];
        for (let i = 1; i < rawSplits.length; i += 2) {
          splits.push(rawSplits[i] + (rawSplits[i + 1] || ""));
        }
        splits = splits.filter(Boolean);
        if (splits.length <= 1) return element;

        return splits.map((split) => ({
          ...element,
          children: [
            {
              type: "text",
              value: split,
            },
          ],
        }));
      });

      if (splittedElements.length !== line.children.length) line.children = splittedElements;
    }

    const elements = line.children;
    let start = elements.length - 1;
    if (matchAlgorithm === "v1") start = 0;
    else if (jsx) start = elements.length - 2;

    for (let i = Math.max(start, 0); i < elements.length; i += 1) {
      const token = elements[i];
      if (token.type !== "element") continue;
      const head = token.children.at(0);
      if (head?.type !== "text") continue;

      const isLast = i === elements.length - 1;
      let match = matchToken(head.value, isLast);

      if (!match && i > 0 && head.value.trim().startsWith("[!code")) {
        const prevToken = elements[i - 1];
        if (prevToken?.type === "element") {
          const prevHead = prevToken.children.at(0);
          if (prevHead?.type === "text" && prevHead.value.includes("//")) {
            const combinedValue = prevHead.value + head.value;
            const combinedMatch = matchToken(combinedValue, isLast);
            if (combinedMatch) {
              match = combinedMatch;
              out.push({
                info: combinedMatch,
                line,
                token: prevToken,
                isLineCommentOnly: elements.length === 2 && prevToken.children.length === 1 && token.children.length === 1,
                isJsxStyle: false,
                additionalTokens: [token],
              });
              continue;
            }
          }
        }
      }

      if (!match) continue;

      if (jsx && !isLast && i !== 0) {
        const isJsxStyle = isValue(elements[i - 1], "{") && isValue(elements[i + 1], "}");
        out.push({
          info: match,
          line,
          token,
          isLineCommentOnly: elements.length === 3 && token.children.length === 1,
          isJsxStyle,
        });
      } else {
        out.push({
          info: match,
          line,
          token,
          isLineCommentOnly: elements.length === 1 && token.children.length === 1,
          isJsxStyle: false,
        });
      }
    }
  }

  return out;
}

function isValue(element, value) {
  if (element.type !== "element") return false;
  const text = element.children[0];
  if (text.type !== "text") return false;

  return text.value.trim() === value;
}

function matchToken(text, isLast) {
  let trimmed = text.trimStart();
  const spaceFront = text.length - trimmed.length;

  trimmed = trimmed.trimEnd();
  const spaceEnd = text.length - trimmed.length - spaceFront;

  for (const [matcher, endOfLine] of matchers) {
    if (endOfLine && !isLast) continue;

    const result = matcher.exec(trimmed);
    if (!result) continue;

    return [
      " ".repeat(spaceFront) + result[1],
      result[2],
      result[3] ? result[3] + " ".repeat(spaceEnd) : undefined,
    ];
  }
}

export function v1ClearEndCommentPrefix(text) {
  const match = text.match(RE_V1_END_COMMENT_PREFIX);

  if (match && match[1].trim().length === 0) {
    return text.slice(0, match.index);
  }

  return text;
}

export function v3ClearEndCommentPrefix(text) {
  const match = text.match(RE_V3_END_COMMENT_PREFIX);

  if (match && match[1].trim().length === 0) {
    return text.slice(0, match.index).trimEnd();
  }

  return text;
}
