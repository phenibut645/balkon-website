"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";

type OverviewModelShowcaseProps = {
  t: DashboardText;
  onOpenBotShop?: () => void;
  onOpenObsShop?: () => void;
};

type ModelViewerElement = HTMLElement & {
  dismissPoster?: () => void;
};

export function OverviewModelShowcase({ t, onOpenBotShop, onOpenObsShop }: OverviewModelShowcaseProps) {
  const [modelReady, setModelReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const [viewerRegistered, setViewerRegistered] = useState(false);
  const viewerRef = useRef<ModelViewerElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import("@google/model-viewer")
      .then(() => {
        if (!cancelled) {
          setViewerRegistered(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setModelFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!viewerRegistered) {
      return;
    }

    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }

    setModelReady(false);
    setModelFailed(false);

    const handleLoad = () => {
      setModelReady(true);
      setModelFailed(false);
      viewer.dismissPoster?.();
    };

    const handleError = () => {
      setModelReady(false);
      setModelFailed(true);
    };

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
    };
  }, [viewerRegistered]);

  return (
    <section className="overview-model-showcase">
      <div className="overview-model-card">
        <div className="overview-model-copy">
          <div className="overview-model-copy-top">
            <p className="overview-eyebrow">{t.overviewShowcaseEyebrow}</p>
            <h3>{t.overviewShowcaseTitle}</h3>
            <p>{t.overviewShowcaseSubtitle}</p>
          </div>
          <div className="overview-model-actions">
            {onOpenBotShop ? (
              <button type="button" className="overview-inline-action" onClick={onOpenBotShop}>
                {t.tabBotShop}
              </button>
            ) : null}
            {onOpenObsShop ? (
              <button type="button" className="overview-inline-action ghost" onClick={onOpenObsShop}>
                {t.shopObs}
              </button>
            ) : null}
          </div>
        </div>

        <div className="overview-model-stage">
          {viewerRegistered ? (
            <model-viewer
              ref={viewerRef}
              src="/models/balkon-showcase.glb"
              alt={t.overviewShowcaseTitle}
              camera-controls=""
              auto-rotate=""
              shadow-intensity="0.8"
              exposure="1"
              style={{ width: "100%", height: "100%" }}
            />
          ) : null}

          {!modelReady || modelFailed || !viewerRegistered ? (
            <div className="overview-model-placeholder" aria-live="polite">
              <div>
                <p className="overview-model-placeholder-title">{t.overviewModelSoon}</p>
                <p className="overview-model-placeholder-text">{t.overviewShowcaseSubtitle}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
