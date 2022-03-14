const { BadRequestError } = require("../expressError");

/**
 * Convert object keys into a single SQL variable string. Returns this string, along with
 * the specified values.
 * Optionally converts keys to match columns within the database.
 *
 * @param {*} dataToUpdate - Object of key:value pairs
 * @param {*} jsToSql  - Object of key:value pairs converting JS syntax to match cols found in the db.
 * @returns - Object {
 *              setCols: SQL-compatible variable string of columns to be updated.
 *              values: Array of values to be passed in alongside setCols string. }
 *
 * ex:  sqlForPartialUpdate( {firstName: 'Aliya', age: 32}, { firstName: "first_name" }) =>
 *        ['"first_name"=$1', '"age"=$2']
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  // Throws error if empty object is passed
  if (keys.length === 0) throw new BadRequestError("No data");

  const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`);

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate)
  };
}

/**
 * Translate company search filters into SQL-syntax
 *
 * @param {*} dataToUpdate - Object of key:value pairs by which the query should be filtered.
 * @returns - Object {
 *              setCols: SQL-compatible variable string of columns to be filtered
 *              values: Array of values relating to the 'setCols' string. }
 */

function sqlForCompanyFilter(dataToUpdate) {
  const colKeys = {
    name: "lower(name) LIKE lower('%' || $1 || '%')",
    minEmployees: `"num_employees" >=$*`,
    maxEmployees: `"num_employees" <=$*`
  };
  const keys = Object.keys(dataToUpdate);
  const cols = keys.map((colName, idx) => {
    return `${colKeys[colName]}`.replace("*", idx + 1);
  });

  return {
    setCols: cols.join(" AND "),
    values: Object.values(dataToUpdate)
  };
}

module.exports = { sqlForPartialUpdate, sqlForCompanyFilter };
