"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");
const Job = require("../models/job");

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

/************************************** POST /users */

describe("POST /users", function () {
  test("works for admins: create non-admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: false
      })
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false
      },
      token: expect.any(String)
    });
  });

  test("works for admins: create admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: true
      })
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true
      },
      token: expect.any(String)
    });
  });

  test("unauth for users: create admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: true
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for users: create non-admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: false
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).post("/users").send({
      username: "u-new",
      firstName: "First-new",
      lastName: "Last-newL",
      password: "password-new",
      email: "new@email.com",
      isAdmin: true
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new"
      })
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "not-an-email",
        isAdmin: true
      })
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** POST /users/:username/jobs/:id */

describe("POST /users/:username/jobs/:id", function () {
  let testJob;

  beforeEach(async () => {
    const adminJobRes = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4AdminToken}`);
    testJob = adminJobRes.body.job;
  });

  test("works for current user", async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJob.id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(201);
  });

  test("works for admin", async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJob.id}`)
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toBe(201);
  });

  test("unauth for different user", async () => {
    const resp = await request(app)
      .post(`/users/u2/jobs/${testJob.id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(401);
  });

  test("404 error for invalid username", async () => {
    const resp = await request(app)
      .post(`/users/someone/jobs/${testJob.id}`)
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toBe(404);
  });

  test("404 error for invalid job_id", async () => {
    const resp = await request(app)
      .post(`/users/u2/jobs/0`)
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toBe(404);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admins", async function () {
    const resp = await request(app).get("/users").set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
          jobs: []
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
          jobs: []
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
          jobs: []
        },
        {
          username: "u4",
          firstName: "U4F",
          lastName: "U4L",
          email: "user4@user.com",
          isAdmin: true,
          jobs: []
        }
      ]
    });
  });

  test("unauth for user", async function () {
    const resp = await request(app).get("/users").set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app).get("/users").set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for same user", async function () {
    const resp = await request(app).get(`/users/u1`).set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false
      }
    });
  });

  test("works for admin", async function () {
    const resp = await request(app).get(`/users/u1`).set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false
      }
    });
  });

  test("unauth for different user", async function () {
    const resp = await request(app).get(`/users/u2`).set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if user not found", async function () {
    const resp = await request(app).get(`/users/nope`).set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for same user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New"
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false
      }
    });
  });

  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New"
      })
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false
      }
    });
  });

  test("unauth for different user", async function () {
    const resp = await request(app)
      .patch(`/users/u2`)
      .send({
        firstName: "New"
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/users/u1`).send({
      firstName: "New"
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if no such user", async function () {
    const resp = await request(app)
      .patch(`/users/nope`)
      .send({
        firstName: "Nope"
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 42
      })
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works for same user: set new password", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: "new-password"
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false
      }
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for same user", async function () {
    const resp = await request(app).delete(`/users/u1`).set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("unauth for different user", async function () {
    const resp = await request(app).delete(`/users/u2`).set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
      .delete(`/users/nope`)
      .set("authorization", `Bearer ${u4AdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
