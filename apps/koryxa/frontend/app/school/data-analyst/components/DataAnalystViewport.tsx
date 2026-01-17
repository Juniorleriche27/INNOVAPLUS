"use client";

import { useEffect } from "react";

export default function DataAnalystViewport() {
  useEffect(() => {
    document.body.classList.add("koryxa-data-analyst");
    return () => {
      document.body.classList.remove("koryxa-data-analyst");
    };
  }, []);

  return null;
}
