import type { RefObject } from "react";
import { DashboardText, LanguageCode } from "@/lib/dashboardText";

type DashboardMode = "user" | "admin";
type DashboardTab = "overview" | "inventory" | "market" | "profile" | "adminDashboard" | "adminServers" | "adminLogs" | "adminObs" | "adminItems";

type ProfileDropdownProps = {
  profileMenuRef: RefObject<HTMLDivElement>;
  profileMenuOpen: boolean;
  avatarUrl: string | null;
  avatarFailed: boolean;
  onAvatarError: () => void;
  displayName: string;
  discordId: string;
  t: DashboardText;
  onToggleMenu: () => void;
  onProfileTabOpen: () => void;
  canUseAdminMode: boolean;
  dashboardMode: DashboardMode;
  onDashboardModeChange: (mode: DashboardMode) => void;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
};

export function ProfileDropdown({
  profileMenuRef,
  profileMenuOpen,
  avatarUrl,
  avatarFailed,
  onAvatarError,
  displayName,
  discordId,
  t,
  onToggleMenu,
  onProfileTabOpen,
  canUseAdminMode,
  dashboardMode,
  onDashboardModeChange,
  language,
  onLanguageChange,
  onLogout,
  isLoggingOut,
}: ProfileDropdownProps) {
  return (
    <div className="profile-menu-container" ref={profileMenuRef}>
      <button className="profile-icon-button" onClick={onToggleMenu}>
        {avatarUrl && !avatarFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Profile"
            className="header-avatar"
            onError={onAvatarError}
          />
        ) : (
          <div className="header-avatar placeholder" aria-hidden="true" />
        )}
      </button>

      {profileMenuOpen ? (
        <div className="profile-dropdown">
          <p className="dropdown-name">{displayName}</p>
          <p className="dropdown-id">{t.discordId}: {discordId}</p>

          <button className="dropdown-action" onClick={onProfileTabOpen}>
            {t.profile}
          </button>

          {canUseAdminMode ? (
            <div className="mode-switch-block">
              <p className="language-title">{t.adminMode}</p>
              <div className="mode-switch-buttons">
                <button
                  className={`lang-btn ${dashboardMode === "user" ? "active" : ""}`}
                  onClick={() => onDashboardModeChange("user")}
                >
                  {t.adminModeUser}
                </button>
                <button
                  className={`lang-btn ${dashboardMode === "admin" ? "active" : ""}`}
                  onClick={() => onDashboardModeChange("admin")}
                >
                  {t.adminModeAdmin}
                </button>
              </div>
            </div>
          ) : null}

          <div className="language-block">
            <p className="language-title">{t.languages}</p>
            <div className="language-buttons">
              <button className={`lang-btn ${language === "ru" ? "active" : ""}`} onClick={() => onLanguageChange("ru")}>RU</button>
              <button className={`lang-btn ${language === "en" ? "active" : ""}`} onClick={() => onLanguageChange("en")}>ENG</button>
              <button className={`lang-btn ${language === "et" ? "active" : ""}`} onClick={() => onLanguageChange("et")}>EST</button>
            </div>
          </div>

          <button className="dropdown-action danger" onClick={onLogout}>
            {isLoggingOut ? `${t.logout}...` : t.logout}
          </button>
        </div>
      ) : null}
    </div>
  );
}
