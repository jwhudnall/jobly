"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4AdminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const newJob = {
  title: "New Job!",
  salary: 95000,
  equity: 0.02,
  companyHandle: "c1"
};

/************************************** POST /jobs */

describe("POST /jobs", function () {
  test("Results in unauthorized for users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(401);
  });

  test("success for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toBe(201);
  });
});

test("bad request with missing data", async function () {
  const resp = await request(app)
    .post("/jobs")
    .send({
      title: "New Job!",
      salary: 95000,
      equity: 0.02
    })
    .set("authorization", `Bearer ${u4AdminToken}`);
  expect(resp.statusCode).toEqual(400);
});

test("bad request with invalid data", async function () {
  const resp = await request(app)
    .post("/jobs")
    .send({
      title: "New Job!",
      salary: 95000,
      equity: "lots of it",
      companyHandle: "c1"
    })
    .set("authorization", `Bearer ${u4AdminToken}`);
  expect(resp.statusCode).toEqual(400);
});

test("bad request with invalid handle", async function () {
  const resp = await request(app)
    .post("/jobs")
    .send({
      title: "New Job!",
      salary: 95000,
      equity: 0.02,
      companyHandle: "does not exist"
    })
    .set("authorization", `Bearer ${u4AdminToken}`);
  expect(resp.statusCode).toEqual(404);
});

/************************************** GET /jobs (no query params) */

describe("GET /jobs - no params", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body.jobs.length).toBe(2);
    expect(resp.body.jobs).toEqual(
      expect.arrayContaining([
        {
          id: expect.any(Number),
          title: "Jr. Programmer",
          salary: 80000,
          equity: "0",
          companyHandle: "c2"
        },
        {
          id: expect.any(Number),
          title: "Sr. Programmer",
          salary: 120000,
          equity: "0.01",
          companyHandle: "c1"
        }
      ])
    );
  });

  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app).get("/jobs").set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs (with query params) */

describe("GET /jobs - with params", function () {
  test("Filters jobs by 3 params (hasEquity=true)", async () => {
    const query = { title: "program", minSalary: 90000, hasEquity: true };
    const resp = await request(app).get("/jobs").query(query);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.jobs.length).toBe(1);
  });

  test("Filters jobs by 3 params (hasEquity=false)", async () => {
    const query = { title: "program", minSalary: 90000, hasEquity: false };
    const resp = await request(app).get("/jobs").query(query);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.jobs.length).toBe(1);
  });

  test("Filters jobs by 2 params", async () => {
    const query = { title: "program", minSalary: 80000 };
    const resp = await request(app).get("/jobs").query(query);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.jobs.length).toBe(2);
  });

  test("Filters jobs by 1 param", async () => {
    const query = { minSalary: 80001 };
    const resp = await request(app).get("/jobs").query(query);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.jobs.length).toBe(1);
  });

  test("Invalid data type throws error", async () => {
    const query = { title: "program", minSalary: "Lots!", hasEquity: true };
    const resp = await request(app).get("/jobs").query(query);
    expect(resp.statusCode).toBe(400);
    expect(resp.body).toHaveProperty("error");
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  let id;
  test("works for anon", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4AdminToken}`);
    id = resp.body.job.id;
    const jobRes = await request(app).get(`/jobs/${id}`);
    expect(jobRes.statusCode).toBe(200);
    expect(jobRes.body.job).toHaveProperty("id", expect.any(Number));
    expect(jobRes.body.job).toHaveProperty("title", newJob.title);
    expect(jobRes.body.job).toHaveProperty("salary", newJob.salary);
    expect(jobRes.body.job).toHaveProperty("equity", newJob.equity.toString()); // PG casts NUMERIC => string
    expect(jobRes.body.job).toHaveProperty("companyHandle", newJob.companyHandle);
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /companies/:handle", function () {
  let testJob;

  beforeEach(async () => {
    const adminJobRes = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4AdminToken}`);
    testJob = adminJobRes.body.job;
  });

  test("works for admins", async function () {
    console.log(`testJob info: ${JSON.stringify(testJob)}`);
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        title: "New-Job-Title"
      })
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      job: {
        id: testJob.id,
        title: "New-Job-Title",
        salary: testJob.salary,
        equity: testJob.equity,
        companyHandle: testJob.companyHandle
      }
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        name: "New-Job-Title"
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/${testJob.id}`).send({
      name: "New-Job-Title"
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "New-Job-Title"
      })
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toBe(404);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        companyHandle: "New-handle"
      })
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request for invalid data type", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJob.id}`)
      .send({
        companyHandle: 3114
      })
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message[0]).toMatch("not allowed");
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  let testJob;

  beforeEach(async () => {
    const adminJobRes = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4AdminToken}`);
    testJob = adminJobRes.body.job;
  });

  test("works for admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testJob.id}`)
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(200);
  });

  test("unauth for users", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testJob.id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/${testJob.id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/i-dont-exist`)
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
