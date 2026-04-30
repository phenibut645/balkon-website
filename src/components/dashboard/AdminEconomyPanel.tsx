"use client";

import { FormEvent, useMemo, useState } from "react";
import { adminAdjustEconomy } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { AdminEconomyAdjustInput, AdminEconomyAdjustResult, AdminEconomyCurrency } from "@/lib/types";

type AdminEconomyPanelProps = {
  t: DashboardText;
  onAdjusted?: (result: AdminEconomyAdjustResult, input: AdminEconomyAdjustInput) => Promise<void> | void;
};

const PRESETS = [10, 50, 100, 500, -10, -50];

export function AdminEconomyPanel({ t, onAdjusted }: AdminEconomyPanelProps) {
  const [targetDiscordId, setTargetDiscordId] = useState("");
  const [currency, setCurrency] = useState<AdminEconomyCurrency>("ODM");
  const [amountInput, setAmountInput] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminEconomyAdjustResult | null>(null);

  const parsedAmount = Number(amountInput);
  const isPositiveAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const isNegativeAmount = Number.isFinite(parsedAmount) && parsedAmount < 0;
  const currencyOptions = useMemo(() => (["ODM", "LDM"] as const), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    const normalizedTargetDiscordId = targetDiscordId.trim();
    const normalizedReason = reason.trim();
    const amount = Number(amountInput);

    if (!/^\d{1,32}$/.test(normalizedTargetDiscordId)) {
      setError(t.balanceAdjustFailed);
      return;
    }

    if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 1_000_000) {
      setError(t.balanceAdjustFailed);
      return;
    }

    if (normalizedReason.length < 3 || normalizedReason.length > 300) {
      setError(t.balanceAdjustFailed);
      return;
    }

    const input: AdminEconomyAdjustInput = {
      targetDiscordId: normalizedTargetDiscordId,
      currency,
      amount,
      reason: normalizedReason,
    };

    setSubmitting(true);
    const response = await adminAdjustEconomy(input);
    setSubmitting(false);

    if (!response.ok || !response.data) {
      setError(response.message || response.error || t.balanceAdjustFailed);
      return;
    }

    setResult(response.data);
    setFeedback(t.balanceAdjusted);
    if (onAdjusted) {
      await onAdjusted(response.data, input);
    }
  }

  return (
    <div className="panel panel-overview admin-items-panel admin-economy-panel">
      <h2 className="section-title">{t.adminEconomyTitle}</h2>
      <p className="market-card-hint">{t.adminEconomyDescription}</p>
      <p className="state-text admin-economy-audit">{t.economyAuditNotice}</p>

      <form className="admin-item-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <div>
            <label className="admin-field-label" htmlFor="adminEconomyTargetDiscordId">{t.targetDiscordId}</label>
            <input
              id="adminEconomyTargetDiscordId"
              className="admin-field-input"
              placeholder={t.targetDiscordId}
              value={targetDiscordId}
              onChange={event => setTargetDiscordId(event.target.value)}
            />
          </div>

          <div>
            <p className="admin-field-label">{t.currency}</p>
            <div className="inventory-filters">
              {currencyOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`inventory-filter-chip ${currency === option ? "active" : ""}`}
                  onClick={() => setCurrency(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-form-grid">
          <div>
            <label className="admin-field-label" htmlFor="adminEconomyAmount">{t.amount}</label>
            <input
              id="adminEconomyAmount"
              className={`admin-field-input admin-economy-amount ${isPositiveAmount ? "positive" : isNegativeAmount ? "negative" : ""}`}
              value={amountInput}
              onChange={event => setAmountInput(event.target.value)}
              inputMode="numeric"
              placeholder="500 / -50"
            />
            <p className={`market-card-hint ${isPositiveAmount ? "admin-economy-hint-positive" : isNegativeAmount ? "admin-economy-hint-negative" : ""}`}>
              {isNegativeAmount ? t.negativeAmountHint : t.positiveAmountHint}
            </p>
          </div>

          <div>
            <label className="admin-field-label">{t.quickPresets}</label>
            <div className="inventory-filters admin-economy-presets">
              {PRESETS.map(value => (
                <button
                  key={value}
                  type="button"
                  className={`inventory-filter-chip ${value > 0 ? "admin-economy-preset-positive" : "admin-economy-preset-negative"}`}
                  onClick={() => setAmountInput(String(value))}
                >
                  {value > 0 ? `+${value}` : value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="admin-field-label" htmlFor="adminEconomyReason">{t.adminEconomyReason}</label>
          <textarea
            id="adminEconomyReason"
            className="admin-field-input admin-textarea"
            value={reason}
            maxLength={300}
            onChange={event => setReason(event.target.value)}
          />
          <p className="market-card-hint">{reason.trim().length}/300</p>
        </div>

        {error ? <p className="state-text state-error">{error}</p> : null}
        {feedback ? <p className="state-text state-ok">{feedback}</p> : null}

        <button className="pagination-btn" type="submit" disabled={submitting}>
          {submitting ? t.adjustingBalance : t.adjustBalance}
        </button>
      </form>

      {result ? (
        <div className="admin-item-form admin-economy-result-card">
          <p className="market-card-label">{t.balanceAdjusted}</p>
          <div className="botshop-meta">
            <span className="meta-badge">{result.targetDiscordId}</span>
            <span className={`meta-badge ${result.amount > 0 ? "ok" : "muted"}`}>{result.amount > 0 ? "+" : ""}{result.amount} {result.currency}</span>
            <span className="meta-badge price">{t.balanceAfter}: {result.balanceAfter}</span>
          </div>
          <p className="market-card-hint">{result.reason}</p>
        </div>
      ) : null}
    </div>
  );
}