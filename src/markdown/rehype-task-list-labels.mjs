function textContent(node) {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  if (node.tagName === "input") return "";
  return (node.children ?? []).map(textContent).join("");
}

function isTaskCheckbox(node) {
  return node?.tagName === "input" && node.properties?.type === "checkbox";
}

export default function rehypeTaskListLabels() {
  return (tree) => {
    function visit(node) {
      if (!node?.children) return;

      for (const child of node.children) {
        if (isTaskCheckbox(child)) {
          const label = textContent(node).trim();
          child.properties = {
            ...child.properties,
            ariaLabel: label ? `Task: ${label}` : "Task item",
          };
        }

        visit(child);
      }
    }

    visit(tree);
  };
}
