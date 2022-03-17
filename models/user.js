"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { NotFoundError, BadRequestError, UnauthorizedError } = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");
const { user } = require("pg/lib/defaults");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
      `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Apply for a job. If valid username and job_id, a new 'applications' relationship will be created.
   *
   * Throws BadRequestError if application already exists.
   * Throws NotFoundError is 'user' or 'jobId' not found.
   *
   * Returns { applied: jobId }
   *
   **/

  static async apply(username, jobId) {
    const duplicateCheck = await db.query(
      `SELECT username, job_id
          FROM applications
          WHERE username=$1
          AND job_id=$2`,
      [username, jobId]
    );
    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(
        `User '${username}' has already applied to job having id '${jobId}'`
      );
    }
    const result = await db.query(
      `INSERT INTO applications
          (username, job_id)
          VALUES ($1, $2)
          RETURNING job_id AS "jobId"`,
      [username, jobId]
    );
    if (!result.rows[0]) {
      throw new BadRequestError("Bad username or job_id");
    }

    const job = result.rows[0];
    return job.jobId;
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register({ username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
      `SELECT username
           FROM users
           WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
      [username, hashedPassword, firstName, lastName, email, isAdmin]
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all job ids related to each user within the given 'usernames' array.
   *
   * usernames: Array of valid usernames
   * returns: Object of username:job Array Ids
   *          ex: {user1: [43, 55], user2: []}
   **/

  static async findUsersJobs(usernames) {
    const jobData = {};
    for (let user of usernames) {
      const res = await db.query(
        `SELECT job_id
          FROM applications
          WHERE username=$1`,
        [user]
      );
      if (res.rows.length === 0) {
        jobData[user] = [];
      } else {
        jobData[user] = res.rows.map((j) => j.job_id);
      }
    }
    return jobData;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin, jobs:[] }, ...]
   *   where jobs represents the job ids for any applications to which the user has applied.
   **/

  static async findAll() {
    const result = await db.query(
      `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`
    );
    const users = result.rows;
    const usernames = users.map((u) => u.username);
    const jobData = await User.findUsersJobs(usernames);

    return result.rows.map((u) => ({
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      isAdmin: u.isAdmin,
      jobs: jobData[u.username]
    }));
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
      `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
      [username]
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(data, {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin"
    });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users
                      SET ${setCols}
                      WHERE username = ${usernameVarIdx}
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
      `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }
}

module.exports = User;
