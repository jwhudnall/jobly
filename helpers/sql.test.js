const { sqlForPartialUpdate, sqlForCompanyFilter } = require("./sql");

const data = { name: "ABC", description: "description", numEmployees: 3 };
const filteredSearch = {};

describe("Update data", () => {
  test("Updates with no key transformations", () => {
    const results = sqlForPartialUpdate(data, {});
    expect(results).toHaveProperty("setCols");
    expect(results).toHaveProperty("values");
    expect(results.setCols).toEqual(`"name"=$1, "description"=$2, "numEmployees"=$3`);
    expect(results.values).toEqual(["ABC", "description", 3]);
  });
  test("Updates with key transformations", () => {
    const results = sqlForPartialUpdate(data, { numEmployees: "num_employees" });
    expect(results).toHaveProperty("setCols");
    expect(results).toHaveProperty("values");
    expect(results.setCols).toEqual(`"name"=$1, "description"=$2, "num_employees"=$3`);
    expect(results.values).toEqual(["ABC", "description", 3]);
  });
  test("Throws error", () => {
    expect(() => {
      sqlForPartialUpdate({}, {});
    }).toThrow("No data"); //https://jestjs.io/docs/expect#tothrowerror
  });
});

describe("Filtered Company search", () => {
  test("Converts all 3 params", () => {
    const params = { name: "abc", minEmployees: 3, maxEmployees: 10 };
    result = sqlForCompanyFilter(params);
    expect(result).toHaveProperty("setCols");
    expect(result).toHaveProperty("values");
    expect(result.setCols.match(/AND/g).length).toBe(2);
    expect(result.values).toEqual(["abc", 3, 10]);
  });
  test("Converts search with 2 params", () => {
    const params = { minEmployees: 3, maxEmployees: 10 };
    result = sqlForCompanyFilter(params);
    expect(result).toHaveProperty("setCols");
    expect(result).toHaveProperty("values");
    expect(result.setCols.match(/AND/g).length).toBe(1);
    expect(result.values).toEqual([3, 10]);
  });
  test("Converts search with 1 params", () => {
    const params = { maxEmployees: 10 };
    result = sqlForCompanyFilter(params);
    expect(result).toHaveProperty("setCols");
    expect(result).toHaveProperty("values");
    expect(result.values).toEqual([10]);
    expect(() => {
      result.setCols.match(/AND/g).length;
    }).toThrowError(TypeError);
  });
});
