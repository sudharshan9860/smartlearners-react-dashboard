import { useEffect, useRef } from "react";

export const useKatex = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderKaTeX = async () => {
      try {
        // Dynamically import renderMathInElement
        const { default: renderMathInElement } =
          await import("katex/dist/contrib/auto-render.mjs");

        if (containerRef.current) {
          renderMathInElement(containerRef.current, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false },
              { left: "\\(", right: "\\)", display: false },
              { left: "\\[", right: "\\]", display: true },
            ],
            throwOnError: false,
          });
        }
      } catch (error) {
        console.error("KaTeX rendering error:", error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(renderKaTeX, 100);

    return () => clearTimeout(timer);
  }, [containerRef.current]);

  return containerRef;
};

// Helper function to render KaTeX in a specific element
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
