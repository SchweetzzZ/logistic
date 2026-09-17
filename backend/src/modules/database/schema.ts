export * from '../tenant/schemas/schema';
export * from '../user/schemas/schema';
export * from '../customer-management/schema/schema';
export * from '../carrier-management/schemas/schema';
export * from '../freight/schemas/schema';
export * from '../audit/schemas/schema';

import * as tenantSchema from '../tenant/schemas/schema';
import * as userSchema from '../user/schemas/schema';
import * as customerSchema from '../customer-management/schema/schema';
import * as carrierSchema from '../carrier-management/schemas/schema';
import * as freightSchema from '../freight/schemas/schema';
import * as auditSchema from '../audit/schemas/schema';

export const schema = {
  ...tenantSchema,
  ...userSchema,
  ...customerSchema,
  ...carrierSchema,
  ...freightSchema,
  ...auditSchema,
};

export type DatabaseSchema = typeof schema;

