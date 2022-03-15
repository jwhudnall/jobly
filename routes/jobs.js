"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const Company = require("../models/company");
const { preValidateProperty } = require("../helpers/validation");
const { sqlForPartialUpdate } = require("../helpers/sql");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");
const db = require("../db");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 * Natively returns NotFoundError (via 'Company' model) if invalid companyHandle is passed.
 *
 * Authorization required: admin
 */
// TODO: Add ensureIsAdmin middleware
router.post("/", async function (req, res, next) {
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

module.exports = router;

// tests:
// - /POST: Invalid company handle
