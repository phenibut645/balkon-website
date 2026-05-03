"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createAdminJob, disableAdminJob, getAdminJobs, updateAdminJob } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { JobInput, JobView } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";

type AdminJobsPanelProps = {
  t: DashboardText;
};

type JobFormState = {
  jobKey: string;
  titleRu: string;
  titleEn: string;
  titleEt: string;
  descriptionRu: string;
  descriptionEn: string;
  descriptionEt: string;
  iconUrl: string;
  rewardAmount: string;
  cooldownSeconds: string;
  enabled: boolean;
  rewardItemId: string;
  rewardItemChancePercent: string;
  rewardItemQuantity: string;
};

const INITIAL_FORM_STATE: JobFormState = {
  jobKey: "",
  titleRu: "",
  titleEn: "",
  titleEt: "",
  descriptionRu: "",
  descriptionEn: "",
  descriptionEt: "",
  iconUrl: "",
  rewardAmount: "0",
  cooldownSeconds: "0",
  enabled: true,
  rewardItemId: "",
  rewardItemChancePercent: "",
  rewardItemQuantity: "",
};

function mapJobToForm(job: JobView): JobFormState {
  return {
    jobKey: job.jobKey,
    titleRu: job.titleRu,
    titleEn: job.titleEn || "",
    titleEt: job.titleEt || "",
    descriptionRu: job.descriptionRu || "",
    descriptionEn: job.descriptionEn || "",
    descriptionEt: job.descriptionEt || "",
    iconUrl: job.iconUrl || "",
    rewardAmount: String(job.rewardAmount),
    cooldownSeconds: String(job.cooldownSeconds),
    enabled: job.enabled,
    rewardItemId: job.rewardItemId === null ? "" : String(job.rewardItemId),
    rewardItemChancePercent: job.rewardItemChancePercent === null ? "" : String(job.rewardItemChancePercent),
    rewardItemQuantity: job.rewardItemQuantity === null ? "" : String(job.rewardItemQuantity),
  };
}

function mapFormToInput(form: JobFormState): JobInput {
  return {
    jobKey: form.jobKey.trim(),
    titleRu: form.titleRu.trim(),
    titleEn: form.titleEn.trim() || null,
    titleEt: form.titleEt.trim() || null,
    descriptionRu: form.descriptionRu.trim() || null,
    descriptionEn: form.descriptionEn.trim() || null,
    descriptionEt: form.descriptionEt.trim() || null,
    iconUrl: form.iconUrl.trim() || null,
    rewardAmount: Number(form.rewardAmount || 0),
    cooldownSeconds: Number(form.cooldownSeconds || 0),
    enabled: form.enabled,
    rewardItemId: form.rewardItemId.trim() ? Number(form.rewardItemId) : null,
    rewardItemChancePercent: form.rewardItemChancePercent.trim() ? Number(form.rewardItemChancePercent) : null,
    rewardItemQuantity: form.rewardItemQuantity.trim() ? Number(form.rewardItemQuantity) : null,
  };
}

