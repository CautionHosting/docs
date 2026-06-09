let mermaidColorScheme = "";

const getMermaidColorScheme = () =>
  document.body?.getAttribute("data-md-color-scheme") ||
  document.documentElement.getAttribute("data-md-color-scheme") ||
  "default";

const getMermaidColor = (name) => {
  const styles = getComputedStyle(document.body || document.documentElement);
  return styles.getPropertyValue(name).trim();
};

const getMermaidThemeVariables = () => ({
  background: getMermaidColor("--caution-mermaid-background"),
  primaryColor: getMermaidColor("--caution-mermaid-node-bg"),
  primaryBorderColor: getMermaidColor("--caution-mermaid-node-border"),
  primaryTextColor: getMermaidColor("--caution-mermaid-node-text"),
  secondaryColor: getMermaidColor("--caution-mermaid-alt-bg"),
  secondaryBorderColor: getMermaidColor("--caution-mermaid-alt-border"),
  secondaryTextColor: getMermaidColor("--caution-mermaid-node-text"),
  tertiaryColor: getMermaidColor("--caution-mermaid-accent-bg"),
  tertiaryBorderColor: getMermaidColor("--caution-mermaid-accent-border"),
  tertiaryTextColor: getMermaidColor("--caution-mermaid-node-text"),
  mainBkg: getMermaidColor("--caution-mermaid-node-bg"),
  nodeBkg: getMermaidColor("--caution-mermaid-node-bg"),
  nodeBorder: getMermaidColor("--caution-mermaid-node-border"),
  nodeTextColor: getMermaidColor("--caution-mermaid-node-text"),
  textColor: getMermaidColor("--caution-mermaid-node-text"),
  titleColor: getMermaidColor("--caution-mermaid-node-text"),
  lineColor: getMermaidColor("--caution-mermaid-line"),
  defaultLinkColor: getMermaidColor("--caution-mermaid-line"),
  arrowheadColor: getMermaidColor("--caution-mermaid-line"),
  clusterBkg: getMermaidColor("--caution-mermaid-cluster-bg"),
  clusterBorder: getMermaidColor("--caution-mermaid-cluster-border"),
  edgeLabelBackground: getMermaidColor("--caution-mermaid-edge-label-bg"),
  actorBkg: getMermaidColor("--caution-mermaid-node-bg"),
  actorBorder: getMermaidColor("--caution-mermaid-node-border"),
  actorTextColor: getMermaidColor("--caution-mermaid-node-text"),
  actorLineColor: getMermaidColor("--caution-mermaid-line"),
  signalColor: getMermaidColor("--caution-mermaid-line"),
  signalTextColor: getMermaidColor("--caution-mermaid-node-text"),
  labelBoxBkgColor: getMermaidColor("--caution-mermaid-alt-bg"),
  labelBoxBorderColor: getMermaidColor("--caution-mermaid-alt-border"),
  labelTextColor: getMermaidColor("--caution-mermaid-node-text"),
  loopTextColor: getMermaidColor("--caution-mermaid-node-text"),
  noteBkgColor: getMermaidColor("--caution-mermaid-note-bg"),
  noteBorderColor: getMermaidColor("--caution-mermaid-accent-border"),
  noteTextColor: getMermaidColor("--caution-mermaid-node-text"),
  activationBkgColor: getMermaidColor("--caution-mermaid-alt-bg"),
  activationBorderColor: getMermaidColor("--caution-mermaid-alt-border"),
  sectionBkgColor: getMermaidColor("--caution-mermaid-section-bg"),
  altSectionBkgColor: getMermaidColor("--caution-mermaid-alt-section-bg"),
  sectionBkgColor2: getMermaidColor("--caution-mermaid-alt-bg"),
});

const configureMermaid = () => {
  window.mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    themeVariables: getMermaidThemeVariables(),
  });
  mermaidColorScheme = getMermaidColorScheme();
};

const prepareMermaidNodes = () => {
  for (const code of document.querySelectorAll("pre code.language-mermaid")) {
    const pre = code.closest("pre");
    if (!pre || pre.dataset.mermaidPrepared === "true") continue;

    const source = code.textContent || "";
    const output = document.createElement("div");
    output.className = "mermaid";
    output.textContent = source;
    output.dataset.mermaidSource = source;

    pre.insertAdjacentElement("afterend", output);
    pre.dataset.mermaidPrepared = "true";
  }

  for (const node of document.querySelectorAll(".mermaid")) {
    if (node.dataset.mermaidSource) continue;

    const code = node.querySelector("code");
    const source = code?.textContent || node.textContent || "";
    node.dataset.mermaidSource = source;
    node.textContent = source;
  }
};

const resetRenderedMermaid = () => {
  for (const node of document.querySelectorAll(".mermaid")) {
    if (!node.dataset.mermaidSource) continue;

    node.removeAttribute("data-processed");
    node.dataset.mermaidRendered = "false";
    node.textContent = node.dataset.mermaidSource;
  }
};

const renderMermaid = async () => {
  if (!window.mermaid) return;

  configureMermaid();
  prepareMermaidNodes();

  const nodes = Array.from(document.querySelectorAll(".mermaid")).filter(
    (node) => node.dataset.mermaidRendered !== "true"
  );

  if (!nodes.length) return;

  try {
    await window.mermaid.run({ nodes });
  } catch (error) {
    console.error("Failed to render Mermaid diagrams", error);
    return;
  }

  for (const node of nodes) {
    node.dataset.mermaidRendered = "true";

    const pre = node.previousElementSibling;
    if (pre?.dataset.mermaidPrepared === "true") {
      pre.hidden = true;
    }
  }
};

document.addEventListener("DOMContentLoaded", renderMermaid);

if (typeof document$ !== "undefined") {
  document$.subscribe(() => {
    renderMermaid();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.body) return;

  new MutationObserver(() => {
    if (getMermaidColorScheme() === mermaidColorScheme) return;

    resetRenderedMermaid();
    renderMermaid();
  }).observe(document.body, {
    attributes: true,
    attributeFilter: ["data-md-color-scheme"],
  });
});
