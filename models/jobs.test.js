"use strict";
const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const { update } = require("./job");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New",
    salary: 75000,
    equity: 0.01,
    company_handle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New",
      salary: 75000,
      equity: "0.01",
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [job.id]
    );
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "New",
        salary: 75000,
        equity: "0.01",
        companyHandle: "c1"
      }
    ]);
  });
});

/************************************** findAll */

describe("create", function () {
  test("works", async () => {
    let jobs = await Job.findAll();
    expect(jobs.length).toEqual(2);
    await Job.create({
      title: "New",
      salary: 75000,
      equity: "0.01",
      company_handle: "c1"
    });
    jobs = await Job.findAll();
    expect(jobs.length).toEqual(3);
  });
});

/************************************** get */

describe("get", function () {
  let newJob;
  beforeEach(async () => {
    await db.query("DELETE FROM jobs");
    newJob = await Job.create({
      title: "New",
      salary: 75000,
      equity: "0.01",
      company_handle: "c1"
    });
  });

  test("gets job that exists", async () => {
    const job = await Job.get(newJob.id);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New",
      salary: 75000,
      equity: "0.01",
      companyHandle: "c1"
    });
  });
  test("Throws error with invalid id", async () => {
    try {
      await Job.get(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  let newJob;
  const updateData = {
    title: "Level II Developer",
    salary: 81500,
    equity: "0.02"
  };

  beforeEach(async () => {
    await db.query("DELETE FROM jobs");
    newJob = await Job.create({
      title: "New",
      salary: 75000,
      equity: "0.01",
      company_handle: "c1"
    });
  });

  test("works", async () => {
    const company = await Job.update(newJob.id, updateData);
    expect(company).toEqual({
      id: newJob.id,
      companyHandle: newJob.companyHandle,
      ...updateData
    });

    const res = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE id=$1`,
      [newJob.id]
    );
    expect(res.rows[0]).toEqual({
      id: newJob.id,
      companyHandle: newJob.companyHandle,
      ...updateData
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(0, {});
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  let jobs, exJob, jobLen;
  beforeEach(async () => {
    jobs = await Job.findAll();
    exJob = jobs[0];
    jobLen = jobs.length;
  });

  // afterEach(async () => {
  //   await db.query("DELETE FROM jobs");
  // });

  test("works", async () => {
    await Job.remove(exJob.id);
    const updatedJobs = await Job.findAll();
    expect(updatedJobs.length).toEqual(jobLen - 1);

    try {
      await Job.get(exJob.id);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such job", async () => {
    try {
      await Job.remove(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** findFiltered */