export function AdminJobsPanel({ t }: AdminJobsPanelProps) {
  const [jobs, setJobs] = useState<JobView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editingJob, setEditingJob] = useState<JobView | null>(null);
  const [disableTarget, setDisableTarget] = useState<JobView | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [form, setForm] = useState<JobFormState>(INITIAL_FORM_STATE);

  const loadJobs = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const response = await getAdminJobs();
    if (response.ok && Array.isArray(response.data)) {
      setJobs(response.data);
      setLoading(false);
      return;
    }

    setJobs([]);
    setLoading(false);
    setError(response.message || response.error || t.adminJobsLoadError);
  }, [t.adminJobsLoadError]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    setForm(editingJob ? mapJobToForm(editingJob) : INITIAL_FORM_STATE);
  }, [editingJob]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery.length) {
      return jobs;
    }

    return jobs.filter(job => {
      return job.jobKey.toLowerCase().includes(normalizedQuery)
        || job.titleRu.toLowerCase().includes(normalizedQuery)
        || (job.titleEn || "").toLowerCase().includes(normalizedQuery)
        || (job.titleEt || "").toLowerCase().includes(normalizedQuery);
    });
  }, [jobs, query]);

  function updateForm<K extends keyof JobFormState>(key: K, value: JobFormState[K]): void {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(): Promise<void> {
    setSubmitting(true);
    setFeedback(null);

    const input = mapFormToInput(form);
    const response = editingJob
      ? await updateAdminJob(editingJob.id, input)
      : await createAdminJob(input);

    if (!response.ok) {
      setSubmitting(false);
      setFeedback(response.message || response.error || t.adminJobsSaveError);
      return;
    }

    setSubmitting(false);
    setEditingJob(null);
    setForm(INITIAL_FORM_STATE);
    setFeedback(editingJob ? t.adminJobsUpdated : t.adminJobsCreated);
    await loadJobs();
  }

  async function handleDisableConfirm(): Promise<void> {
    if (!disableTarget) {
      return;
    }

    setDisabling(true);
    const response = await disableAdminJob(disableTarget.id);
    setDisabling(false);

    if (!response.ok) {
      setFeedback(response.message || response.error || t.adminJobsDisableFailed);
      return;
    }

    setDisableTarget(null);
    if (editingJob?.id === disableTarget.id) {
      setEditingJob(null);
    }
    setFeedback(t.adminJobsDisabled);
    await loadJobs();
  }

  return (
    <div className="panel panel-overview admin-items-panel">
      <div className="inventory-toolbar">
        <h2 className="section-title">{t.adminJobsTitle}</h2>
        <button className="pagination-btn" type="button" onClick={() => void loadJobs()}>
          {t.adminJobsRefresh}
        </button>
      </div>

      <div className="admin-item-form">
        <div className="inventory-toolbar compact">
          <h3 className="display-name">{editingJob ? t.adminJobsEdit : t.adminJobsCreate}</h3>
          {editingJob ? (
            <button className="pagination-btn" type="button" onClick={() => setEditingJob(null)}>
              {t.adminJobsCancel}
            </button>
          ) : null}
        </div>

        <div className="admin-form-grid">
          <label>
            <span className="admin-field-label">{t.adminJobsJobKey}</span>
            <input className="admin-field-input" value={form.jobKey} onChange={event => updateForm("jobKey", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsTitleRu}</span>
            <input className="admin-field-input" value={form.titleRu} onChange={event => updateForm("titleRu", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsTitleEn}</span>
            <input className="admin-field-input" value={form.titleEn} onChange={event => updateForm("titleEn", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsTitleEt}</span>
            <input className="admin-field-input" value={form.titleEt} onChange={event => updateForm("titleEt", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsIconUrl}</span>
            <input className="admin-field-input" value={form.iconUrl} onChange={event => updateForm("iconUrl", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsRewardAmount}</span>
            <input className="admin-field-input" type="number" min="0" value={form.rewardAmount} onChange={event => updateForm("rewardAmount", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsCooldownSeconds}</span>
            <input className="admin-field-input" type="number" min="0" value={form.cooldownSeconds} onChange={event => updateForm("cooldownSeconds", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsRewardItemId}</span>
            <input className="admin-field-input" type="number" min="1" value={form.rewardItemId} onChange={event => updateForm("rewardItemId", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsItemChance}</span>
            <input className="admin-field-input" type="number" min="0" max="100" step="0.01" value={form.rewardItemChancePercent} onChange={event => updateForm("rewardItemChancePercent", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsRewardItemQuantity}</span>
            <input className="admin-field-input" type="number" min="1" value={form.rewardItemQuantity} onChange={event => updateForm("rewardItemQuantity", event.target.value)} />
          </label>
          <div className="admin-checkbox-wrap">
            <label className="admin-checkbox-label">
              <input type="checkbox" checked={form.enabled} onChange={event => updateForm("enabled", event.target.checked)} />
              <span>{t.adminJobsEnabled}</span>
            </label>
          </div>
        </div>

        <div className="admin-form-grid">
          <label>
            <span className="admin-field-label">{t.adminJobsDescriptionRu}</span>
            <textarea className="admin-field-input admin-textarea" value={form.descriptionRu} onChange={event => updateForm("descriptionRu", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsDescriptionEn}</span>
            <textarea className="admin-field-input admin-textarea" value={form.descriptionEn} onChange={event => updateForm("descriptionEn", event.target.value)} />
          </label>
          <label>
            <span className="admin-field-label">{t.adminJobsDescriptionEt}</span>
            <textarea className="admin-field-input admin-textarea" value={form.descriptionEt} onChange={event => updateForm("descriptionEt", event.target.value)} />
          </label>
        </div>

        <div className="admin-form-actions">
          <button className="pagination-btn" type="button" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? t.adminJobsSaving : editingJob ? t.adminJobsEdit : t.adminJobsCreate}
          </button>
        </div>
      </div>

      <div className="inventory-toolbar">
        <input
          className="admin-field-input admin-search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.adminJobsSearchPlaceholder}
        />
        <p className="inventory-counter">{filteredJobs.length}</p>
      </div>

      {feedback ? <p className="state-text">{feedback}</p> : null}
      {loading ? <p className="state-text">{t.adminJobsLoading}</p> : null}
      {!loading && error ? <p className="state-text state-error">{error}</p> : null}
      {!loading && !error && filteredJobs.length === 0 ? <p className="state-text state-empty">{t.adminJobsEmpty}</p> : null}

      {!loading && !error && filteredJobs.length > 0 ? (
        <div className="admin-list-grid">
          {filteredJobs.map(job => (
            <article className="admin-log-card" key={job.id}>
              <div className="admin-log-head">
                <p className="display-name">{job.titleRu}</p>
                <span className="meta-badge">#{job.id}</span>
              </div>
              <p className="market-card-hint mono">{job.jobKey}</p>
              <p className="state-text">{job.descriptionRu || job.descriptionEn || job.descriptionEt || "-"}</p>
              <div className="inventory-meta">
                <span className="meta-badge price">+{job.rewardAmount} ODM</span>
                <span className="meta-badge neutral">{job.cooldownSeconds}s</span>
                <span className={`meta-badge ${job.enabled ? "ok" : "danger"}`}>
                  {job.enabled ? t.adminJobsEnabled : t.adminJobsDisabledLabel}
                </span>
              </div>
              {job.rewardItemId !== null ? (
                <p className="market-card-hint">
                  {t.jobsItemChance}: {job.rewardItemChancePercent ?? 0}% • {job.rewardItemName || `#${job.rewardItemId}`} • x{job.rewardItemQuantity ?? 1}
                </p>
              ) : null}
              <div className="admin-form-actions">
                <button className="pagination-btn" type="button" onClick={() => setEditingJob(job)}>
                  {t.adminJobsEdit}
                </button>
                <button className="pagination-btn admin-danger-btn" type="button" onClick={() => setDisableTarget(job)}>
                  {t.adminJobsDisable}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(disableTarget)}
        title={t.adminJobsDisable}
        message={disableTarget ? `${t.adminJobsDisableConfirm} ${disableTarget.titleRu}` : ""}
        confirmLabel={t.adminJobsDisable}
        cancelLabel={t.adminJobsCancel}
        busy={disabling}
        onCancel={() => setDisableTarget(null)}
        onConfirm={() => {
          void handleDisableConfirm();
        }}
      />
    </div>
  );
}
