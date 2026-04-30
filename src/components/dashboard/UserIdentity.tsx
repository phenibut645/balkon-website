import { UserIdentityView } from "@/lib/types";
import { getInitials, getSafeAvatarSeed, getSafeDisplayName } from "@/lib/userIdentityPrivacy";

type UserIdentityProps = {
  user: UserIdentityView;
  size?: "sm" | "md" | "lg";
  showDiscordId?: boolean;
  showAvatar?: boolean;
  mode?: "normal" | "streamer";
  subtitle?: string;
  missingProfileLabel?: string;
};

export function UserIdentity({
  user,
  size = "md",
  showDiscordId = false,
  showAvatar = true,
  mode = "normal",
  subtitle,
  missingProfileLabel,
}: UserIdentityProps) {
  const streamerMode = mode === "streamer";
  const displayName = getSafeDisplayName(user, streamerMode);
  const initials = getInitials(displayName);
  const seed = getSafeAvatarSeed(user);
  const hue = seed % 360;
  const avatarStyle = {
    background: `linear-gradient(135deg, hsl(${hue}, 58%, 40%), hsl(${(hue + 42) % 360}, 62%, 33%))`,
  };

  const shouldShowImage = showAvatar && !streamerMode && Boolean(user.avatarUrl);
  const hasCachedIdentity = Boolean(user.globalName || user.username || user.avatarUrl);

  return (
    <div className={`user-identity ${size} ${streamerMode ? "streamer" : ""}`}>
      {showAvatar ? (
        <div className="user-identity-avatar" style={!shouldShowImage ? avatarStyle : undefined}>
          {shouldShowImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl || ""} alt={displayName} className="user-identity-avatar-img" />
          ) : (
            <span className="user-identity-avatar-fallback">{initials}</span>
          )}
        </div>
      ) : null}

      <div className="user-identity-meta">
        <p className="user-identity-name">{displayName}</p>
        {subtitle ? <p className="user-identity-subtitle">{subtitle}</p> : null}
        {!subtitle && !streamerMode && !hasCachedIdentity && missingProfileLabel ? (
          <p className="user-identity-subtitle">{missingProfileLabel}</p>
        ) : null}
        {showDiscordId ? <p className="user-identity-subtitle">ID: {user.discordId}</p> : null}
      </div>
    </div>
  );
}
