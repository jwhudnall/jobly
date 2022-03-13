const { sqlForPartialUpdate } = require("./sql");

const data = { name: "ABC", description: "description", numEmployees: 3 };

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
