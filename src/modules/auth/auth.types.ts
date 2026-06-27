declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        isRoot: boolean;
        orgId: string;
      };
    }
  }
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isRoot: boolean;
  orgId: string;
}


export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

export interface RefreshResponse {
  accessToken: string;
}
