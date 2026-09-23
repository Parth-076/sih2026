export const ROLES = ["INSPECTOR", "OFFICER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export interface JwtPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

// Augment Express's Request type so `req.user` is typed everywhere after
// the `authenticate` middleware runs.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
