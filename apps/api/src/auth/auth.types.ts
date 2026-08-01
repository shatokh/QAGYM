import type { UserRole } from "../generated/prisma/enums";

export interface AuthUserDto {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface AuthUserResponse {
  data: {
    user: AuthUserDto;
  };
}

export interface LoginResult {
  user: AuthUserDto;
  sessionToken: string;
  maxAgeSeconds: number;
}
