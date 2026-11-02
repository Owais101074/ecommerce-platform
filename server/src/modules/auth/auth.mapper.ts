import type { UserDocument } from './auth.model';
import type { AuthUser } from './auth.types';

export function toAuthUser(user: UserDocument): AuthUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
