# Jobly Backend

This is the Express backend for Jobly, a pure API that emulates that of a LinkedIn-like application.

## Start

To run this:

    node server.js

To run the tests:

    jest -i

![test suite](https://github.com/jwhudnall/jobly/blob/main/static/images/tests.png?raw=true)

## Authentication

There are two levels of authentication:

1. Admin
2. User

Admins have full access to all routes. To access certain routes (listed below), the user must be authenticated.

Authentication is verified using [JWT tokens](https://jwt.io/).

## User Flow

After cloning the repo, you can interact with the API using Insomnia, Postman or a comparable client.

1. Register via a `POST` request to the `/auth/register` route, including the following request body pairs:
   - username (ex: "testUser")
   - password (ex: "reallySecurePassword")
   - firstName (ex: "Test")
   - lastName (ex: "User")
   - email (ex: "noThankYou@gmail.com")

![register account](https://github.com/jwhudnall/jobly/blob/main/static/images/register.png?raw=true)

2. A successful `POST` will yield a `token`. Copy the token and add it as an `authorization` header value, as follows: `authorization: Bearer <yourTokenKey>`. While you're in the headers, set `Content-Type: application/json`.

   **Note: You must specify the Content-Type in the headers or you may receive inconsistent behavior.**

![set headers](https://github.com/jwhudnall/jobly/blob/main/static/images/set-headers.png?raw=true)

3. With the header values set as outlined above, you can now send requests to the following routes:
   - Companies
     - `POST` : `/companies` (admin only)
     - `GET` : `/companies` (no auth required)
     - `GET` : `/companies/:handle` (no auth required)
     - `PATCH` : `/companies/:handle` (admin only)
     - `DELETE` : `/companies/:handle` (admin only)
   - Jobs
     - `POST` : `/jobs` (admin only)
     - `GET` : `/jobs` (no auth required)
     - `GET` : `/jobs/:id` (no auth required)
     - `PATCH` : `/jobs/:id` (admin only)
     - `DELETE` : `/jobs/:id` (admin only)
   - Users
     - `POST` : `/users` (admin only)
     - `GET` : `/users` (admin only)
     - `GET` : `/users/:username` (admin or user having `username`)
     - `PATCH` : `/users/:username` (admin or user having `username`)
     - `DELETE` : `/users/:username` (admin or user having `username`)
     - `POST` : `/users/:username/jobs/:id` (admin or user having `username`)
       - Lets user `username` "apply" to a job having job_id of `id`

![search companies](https://github.com/jwhudnall/jobly/blob/main/static/images/search.png?raw=true)
