const artifactTypes = new Map([
  [".mmd", "mermaid"],
  [".mermaid", "mermaid"],
  [".puml", "plantuml"],
  [".plantuml", "plantuml"],
  [".excalidraw", "excalidraw"],
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textFor(node) {
  if (!node) return "";
  if (["text", "inlineCode"].includes(node.type)) return node.value ?? "";
  return (node.children ?? []).map(textFor).join("");
}

function artifactType(url = "") {
  const clean = url.split(/[?#]/)[0].toLowerCase();
  for (const [extension, type] of artifactTypes) {
    if (clean.endsWith(extension)) return type;
  }

  return null;
}

export default function remarkArtifactLinks() {
  return (tree) => {
    function visit(node, parent, index) {
      if (node?.type === "link") {
        const type = artifactType(node.url);
        if (type && parent && typeof index === "number") {
          const label = textFor(node) || node.url;
          const description = node.title || `${type} source file`;
          parent.children[index] = {
            type: "html",
            value: `<a class="paper-artifact-link" href="${escapeHtml(node.url)}" data-artifact-type="${type}"><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></span></a>`,
          };
          return;
        }
      }

      node?.children?.forEach((child, childIndex) => visit(child, node, childIndex));
    }

    visit(tree);
  };
}
