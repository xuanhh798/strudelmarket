"use client";

import { useEffect } from "react";

interface StrudelPlayerProps {
  code: string;
  isPlaying: boolean;
  onStop: () => void;
}

export function StrudelPlayer({ code, isPlaying, onStop }: StrudelPlayerProps) {
  useEffect(() => {
    if (isPlaying) {
      // Open pattern in Strudel REPL for MVP
      // Strudel uses base64 encoding in the hash
      const base64Code = btoa(code);
      window.open(`https://strudel.cc/#${base64Code}`, "_blank");

      // Reset play state since we opened in new tab
      onStop();
    }
  }, [isPlaying, code, onStop]);

  return null;
}
