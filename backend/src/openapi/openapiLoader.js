const path = require('path');
const $RefParser = require("@apidevtools/json-schema-ref-parser");

let cachedSpec = null;

async function loadOpenApiSpec() {
  if (cachedSpec) return cachedSpec;

  const specPath = path.join(__dirname, '..', '..', 'openapi', 'openapi.yaml');

  try {
    // .dereference() reads the file, parses YAML/JSON, and resolves all $refs
    cachedSpec = await $RefParser.dereference(specPath);
    return cachedSpec;
  } catch (err) {
    console.error("Could not resolve OpenAPI spec:", err);
    throw err;
  }
}

/**
 * Read a resolved components.schemas entry. The spec must already be loaded
 * (see loadOpenApiSpec); handlers read schemas at require time, so they cannot await.
 */
function getComponentSchema(name) {
  if (!cachedSpec) {
    throw new Error(
      'OpenAPI spec not loaded: call await loadOpenApiSpec() before requiring modules that use getComponentSchema()',
    );
  }
  const schema = cachedSpec?.components?.schemas?.[name];
  if (!schema) {
    throw new Error(`OpenAPI schema not found: components.schemas.${name}`);
  }
  return schema;
}

module.exports = {
  loadOpenApiSpec,
  getComponentSchema,
};

