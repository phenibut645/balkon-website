import { DashboardText, LanguageCode, formatDashboardDate } from "@/lib/dashboardText";
import { JobView } from "@/lib/types";

type JobCooldownInfo = {
  remainingSeconds?: number;
  nextAvailableAt?: string;
};

type JobsPanelProps = {
  t: DashboardText;
  language: LanguageCode;
  dateLocale: string;
  jobs: JobView[];
  loading: boolean;
  error: string | null;
  runningJobId: number | null;
  jobFeedbackById: Record<number, string>;
  jobErrorById: Record<number, string>;
  jobCooldownInfoById: Record<number, JobCooldownInfo>;
  onRun: (jobId: number) => void;
  onRefresh: () => void;
};

function pickLocalizedValue(language: LanguageCode, ru: string | null, en: string | null, et: string | null): string | null {
  if (language === "en") {
    return en || ru || et || null;
  }

  if (language === "et") {
    return et || ru || en || null;
  }

  return ru || en || et || null;
}

function formatCooldown(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (!remainingSeconds) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function JobsPanel({
  t,
  language,
  dateLocale,
  jobs,
  loading,
  error,
  runningJobId,
  jobFeedbackById,
  jobErrorById,
  jobCooldownInfoById,
  onRun,
  onRefresh,
}: JobsPanelProps) {
  return (
    <div className="panel panel-craft jobs-panel">
      <div className="craft-scroll jobs-scroll">
        <div className="inventory-toolbar compact">
          <div className="jobs-head-copy">
            <h2 className="section-title">{t.tabJobs}</h2>
            <p className="market-card-hint">{t.jobsClickClack}</p>
          </div>
          <button className="pagination-btn" type="button" onClick={onRefresh}>
            {t.jobsRefresh}
          </button>
        </div>

        {loading ? <p className="state-text">{t.jobsLoading}</p> : null}
        {!loading && error ? <p className="state-text state-error">{error}</p> : null}
        {!loading && !error && jobs.length === 0 ? <p className="state-text state-empty">{t.jobsEmpty}</p> : null}

        {!loading && !error && jobs.length > 0 ? (
          <div className="craft-grid jobs-grid">
            {jobs.map(job => {
              const title = pickLocalizedValue(language, job.titleRu, job.titleEn, job.titleEt) || job.titleRu;
              const description = pickLocalizedValue(language, job.descriptionRu, job.descriptionEn, job.descriptionEt);
              const cooldownInfo = jobCooldownInfoById[job.id];
              const remainingCooldownSeconds = cooldownInfo?.remainingSeconds;
              const isCoolingDown = typeof remainingCooldownSeconds === "number" && remainingCooldownSeconds > 0;
              const isBusy = runningJobId === job.id || isCoolingDown;

              return (
                <article className="craft-card jobs-card" key={job.id}>
                  <div className="jobs-card-head">
                    <div className="jobs-icon-wrap" aria-hidden="true">
                      {job.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={job.iconUrl} alt="" className="jobs-icon" />
                      ) : (
                        <span className="jobs-icon-fallback">⚒️</span>
                      )}
                    </div>
                    <div className="jobs-card-copy">
                      <h3 className="craft-title">{title}</h3>
                      <div className="jobs-chip-row">
                        <span className="inventory-filter-chip active">{t.jobsClickClack}</span>
                        <span className="meta-badge price">+{job.rewardAmount} ODM</span>
                      </div>
                    </div>
                  </div>

                  <p className="craft-description jobs-description">{description || "-"}</p>

                  <div className="jobs-meta-grid">
                    <div className="jobs-meta-card">
                      <p className="craft-label">{t.jobsReward}</p>
                      <p className="jobs-meta-value">+{job.rewardAmount} ODM</p>
                    </div>
                    <div className="jobs-meta-card">
                      <p className="craft-label">{t.jobsCooldown}</p>
                      <p className="jobs-meta-value">{formatCooldown(job.cooldownSeconds)}</p>
                    </div>
                  </div>

                  {job.rewardItemId !== null && job.rewardItemChancePercent !== null ? (
                    <div className="jobs-reward-drop">
                      <p className="craft-label">{t.jobsItemChance}</p>
                      <p className="market-card-hint">
                        {job.rewardItemEmoji ? `${job.rewardItemEmoji} ` : ""}
                        {job.rewardItemName || `#${job.rewardItemId}`} • {job.rewardItemChancePercent}% • x{job.rewardItemQuantity ?? 1}
                      </p>
                    </div>
                  ) : null}

                  {jobFeedbackById[job.id] ? <p className="state-text state-ok">{jobFeedbackById[job.id]}</p> : null}
                  {jobErrorById[job.id] ? <p className="state-text state-error">{jobErrorById[job.id]}</p> : null}

                  {cooldownInfo?.remainingSeconds !== undefined ? (
                    <p className="market-card-hint">
                      {t.jobsCooldown}: {formatCooldown(cooldownInfo.remainingSeconds)}
                    </p>
                  ) : null}

                  {cooldownInfo?.nextAvailableAt ? (
                    <p className="market-card-hint">
                      {t.jobsNextAvailable}: {formatDashboardDate(cooldownInfo.nextAvailableAt, dateLocale, "-")}
                    </p>
                  ) : null}

                  <button
                    className="pagination-btn"
                    type="button"
                    onClick={() => onRun(job.id)}
                    disabled={isBusy}
                  >
                    {runningJobId === job.id
                      ? t.jobsWorking
                      : isCoolingDown && remainingCooldownSeconds !== undefined
                        ? `${t.jobsWorkButton} (${formatCooldown(remainingCooldownSeconds)})`
                        : t.jobsWorkButton}
                  </button>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
