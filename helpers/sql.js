const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
// Accepts:
//  - dataToUpdate: Object of information
//  - jsToSql: Object of permissable columns eligible to be updated

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  // Throws error if empty object is passed
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) =>
      // Maps each key to either the specified change, or the original
      // if 2nd argument is undefined, defaults to the key name from data
      `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate)
  };
}

module.exports = { sqlForPartialUpdate };
