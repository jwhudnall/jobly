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
    console.log(resp.body);
    expect(resp.body.jobs.length).toBe(2);
  });
});
