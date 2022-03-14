const jsonschema = require("jsonschema");
const validator = new jsonschema.Validator();

function preValidateProperty(object, key, schema, options, ctx) {
  var value = object[key];
  if (typeof value === "undefined") return;

  // Test if the schema declares a type, but the type keyword fails validation
  if (
    schema.type &&
    validator.attributes.type.call(validator, value, schema, options, ctx.makeChild(schema, key))
  ) {
    // If the type is "number" but the instance is not a number, cast it
    if (schema.type === "number" && typeof value !== "number") {
      object[key] = parseFloat(value);
      return;
    }
  }
}

module.exports = { preValidateProperty };
