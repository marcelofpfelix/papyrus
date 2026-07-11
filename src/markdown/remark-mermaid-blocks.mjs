function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export default function remarkMermaidBlocks() {
  return (tree) => {
    function visit(node, parent, index) {
      if (node?.type === "code" && node.lang === "mermaid" && parent && typeof index === "number") {
        parent.children[index] = {
          type: "html",
          value: `<div class="papyrus-mermaid" role="img">\n${escapeHtml(node.value ?? "")}\n</div>`,
        };
        return;
      }

      node?.children?.forEach((child, childIndex) => visit(child, node, childIndex));
    }

    visit(tree);
  };
}
