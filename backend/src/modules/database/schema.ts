export * from '../tenant/schemas/schema';
export * from '../user/schemas/schema';
export * from '../customer-management/schema/schema';
export * from '../carrier-management/schemas/schema';

import * as tenantSchema from '../tenant/schemas/schema';
import * as userSchema from '../user/schemas/schema';
import * as customerSchema from '../customer-management/schema/schema';
import * as carrierSchema from '../carrier-management/schemas/schema';

export const schema = {
  ...tenantSchema,
  ...userSchema,
  ...customerSchema,
  ...carrierSchema,
};

export type DatabaseSchema = typeof schema;
