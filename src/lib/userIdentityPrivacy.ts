import { UserIdentityView } from "./types";

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getSafeAvatarSeed(user: UserIdentityView): number {
  return hashString(user.discordId) % 10000;
}

export function getSafeDisplayName(user: UserIdentityView, streamerMode: boolean): string {
  if (!streamerMode) {
    return user.globalName || user.username || user.discordId;
  }

  const suffix = String(getSafeAvatarSeed(user)).padStart(4, "0").slice(-4);
  return `Viewer #${suffix}`;
}

export function getInitials(value: string): string {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "U";
  }

  return parts.map(part => part[0]!.toUpperCase()).join("");
}
