import { useCallback, useMemo, useState } from "react";
import { createStreamerService, disableStreamerService, listStreamerServices, updateStreamerService } from "@/lib/api";
import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import { CreateStreamerServiceInput, StreamerServiceMediaKind, StreamerServiceView, UpdateStreamerServiceInput } from "@/lib/types";

type StreamerServicesPanelProps = {
  t: DashboardText;
  streamerId: number;
};

type FormState = {
  serviceKey: string;
  title: string;
  description: string;
  mediaKind: "image" | "gif";
  mediaUrl: string;
  durationMs: string;
  price: string;
  enabled: boolean;
};

type FeedbackState = {
  message: string;
  isError: boolean;
};

const DEFAULT_FORM_STATE: FormState = {
  serviceKey: "",
  title: "",
  description: "",
  mediaKind: "image",
  mediaUrl: "",
  durationMs: "5000",
  price: "0",
  enabled: true,
};

function toFormState(service: StreamerServiceView): FormState {
  return {
    serviceKey: service.serviceKey,
    title: service.title,
    description: service.description ?? "",
    mediaKind: service.mediaKind === "gif" ? "gif" : "image",
    mediaUrl: service.mediaUrl ?? "",
    durationMs: String(service.durationMs ?? 5000),
    price: String(service.price),
    enabled: service.enabled,
  };
}

function truncateUrl(value: string | null): string {
  if (!value) {
    return "-";
  }
  return value.length > 64 ? `${value.slice(0, 61)}...` : value;
}

function mediaKindLabel(t: DashboardText, value: StreamerServiceMediaKind | null): string {
  if (!value) {
    return t.streamerStudioAgentSetupUnknown;
  }
  return value;
}

