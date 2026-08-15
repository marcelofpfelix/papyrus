import { h } from "hastscript";

function parseMetaString(str = "") {
  return Object.fromEntries(
    str.split(" ").reduce((acc, cur) => {
      const matched = cur.match(/(.+)?=("(.+)"|'(.+)')$/);
      if (matched === null) return acc;
      const key = matched[1];
      const value = matched[3] || matched[4] || true;
      acc.push([key, value]);
      return acc;
    }, [])
  );
}

const codeIcons = {
  clipboard: [
    h("path", { d: "m12.593 23.258-.011.002-.071.035-.02.004-.014-.004-.071-.035q-.016-.005-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427q-.004-.016-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093q.019.005.029-.008l.004-.014-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014-.034.614q.001.018.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z" }),
    h("path", { fill: "currentColor", d: "M15 2c.683 0 1.287.343 1.647.866l.085.134H18a2 2 0 0 1 1.995 1.85L20 5v12a5 5 0 0 1-4.783 4.995L15 22H6a2 2 0 0 1-1.995-1.85L4 20V5a2 2 0 0 1 1.85-1.995L6 3h1.268a2 2 0 0 1 1.563-.993L9 2zM7 5H6v15h9a3 3 0 0 0 3-3V5h-1a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2m5 9a1 1 0 0 1 .117 1.993L12 16H9a1 1 0 0 1-.117-1.993L9 14zm3-4a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2zm0-6H9v1h6z" }),
  ],
  fileCheck: [
    h("path", { d: "m12.593 23.258-.011.002-.071.035-.02.004-.014-.004-.071-.035q-.016-.005-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427q-.004-.016-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093q.019.005.029-.008l.004-.014-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014-.034.614q.001.018.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z" }),
    h("path", { fill: "currentColor", d: "M13.586 2A2 2 0 0 1 15 2.586L19.414 7A2 2 0 0 1 20 8.414V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 4H6v16h12V10h-4.5A1.5 1.5 0 0 1 12 8.5zm1.59 8.657a1 1 0 0 1 1.415 1.414l-3.111 3.112a1.1 1.1 0 0 1-1.556 0l-1.343-1.344a1 1 0 0 1 1.414-1.414l.707.707ZM14 4.414V8h3.586z" }),
  ],
  arrowDown: [
    h("path", { d: "M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035q-.016-.005-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427q-.004-.016-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093q.019.005.029-.008l.004-.014-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014-.034.614q.001.018.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z" }),
    h("path", { fill: "currentColor", d: "m11 17.243-3.95-3.95a1 1 0 1 0-1.414 1.414l5.657 5.657a1 1 0 0 0 1.414 0l5.657-5.657a1 1 0 0 0-1.414-1.414L13 17.243V4a1 1 0 1 0-2 0z" }),
  ],
};

function codeIcon(name) {
  return h("svg", { class: "size-5", viewBox: "0 0 24 24", "aria-hidden": "true" }, [
    h("g", { fill: "none" }, codeIcons[name]),
  ]);
}

// Copied from Pure: nest the original Shiki pre inside the outer astro-code node.
export const updateStyle = () => ({
  name: "shiki-transformer-update-style",
  pre(node) {
    const container = h("pre", node.children);
    node.children = [container];
    node.tagName = "div";
  },
});

export const processMeta = () => ({
  name: "shiki-transformer-process-meta",
  preprocess() {
    if (!this.options.meta) return;
    const rawMeta = this.options.meta?.__raw;
    if (!rawMeta) return;
    const meta = parseMetaString(rawMeta);
    Object.assign(this.options.meta, meta);
  },
});

export const addTitle = () => ({
  name: "shiki-transformer-add-title",
  pre(node) {
    const rawMeta = this.options.meta?.__raw;
    if (!rawMeta) return;
    const meta = parseMetaString(rawMeta);
    if (!meta.title) return;

    const div = h(
      "div",
      {
        class: "title text-sm text-muted-foreground px-3 py-1 rounded-lg border",
      },
      meta.title.toString()
    );
    node.children.unshift(div);
  },
});

export const addLanguage = () => ({
  name: "shiki-transformer-add-language",
  pre(node) {
    const span = h(
      "span",
      { class: "language ps-1 pe-3 text-sm bg-muted text-muted-foreground" },
      this.options.lang
    );
    node.children.push(span);
  },
});

export const addCopyButton = (timeout) => {
  const toggleMs = timeout || 2000;
  return {
    name: "shiki-transformer-copy-button",
    pre(node) {
      const button = h(
        "button",
        {
          class: "copy text-muted-foreground p-1 box-content border rounded-lg bg-card",
          "aria-label": "Copy code",
          "data-code": this.source,
          onclick: `
          navigator.clipboard.writeText(this.dataset.code);
          this.classList.add('copied');
          setTimeout(() => this.classList.remove('copied'), ${toggleMs})
        `,
        },
        [
          h("div", { class: "ready" }, [
            codeIcon("clipboard"),
          ]),
          h("div", { class: "success hidden" }, [
            codeIcon("fileCheck"),
          ]),
        ]
      );
      node.children.push(button);
    },
  };
};

export const addCollapse = (displayLineCount) => {
  const line = displayLineCount || 15;
  return {
    name: "shiki-transformer-add-collapse",
    pre(node) {
      if (this.lines.length <= line) return;
      node.properties = {
        ...node.properties,
        class: `${node.properties?.class || ""} collapsed`,
      };
      const collapse = h(
        "button",
        {
          class: "collapse-toggle bg-card text-muted-foreground rounded-lg m-2",
          "aria-label": "Toggle collapse code block",
          onclick: "this.parentElement.classList.toggle('collapsed')",
        },
        [
          codeIcon("arrowDown"),
          h("span", { class: "desc" }, " code"),
        ]
      );
      node.children.push(collapse);
      node.children.push(h("div", { class: "collapse-fade" }));
    },
  };
};
