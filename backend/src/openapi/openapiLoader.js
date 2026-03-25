const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

let cachedSpec;

function loadOpenApiSpec() {
  if (cachedSpec) return cachedSpec;

  const specPath = path.join(__dirname, '..', '..', 'openapi', 'openapi.yaml');
  const raw = fs.readFileSync(specPath, 'utf8');
  cachedSpec = yaml.load(raw);
  return cachedSpec;
}

function getComponentSchema(name) {
  const spec = loadOpenApiSpec();
  const schema = spec?.components?.schemas?.[name];
  if (!schema) {
    throw new Error(`OpenAPI schema not found: components.schemas.${name}`);
  }
  return schema;
}

module.exports = {
  loadOpenApiSpec,
  getComponentSchema,
};