export function StreamerServicesPanel({ t, streamerId }: StreamerServicesPanelProps) {
  const [services, setServices] = useState<StreamerServiceView[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disablingId, setDisablingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM_STATE);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const loadServices = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setFeedback(null);
    const response = await listStreamerServices(streamerId);
    setLoading(false);

    if (response.ok && Array.isArray(response.services)) {
      setServices(response.services);
      setLoaded(true);
      return;
    }

    setFeedback({
      message: response.message || t.streamerStudioServicesLoadFailed,
      isError: true,
    });
  }, [loading, streamerId, t.streamerStudioServicesLoadFailed]);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => {
      const next = !prev;
      if (next && !loaded) {
        void loadServices();
      }
      return next;
    });
  }, [loadServices, loaded]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(DEFAULT_FORM_STATE);
  }, []);

  const startEdit = useCallback((service: StreamerServiceView) => {
    setEditingId(service.id);
    setForm(toFormState(service));
    setExpanded(true);
    setFeedback(null);
  }, []);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const validateForm = useCallback((): CreateStreamerServiceInput | null => {
    const serviceKey = form.serviceKey.trim().toLowerCase().replace(/\s+/g, "-");
    const title = form.title.trim();
    const mediaUrl = form.mediaUrl.trim();
    const description = form.description.trim();
    const durationMs = Number(form.durationMs);
    const price = Number(form.price);

    if (!/^[a-z0-9_-]{1,64}$/.test(serviceKey)) {
      setFeedback({ message: t.streamerStudioServicesInvalidForm, isError: true });
      return null;
    }
    if (!title.length || title.length > 120) {
      setFeedback({ message: t.streamerStudioServicesInvalidForm, isError: true });
      return null;
    }
    if (!mediaUrl.startsWith("http://") && !mediaUrl.startsWith("https://")) {
      setFeedback({ message: t.streamerStudioServicesInvalidForm, isError: true });
      return null;
    }
    if (!Number.isInteger(durationMs) || durationMs < 1000 || durationMs > 15000) {
      setFeedback({ message: t.streamerStudioServicesInvalidForm, isError: true });
      return null;
    }
    if (!Number.isInteger(price) || price < 0) {
      setFeedback({ message: t.streamerStudioServicesInvalidForm, isError: true });
      return null;
    }

    return {
      serviceKey,
      title,
      description: description || null,
      serviceType: "obs_media",
      mediaKind: form.mediaKind,
      mediaUrl,
      durationMs,
      price,
      enabled: form.enabled,
    };
  }, [form, t.streamerStudioServicesInvalidForm]);

  const handleSave = useCallback(async () => {
    const payload = validateForm();
    if (!payload) {
      return;
    }

    setSaving(true);
    setFeedback(null);
    const response = editingId === null
      ? await createStreamerService(streamerId, payload)
      : await updateStreamerService(streamerId, editingId, payload as UpdateStreamerServiceInput);
    setSaving(false);

    if (!response.ok || !response.service) {
      setFeedback({
        message: response.message || t.streamerStudioServicesSaveFailed,
        isError: true,
      });
      return;
    }

    setServices(prev => {
      const withoutCurrent = prev.filter(service => service.id !== response.service!.id);
      return [response.service!, ...withoutCurrent].sort((a, b) => Number(b.enabled) - Number(a.enabled) || b.id - a.id);
    });
    resetForm();
    setFeedback({ message: t.streamerStudioServicesSaved, isError: false });
    setLoaded(true);
    setExpanded(true);
  }, [editingId, resetForm, streamerId, t.streamerStudioServicesSaveFailed, t.streamerStudioServicesSaved, validateForm]);

  const handleDisable = useCallback(async (service: StreamerServiceView) => {
    const confirmed = window.confirm(t.streamerStudioServicesDisableConfirm);
    if (!confirmed) {
      return;
    }

    setDisablingId(service.id);
    setFeedback(null);
    const response = await disableStreamerService(streamerId, service.id);
    setDisablingId(null);

    if (!response.ok) {
      setFeedback({ message: response.message || t.streamerStudioServicesDisableFailed, isError: true });
      return;
    }

    setServices(prev => prev.map(item => (item.id === service.id ? { ...item, enabled: false } : item)));
    if (editingId === service.id) {
      resetForm();
    }
    setFeedback({ message: t.streamerStudioServicesDisabled, isError: false });
  }, [editingId, resetForm, streamerId, t.streamerStudioServicesDisableConfirm, t.streamerStudioServicesDisableFailed, t.streamerStudioServicesDisabled]);

  const servicesCountText = useMemo(
    () => t.streamerStudioServicesCount.replace("{count}", String(services.length)),
    [services.length, t.streamerStudioServicesCount],
  );

  const summaryText = useMemo(() => {
    if (loading && !loaded) {
      return t.shopObsLoading;
    }
    if (!loaded) {
      return t.streamerStudioServicesSubtitle;
    }
    return services.length > 0 ? servicesCountText : t.streamerStudioServicesEmpty;
  }, [loaded, loading, services.length, servicesCountText, t.shopObsLoading, t.streamerStudioServicesEmpty, t.streamerStudioServicesSubtitle]);

  return (
    <section className={`streamer-services-panel ${expanded ? "expanded" : "collapsed"}`}>
      <div className="streamer-services-head">
        <div className="streamer-services-head-copy">
          <h3 className="section-title small">{t.streamerStudioServicesTitle}</h3>
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
          <div className="streamer-services-form">
            <label className="streamer-transform-field">
              <span>{t.streamerStudioServicesServiceKey}</span>
              <input
                type="text"
                maxLength={64}
                value={form.serviceKey}
                onChange={(event) => updateField("serviceKey", event.target.value.slice(0, 64).toLowerCase())}
              />
            </label>
            <label className="streamer-transform-field">
              <span>{t.streamerStudioServicesTitleField}</span>
              <input
                type="text"
                maxLength={120}
                value={form.title}
                onChange={(event) => updateField("title", event.target.value.slice(0, 120))}
              />
            </label>
            <label className="streamer-transform-field streamer-services-form-wide">
              <span>{t.streamerStudioServicesDescription}</span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value.slice(0, 500))}
              />
            </label>
            <label className="streamer-transform-field">
              <span>{t.streamerStudioServicesMediaKind}</span>
              <select className="searchable-select streamer-trusted-select" value={form.mediaKind} onChange={(event) => updateField("mediaKind", event.target.value as "image" | "gif")}>
                <option value="image">image</option>
                <option value="gif">gif</option>
              </select>
            </label>
            <label className="streamer-transform-field streamer-services-form-wide">
              <span>{t.streamerStudioServicesMediaUrl}</span>
              <input
                type="url"
                value={form.mediaUrl}
                onChange={(event) => updateField("mediaUrl", event.target.value)}
                placeholder="https://example.com/media.gif"
              />
            </label>
            <label className="streamer-transform-field">
              <span>{t.streamerStudioServicesDuration}</span>
              <input
                type="number"
                min={1000}
                max={15000}
                step={1000}
                value={form.durationMs}
                onChange={(event) => updateField("durationMs", event.target.value)}
              />
            </label>
            <label className="streamer-transform-field">
              <span>{t.streamerStudioServicesPrice}</span>
              <input
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
              />
            </label>
            <label className="streamer-services-checkbox">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) => updateField("enabled", event.target.checked)}
              />
              <span>{t.streamerStudioServicesEnabled}</span>
            </label>
          </div>

          <p className="market-card-hint streamer-services-form-hint">{t.streamerStudioServicesHint}</p>

          <div className="streamer-services-actions">
            <button className="pagination-btn" type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving
                ? t.streamerStudioAgentSetupBinding
                : editingId === null
                  ? t.streamerStudioServicesCreate
                  : t.streamerStudioServicesEdit}
            </button>
            {editingId !== null ? (
              <button className="pagination-btn ghost" type="button" onClick={resetForm} disabled={saving}>
                {t.adminBotShopCancel}
              </button>
            ) : null}
          </div>

          {feedback ? (
            <p className={`streamer-services-feedback ${feedback.isError ? "state-error" : "state-ok"}`}>
              {feedback.message}
            </p>
          ) : null}

          <div className="streamer-services-list">
            {loading ? <p className="state-text compact">{t.shopObsLoading}</p> : null}
            {!loading && loaded && services.length === 0 ? <p className="state-text state-empty">{t.streamerStudioServicesEmpty}</p> : null}
            {services.map(service => (
              <div className="streamer-services-card" key={service.id}>
                <div className="streamer-services-card-head">
                  <div className="streamer-services-card-copy">
                    <strong>{service.title}</strong>
                    <span>{service.description || t.streamerStudioServicesObsMedia}</span>
                  </div>
                  <span className={`streamer-services-badge ${service.enabled ? "enabled" : "disabled"}`}>
                    {service.enabled ? t.streamerStudioServicesEnabled : t.streamerStudioServicesDisabledLabel}
                  </span>
                </div>
                <div className="streamer-services-meta-grid">
                  <div>
                    <span>{t.streamerStudioServicesServiceKey}</span>
                    <strong>{service.serviceKey}</strong>
                  </div>
                  <div>
                    <span>{t.streamerStudioServicesType}</span>
                    <strong>{service.serviceType}</strong>
                  </div>
                  <div>
                    <span>{t.streamerStudioServicesMediaKind}</span>
                    <strong>{mediaKindLabel(t, service.mediaKind)}</strong>
                  </div>
                  <div>
                    <span>{t.streamerStudioServicesDuration}</span>
                    <strong>{service.durationMs ?? 0} ms</strong>
                  </div>
                  <div>
                    <span>{t.streamerStudioServicesPrice}</span>
                    <strong>{service.price} ODM</strong>
                  </div>
                  <div>
                    <span>{t.streamerStudioAgentSetupLastSeen}</span>
                    <strong>{formatDashboardDate(service.updatedAt, typeof navigator !== "undefined" ? navigator.language : "en-US", t.streamerStudioAgentSetupUnknown)}</strong>
                  </div>
                </div>
                <div className="streamer-services-url-row">
                  <span>{t.streamerStudioServicesMediaUrl}</span>
                  <strong title={service.mediaUrl ?? undefined}>{truncateUrl(service.mediaUrl)}</strong>
                </div>
                <div className="streamer-services-actions compact">
                  <button className="pagination-btn ghost" type="button" onClick={() => startEdit(service)}>
                    {t.streamerStudioServicesEdit}
                  </button>
                  <button className="pagination-btn ghost danger" type="button" onClick={() => void handleDisable(service)} disabled={!service.enabled || disablingId === service.id}>
                    {t.streamerStudioServicesDisable}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
