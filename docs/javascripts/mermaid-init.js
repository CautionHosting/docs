const renderMermaid = () => {
  if (!window.mermaid) return;

  window.mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
  });

  for (const code of document.querySelectorAll("pre code.language-mermaid")) {
    const pre = code.closest("pre");
    if (!pre || pre.dataset.mermaidPrepared === "true") continue;

    const output = document.createElement("div");
    output.className = "mermaid";
    output.textContent = code.textContent || "";

    pre.insertAdjacentElement("afterend", output);
    pre.dataset.mermaidPrepared = "true";
  }

  const nodes = Array.from(document.querySelectorAll(".mermaid")).filter(
    (node) => node.dataset.mermaidRendered !== "true"
  );

  if (!nodes.length) return;

  window.mermaid.run({ nodes });
  for (const node of nodes) node.dataset.mermaidRendered = "true";
};

document.addEventListener("DOMContentLoaded", renderMermaid);

if (typeof document$ !== "undefined") {
  document$.subscribe(() => {
    renderMermaid();
  });
}
