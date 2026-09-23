import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../access-control/permissions';

export const REQUIRE_PERMISSIONS_KEY = 'require_permissions';

export const RequirePermission = (...permissions: PermissionKey[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
