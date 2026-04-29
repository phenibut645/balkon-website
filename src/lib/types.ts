export type ApiMeResponse = {
  ok: boolean;
  me?: {
    discordId: string;
    roles: string[];
    username?: string | null;
    globalName?: string | null;
    avatar?: string | null;
    avatarUrl?: string | null;
  };
  error?: string;
  message?: string;
};
