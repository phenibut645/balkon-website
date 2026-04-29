"use client";

import { useEffect, useMemo, useState } from "react";
import { getDiscordLoginUrl, getMe, logout } from "@/lib/api";
import { ApiMeResponse } from "@/lib/types";

type AuthState = "loading" | "guest" | "user";

export default function HomePage() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [meResponse, setMeResponse] = useState<ApiMeResponse | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const user = meResponse?.me;
  const roles = useMemo(() => user?.roles ?? [], [user?.roles]);

  async function refreshMe(): Promise<void> {
    setAuthState("loading");
    setAvatarFailed(false);
    const me = await getMe();
    setMeResponse(me);
    setAuthState(me.ok && me.me ? "user" : "guest");
  }

  useEffect(() => {
    void refreshMe();
  }, []);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);
    await logout();
    await refreshMe();
    setIsLoggingOut(false);
  }

  function handleLogin(): void {
    window.location.href = getDiscordLoginUrl();
  }

  const avatarUrl = user?.avatarUrl ?? null;
  const displayName = user?.globalName || user?.username || user?.discordId || "Unknown user";

  return (
    <main className="page-root">
      <section className="card">
        {authState === "loading" && (
          <div className="loading">Checking session...</div>
        )}

        {authState === "guest" && (
          <>
            <h1 className="title">Balkon</h1>
            <p className="subtitle">Discord bot dashboard for economy, streamers and OBS control.</p>
            <button className="discord-button" onClick={handleLogin}>
              Login with Discord
            </button>
          </>
        )}

        {authState === "user" && user && (
          <>
            <h1 className="title">Welcome to Balkon</h1>
            <div className="user-row">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Discord avatar"
                  className="avatar"
                  onError={() => setAvatarFailed(true)}
                  style={{ display: avatarFailed ? "none" : "block" }}
                />
              ) : (
                <div className="avatar placeholder" aria-hidden="true" />
              )}
              {avatarUrl && avatarFailed ? (
                <div className="avatar placeholder" aria-hidden="true" />
              ) : null}
              <div>
                <p className="display-name">{displayName}</p>
                <p className="user-id">Discord ID: {user.discordId}</p>
                {roles.length > 0 ? (
                  <div className="badges">
                    {roles.map(role => (
                      <span className="badge" key={role}>{role}</span>
                    ))}
                  </div>
                ) : (
                  <p className="no-roles">No roles assigned</p>
                )}
              </div>
            </div>

            <button className="logout-button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
