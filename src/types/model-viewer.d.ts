import type * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: string;
        exposure?: string;
        poster?: string;
        "camera-controls"?: string;
        "auto-rotate"?: string;
        "shadow-intensity"?: string;
      };
    }
  }
}

export {};
