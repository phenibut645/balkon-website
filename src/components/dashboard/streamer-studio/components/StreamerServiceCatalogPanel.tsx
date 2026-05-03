import { useCallback, useMemo, useState } from "react";
import { listStreamerServiceCatalog, purchaseStreamerService } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { StreamerServiceCatalogItem, StreamerServiceMediaKind } from "@/lib/types";

type StreamerServiceCatalogPanelProps = {
  t: DashboardText;
  streamerId: number;
  onPurchaseSuccess?: () => Promise<void> | void;
};

type FeedbackState = {
  message: string;
  isError: boolean;
};

function toDurationLabel(durationMs: number | null): string {
  if (!durationMs || durationMs <= 0) {
    return "0 s";
  }

  const seconds = Math.max(1, Math.round(durationMs / 1000));
  return `${seconds} s`;
}

function mediaKindLabel(value: StreamerServiceMediaKind | null): string {
  return value || "obs_media";
}

function errorMessageForCode(t: DashboardText, code?: string, fallback?: string): string {
  switch (code) {
    case "STREAMER_SERVICE_NOT_ENOUGH_ODM":
      return t.streamerStudioCatalogNotEnoughOdm;
    case "STREAMER_SERVICE_AGENT_NOT_CONFIGURED":
      return t.streamerStudioCatalogAgentNotConfigured;
    case "STREAMER_SERVICE_AGENT_OFFLINE":
      return t.streamerStudioCatalogAgentOffline;
    case "STREAMER_SERVICE_DISABLED":
    case "STREAMER_SERVICE_NOT_FOUND":
      return t.streamerStudioCatalogUnavailable;
    case "STREAMER_SERVICE_COMMAND_FAILED":
      return t.streamerStudioCatalogCommandFailed;
    default:
      return fallback || t.streamerStudioCatalogPurchaseFailed;
  }
}

export function StreamerServiceCatalogPanel({ t, streamerId, onPurchaseSuccess }: StreamerServiceCatalogPanelProps) {
  const [services, setServices] = useState<StreamerServiceCatalogItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const loadServices = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setFeedback(null);
    const response = await listStreamerServiceCatalog(streamerId);
    setLoading(false);

    if (response.ok && Array.isArray(response.services)) {
      setServices(response.services);
      setLoaded(true);
      return;
    }

    setFeedback({
      message: response.message || t.streamerStudioCatalogLoadFailed,
      isError: true,
    });
  }, [loading, streamerId, t.streamerStudioCatalogLoadFailed]);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => {
      const next = !prev;
      if (next && !loaded) {
        void loadServices();
      }
      return next;
    });
  }, [loadServices, loaded]);

  const countText = useMemo(
    () => t.streamerStudioCatalogCount.replace("{count}", String(services.length)),
    [services.length, t.streamerStudioCatalogCount],
  );

  const summaryText = useMemo(() => {
    if (loading && !loaded) {
      return t.shopObsLoading;
    }
    if (!loaded) {
      return t.streamerStudioCatalogSubtitle;
    }
    return services.length > 0 ? countText : t.streamerStudioCatalogEmpty;
  }, [countText, loaded, loading, services.length, t.shopObsLoading, t.streamerStudioCatalogEmpty, t.streamerStudioCatalogSubtitle]);

  const handlePurchase = useCallback(async (service: StreamerServiceCatalogItem) => {
    const confirmed = window.confirm(
      t.streamerStudioCatalogConfirmPurchase
        .replace("{title}", service.title)
        .replace("{price}", String(service.price)),
    );
    if (!confirmed) {
      return;
    }

    setBuyingId(service.id);
    setFeedback(null);
    const response = await purchaseStreamerService(streamerId, service.id);
    setBuyingId(null);

    if (!response.ok || !response.data) {
      setFeedback({
        message: errorMessageForCode(t, response.error, response.message),
        isError: true,
      });
      if (response.error === "STREAMER_SERVICE_DISABLED" || response.error === "STREAMER_SERVICE_NOT_FOUND") {
        void loadServices();
      }
      return;
    }

    if (onPurchaseSuccess) {
      await onPurchaseSuccess();
    }

    const successMessage = response.data.balanceAfter >= 0
      ? `${t.streamerStudioCatalogSent}. ${t.balanceAfter}: ${response.data.balanceAfter} ODM`
      : t.streamerStudioCatalogSent;

    setFeedback({ message: successMessage, isError: false });
  }, [loadServices, onPurchaseSuccess, streamerId, t]);

  return (
    <section className={`streamer-service-catalog-panel ${expanded ? "expanded" : "collapsed"}`}>
      <div className="streamer-services-head">
        <div className="streamer-services-head-copy">
          <h3 className="section-title small">{t.streamerStudioCatalogTitle}</h3>
          <p className="market-card-hint">{summaryText}</p>
        </div>
        <div className="streamer-services-head-actions">
          {expanded ? (
            <button className="pagination-btn ghost" type="button" onClick={() => void loadServices()} disabled={loading}>
              {t.streamerStudioServicesRefresh}
            </button>
          ) : null}
          <button className="pagination-btn ghost" type="button" onClick={toggleExpanded}>
            {expanded ? t.streamerStudioTrustedUsersCollapse : t.streamerStudioTrustedUsersOpen}
          </button>
        </div>
      </div>

      {!expanded ? <p className="streamer-services-compact-summary">{summaryText}</p> : null}

      {expanded ? (
        <>
          {feedback ? (
            <p className={`streamer-services-feedback ${feedback.isError ? "state-error" : "state-ok"}`}>
              {feedback.message}
            </p>
          ) : null}

          <div className="streamer-service-catalog-list">
            {loading ? <p className="state-text compact">{t.shopObsLoading}</p> : null}
            {!loading && loaded && services.length === 0 ? <p className="state-text state-empty">{t.streamerStudioCatalogEmpty}</p> : null}
            {services.map(service => (
              <article className="streamer-service-catalog-card" key={service.id}>
                {service.mediaUrl ? (
                  <div
                    className="streamer-service-catalog-preview"
                    style={{ backgroundImage: `url(${JSON.stringify(service.mediaUrl).slice(1, -1)})` }}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="streamer-service-catalog-body">
                  <div className="streamer-services-card-head">
                    <div className="streamer-services-card-copy">
                      <strong>{service.title}</strong>
                      <span>{service.description || t.streamerStudioCatalogBuyEffects}</span>
                    </div>
                    <span className="streamer-services-badge enabled">{mediaKindLabel(service.mediaKind)}</span>
                  </div>

                  <div className="streamer-services-meta-grid">
                    <div>
                      <span>{t.streamerStudioServicesDuration}</span>
                      <strong>{toDurationLabel(service.durationMs)}</strong>
                    </div>
                    <div>
                      <span>{t.streamerStudioServicesPrice}</span>
                      <strong>{service.price} ODM</strong>
                    </div>
                    <div>
                      <span>{t.streamerStudioServicesType}</span>
                      <strong>{service.serviceType}</strong>
                    </div>
                  </div>

                  <div className="streamer-services-actions compact">
                    <button
                      className="pagination-btn"
                      type="button"
                      onClick={() => void handlePurchase(service)}
                      disabled={buyingId === service.id}
                    >
                      {buyingId === service.id ? t.buying : t.streamerStudioCatalogBuy}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
