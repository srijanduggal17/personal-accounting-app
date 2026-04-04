const { getComponentSchema } = require('../openapi/openapiLoader');

const accountUpdateSchema = getComponentSchema('AccountUpdateRequest');


// Shared constants for account handlers/queries to keep update rules consistent.
const UPDATEABLE_COLUMNS = new Set(Object.keys(accountUpdateSchema?.properties ?? {}));

module.exports = {
  UPDATEABLE_COLUMNS,
};
