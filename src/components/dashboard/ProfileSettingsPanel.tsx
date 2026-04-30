import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { AvailableGuild, UserPublicProfile } from "@/lib/types";
import { UserIdentity } from "./UserIdentity";

type ProfileSettingsPanelProps = {
  t: DashboardText;
  profile: UserPublicProfile | null;
  availableGuilds: AvailableGuild[];
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  feedback: string | null;
  homeGuildIdDraft: string;
  publicDescriptionDraft: string;
  onHomeGuildChange: (next: string) => void;
  onDescriptionChange: (next: string) => void;
  onSave: () => void;
  onReset: () => void;
};

export function ProfileSettingsPanel({
  t,
  profile,
  availableGuilds,
  loading,
  saveLoading,
  error,
  feedback,
  homeGuildIdDraft,
  publicDescriptionDraft,
  onHomeGuildChange,
  onDescriptionChange,
  onSave,
  onReset,
}: ProfileSettingsPanelProps) {
  const [guildMenuOpen, setGuildMenuOpen] = useState(false);
  const guildMenuRef = useRef<HTMLDivElement>(null);
  const charactersLeft = 500 - publicDescriptionDraft.length;
  const selectedGuild = useMemo(
    () => availableGuilds.find(guild => guild.guildId === homeGuildIdDraft) || null,
    [availableGuilds, homeGuildIdDraft],
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      if (!guildMenuOpen) {
        return;
      }

      const container = guildMenuRef.current;
      if (container && !container.contains(event.target as Node)) {
        setGuildMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setGuildMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [guildMenuOpen]);

  return (
    <div className="panel panel-overview profile-settings-panel">
      <p className="display-name">{t.profileSettings}</p>

      {loading ? <p className="state-text">{t.checking}</p> : null}

      {profile ? (
        <div className="profile-form">
          <UserIdentity user={profile} size="lg" showDiscordId />

          <p className="user-id">{t.balance}: {t.odm} {profile.balance} / {t.ldm} {profile.ldmBalance}</p>

          <p className="market-card-label">{t.homeGuild}</p>
          <div className="guild-select" ref={guildMenuRef}>
            <button
              id="homeGuildSelect"
              type="button"
              className="guild-select-button"
              aria-haspopup="listbox"
              aria-expanded={guildMenuOpen}
              aria-label={t.selectHomeGuild}
              onClick={() => setGuildMenuOpen(prev => !prev)}
            >
              <span className="guild-select-icon" aria-hidden="true">
                {selectedGuild?.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedGuild.iconUrl} alt="" />
                ) : (
                  <span>{(selectedGuild?.name || t.guildNotSelected).slice(0, 2).toUpperCase()}</span>
                )}
              </span>
              <span className="guild-select-name">{selectedGuild?.name || t.guildNotSelected}</span>
              <span className="guild-select-id">{selectedGuild?.guildId || t.selectHomeGuild}</span>
            </button>

            {guildMenuOpen ? (
              <div className="guild-select-menu" role="listbox" aria-label={t.selectHomeGuild}>
                <button
                  type="button"
                  className={`guild-select-option ${homeGuildIdDraft ? "" : "active"}`}
                  role="option"
                  aria-selected={!homeGuildIdDraft}
                  onClick={() => {
                    onHomeGuildChange("");
                    setGuildMenuOpen(false);
                  }}
                >
                  <span className="guild-select-icon" aria-hidden="true"><span>--</span></span>
                  <span className="guild-select-name">{t.guildNotSelected}</span>
                  <span className="guild-select-id">{t.notSelected}</span>
                </button>

                {availableGuilds.map(guild => (
                  <button
                    key={guild.guildId}
                    type="button"
                    className={`guild-select-option ${homeGuildIdDraft === guild.guildId ? "active" : ""}`}
                    role="option"
                    aria-selected={homeGuildIdDraft === guild.guildId}
                    onClick={() => {
                      onHomeGuildChange(guild.guildId);
                      setGuildMenuOpen(false);
                    }}
                  >
                    <span className="guild-select-icon" aria-hidden="true">
                      {guild.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={guild.iconUrl} alt="" />
                      ) : (
                        <span>{guild.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </span>
                    <span className="guild-select-name">{guild.name}</span>
                    <span className="guild-select-id">{guild.guildId}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <label className="market-card-label" htmlFor="publicDescriptionInput">{t.publicDescription}</label>
          <textarea
            id="publicDescriptionInput"
            className="profile-description-input"
            value={publicDescriptionDraft}
            onChange={event => onDescriptionChange(event.target.value.slice(0, 500))}
            maxLength={500}
            placeholder={t.publicDescriptionPlaceholder}
          />

          <div className="profile-form-footer">
            <p className="market-card-hint">{t.publicDescriptionPublicWarning}</p>
            <p className="market-card-hint">{t.charactersLeft}: {charactersLeft}</p>
          </div>

          {error ? <p className="state-text state-error">{error}</p> : null}
          {feedback ? <p className="state-text state-ok">{feedback}</p> : null}

          <div className="profile-form-actions">
            <button className="pagination-btn" onClick={onSave} disabled={saveLoading}>
              {saveLoading ? `${t.saveProfile}...` : t.saveProfile}
            </button>
            <button className="pagination-btn ghost" onClick={onReset} disabled={saveLoading}>{t.close}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
