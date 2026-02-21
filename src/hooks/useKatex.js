import { useEffect, useRef, useCallback } from "react";

// ─── useKatex hook (Fix #2) ────────────────────────────────────────────────────
// `containerRef.current` is NOT a valid useEffect dependency — refs are mutable
// objects whose `.current` changes don't trigger re-renders, so React will never
// re-run the effect when the ref value changes.
//
// The correct pattern is a *callback ref*: pass the returned `setRef` as the
// component's `ref` prop. React will call it with the DOM node once it mounts,
// and we render KaTeX at that point.

export const useKatex = () => {
  // We store the DOM node so the callback ref can trigger rendering
  const containerRef = useRef(null);

  const runKatex = useCallback(async (node) => {
    if (!node) return;
    try {
      const { default: renderMathInElement } =
        await import("katex/dist/contrib/auto-render.mjs");
      renderMathInElement(node, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
      });
    } catch (error) {
      console.error("KaTeX rendering error:", error);
    }
  }, []);

  // Callback ref — called by React with the actual DOM node
  const setRef = useCallback(
    (node) => {
      containerRef.current = node;
      if (node) {
        // Small delay ensures the component's children are fully painted
        setTimeout(() => runKatex(node), 100);
      }
    },
    [runKatex],
  );

  return setRef;
};

// ─── Standalone helper ─────────────────────────────────────────────────────────
export const renderKaTeX = async (element) => {
  if (!element) return;
  try {
    const { default: renderMathInElement } =
      await import("katex/dist/contrib/auto-render.mjs");
    renderMathInElement(element, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
    });
  } catch (error) {
    console.error("KaTeX rendering error:", error);
  }
};
