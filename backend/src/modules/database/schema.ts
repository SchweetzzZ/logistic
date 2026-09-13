export * from '../tenant/schemas/schema';
export * from '../user/schemas/schema';

import * as tenantSchema from '../tenant/schemas/schema';
import * as userSchema from '../user/schemas/schema';

export const schema = {
  ...tenantSchema,
  ...userSchema,
};

export type DatabaseSchema = typeof schema;
