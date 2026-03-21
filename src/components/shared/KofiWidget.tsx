"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    kofiwidget2?: {
      init: (text: string, color: string, id: string) => void;
      getHTML: () => string;
    };
  }
}

export function KofiWidget() {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    const initWidget = () => {
      if (!window.kofiwidget2) return;
      window.kofiwidget2.init("Regalame un cafe", "#141213", "A0A71WAQS6");
      setHtml(window.kofiwidget2.getHTML());
    };

    if (window.kofiwidget2) {
      initWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/widget/Widget_2.js";
    script.async = true;
    script.onload = initWidget;
    document.head.appendChild(script);
  }, []);

  if (html) {
    return (
      <div
        className="flex items-center"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Fallback while script loads
  return (
    <a
      href="https://ko-fi.com/A0A71WAQS6"
      target="_blank"
      rel="noreferrer"
      className="h-9 px-4 rounded-lg text-sm font-bold cursor-pointer transition-all flex items-center gap-2 hover:brightness-110 active:scale-95"
      style={{
        background: "#141213",
        color: "#ffffff",
        border: "none",
        boxShadow: "0 2px 0 #050505",
        fontFamily: '"Segoe UI", sans-serif',
        letterSpacing: "0.01em",
        textDecoration: "none",
      }}
    >
      <span aria-hidden="true">☕</span>
      <span className="hidden sm:inline">Regalame un cafe</span>
    </a>
  );
}
