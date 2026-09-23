import { User } from './schemas/schema';
import { UserResponseDto } from './dto/user.dto';

export const toSafeUser = ({ passwordHash, refreshTokenHash, ...user }: User): UserResponseDto => ({
  ...user, authProvider: user.authProvider ?? 'LOCAL',
});
