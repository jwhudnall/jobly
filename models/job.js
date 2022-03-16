"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilteredSearch } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { id, title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, company_handle]
    );
    const job = result.rows[0];

    return job;
  }
  /** Find jobs based on filtered search.
   *
   *
   * Allowed query parameter filters: 'title', 'minSalary', 'hasEquity'
   * Uses helper function 'sqlForFilteredSearch' to generate a SQL-ready string by which
   * companies are filtered.
   *   - if 'hasEquity' is false (or not included), 'equity' filter is ignored.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   */

  static async findFiltered(data) {
    const colKeys = {
      title: "lower(title) LIKE lower('%' || $1 || '%')",
      minSalary: `"salary" >=$*`,
      hasEquity: `"equity" > 0`
    };

    let { setCols, values } = sqlForFilteredSearch(data, colKeys);

    if (setCols.includes("equity") && data.hasEquity === false) {
      setCols = setCols.replace(`AND "equity" > 0`, "");
      setCols = setCols.replace(`"equity" > 0`, "");
    }
    values = values.filter((v) => typeof v !== "boolean");

    const querySql = `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE ${setCols}
           ORDER BY title`;

    const result = await db.query(querySql, [...values]);
    return result.rows;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */
  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
        FROM jobs
        ORDER BY title`
    );

    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update", only changing provided fields.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle"
    });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols}
                      WHERE id = ${idVarIdx}
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}

module.exports = Job;
