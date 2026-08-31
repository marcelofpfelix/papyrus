const calloutIcons = {
  tip: [
    { tagName: "path", properties: { d: "M15 14c.2-1 .7-1.7 1.4-2.5A5 5 0 1 0 7.6 11.5C8.3 12.3 8.8 13 9 14" } },
    { tagName: "path", properties: { d: "M9 18h6" } },
    { tagName: "path", properties: { d: "M10 22h4" } },
    { tagName: "path", properties: { d: "M10 14h4" } },
  ],
  caution: [
    { tagName: "path", properties: { d: "M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9L7.9 2Z" } },
    { tagName: "path", properties: { d: "m15 9-6 6" } },
    { tagName: "path", properties: { d: "m9 9 6 6" } },
  ],
  important: [
    { tagName: "circle", properties: { cx: "12", cy: "12", r: "10" } },
    { tagName: "path", properties: { d: "M12 8v4" } },
    { tagName: "path", properties: { d: "M12 16h.01" } },
  ],
  warning: [
    { tagName: "path", properties: { d: "m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" } },
    { tagName: "path", properties: { d: "M12 9v4" } },
    { tagName: "path", properties: { d: "M12 17h.01" } },
  ],
};

function calloutIcon(type) {
  return {
    type: "element",
    tagName: "svg",
    properties: {
      xmlns: "http://www.w3.org/2000/svg",
      width: "1em",
      height: "1em",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    children: calloutIcons[type].map(icon => ({ type: "element", children: [], ...icon })),
  };
}

function hasClass(node, className) {
  const classList = node?.properties?.className ?? node?.properties?.class ?? [];
  return Array.isArray(classList)
    ? classList.includes(className)
    : String(classList).split(/\s+/).includes(className);
}

function replaceCalloutIcon(node) {
  if (node?.type === "element") {
    const calloutType = node.properties?.["data-callout"] ?? node.properties?.dataCallout;
    if (calloutType in calloutIcons) {
      const title = node.children?.find(child => child.type === "element" && hasClass(child, "callout-title"));
      const icon = title?.children?.find(child => child.type === "element" && hasClass(child, "callout-title-icon"));
      if (icon) icon.children = [calloutIcon(calloutType)];
    }
  }

  node.children?.forEach(replaceCalloutIcon);
}

export default function rehypePapyrusCalloutIcons() {
  return tree => replaceCalloutIcon(tree);
}
