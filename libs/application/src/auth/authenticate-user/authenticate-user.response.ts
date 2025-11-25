/**
 * DTO de response para autenticar un usuario
 */
export class AuthenticateUserResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    roles: string[];
  };

  constructor(token: string, user: { id: number; email: string; name: string; roles: string[] }) {
    this.token = token;
    this.user = user;
  }
}
