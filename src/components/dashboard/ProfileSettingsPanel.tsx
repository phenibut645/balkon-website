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
  const charactersLeft = 500 - publicDescriptionDraft.length;

  return (
    <div className="panel panel-overview profile-settings-panel">
      <p className="display-name">{t.profileSettings}</p>

      {loading ? <p className="state-text">{t.checking}</p> : null}

      {profile ? (
        <div className="profile-form">
          <UserIdentity user={profile} size="lg" showDiscordId />

          <p className="user-id">{t.balance}: {t.odm} {profile.balance} / {t.ldm} {profile.ldmBalance}</p>

          <label className="market-card-label" htmlFor="homeGuildSelect">{t.homeGuild}</label>
          <select
            id="homeGuildSelect"
            className="profile-select"
            value={homeGuildIdDraft}
            onChange={event => onHomeGuildChange(event.target.value)}
          >
            <option value="">{t.notSelected}</option>
            {availableGuilds.map(guild => (
              <option key={guild.guildId} value={guild.guildId}>{guild.name}</option>
            ))}
          </select>

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
