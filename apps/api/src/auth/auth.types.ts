export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface RequestWithUser {
  user?: PublicUser;
  headers: { authorization?: string };
  cookies?: { refresh_token?: string };
}
