"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const Company = require("../models/company");
const { preValidateProperty } = require("../helpers/validation");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");
const db = require("../db");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job req body should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, company_handle }
 * Natively returns NotFoundError (via 'Company' model) if invalid companyHandle is passed.
 *
 * Authorization required: admin
 */
// TODO: Add ensureIsAdmin middleware
router.post("/", ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    await Company.get(req.body.companyHandle);
    const data = req.body;
    data.company_handle = data.companyHandle;
    delete data.companyHandle;

    const job = await Job.create(req.body);

    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const hasParams = Object.keys(req.query).length > 0;
  let jobs;
  try {
    if (hasParams) {
      const validator = jsonschema.validate(req.query, jobSearchSchema, {
        preValidateProperty // Pre-Property Validation Hook to cast numerical strings => numbers
      });
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }
      jobs = await Job.findFiltered(req.query);
    } else {
      jobs = await Job.findAll();
    }
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, company_handle }
 *  Invalid ID returns 404 error natively via Job class.
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { handle, title, salary, equity }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);

    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureIsAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
