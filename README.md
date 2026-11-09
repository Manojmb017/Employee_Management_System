# Employee Management System

A full-stack HR application built with React + Vite, Python Flask, and
TiDB Cloud (MySQL-compatible).

## Overview

The React frontend communicates with a Flask REST API. The API
authenticates HR users, issues JWT access tokens, and reads or modifies
employee records in TiDB Cloud.

### Main capabilities

-   HR login and registration
-   Password hashing and verification with Flask-Bcrypt
-   JWT authentication for protected employee endpoints
-   View, add, update, and delete employee records
-   Employee and onboarding-related fields such as department, role,
    joining date, offer status, documents, background checks, equipment,
    system access, induction, training, mentor, probation, and
    performance review

The API's `employees` table fields are the persisted employee data. Do
not assume any additional frontend-only fields are saved unless the
backend and database schema also support them.

## Architecture

``` text
Browser
  |
  v
React + Vite frontend (Vercel)
  |
  | HTTPS / JSON / JWT
  v
Flask REST API (Render)
  |
  | MySQL protocol + TLS
  v
TiDB Cloud
  |-- employees
  |-- hr_users
```

**Hosting note:** Vercel hosts the React frontend. The Flask API needs a
separate backend host such as Render. The database remains on TiDB
Cloud.

## Technology stack

  Layer              Technology
  ------------------ ------------------------------
  Frontend           React, Vite, JavaScript, CSS
  Backend            Python, Flask
  API                REST, JSON
  Authentication     Flask-JWT-Extended
  Password hashing   Flask-Bcrypt
  Database driver    mysql-connector-python
  Database           TiDB Cloud
  Frontend hosting   Vercel
  Backend hosting    Render + Gunicorn
  Source control     Git + GitHub

## Repository structure

``` text
Employee_Management_System/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── .gitignore
```

Never commit `.env` files, passwords, JWT secrets, private keys, or
database certificates.

## Database

Database name: `hr_management`

Tables used by the API:

-   `hr_users` --- HR account details and password hashes.
-   `employees` --- employee and onboarding-related records.

The backend reads these environment variables:

  Variable           Purpose
  ------------------ ---------------------------------------
  `TIDB_HOST`        TiDB Cloud hostname
  `TIDB_PORT`        TiDB port (normally `4000`)
  `TIDB_USER`        TiDB database username
  `TIDB_PASSWORD`    TiDB database password
  `TIDB_CA`          Path to the TiDB CA certificate
  `JWT_SECRET_KEY`   Secret used to sign JWT access tokens

Keep the actual values private. Do not put them in this README or source
code.

## API endpoints

  --------------------------------------------------------------------------------------
  Method            Endpoint                         Authentication    Purpose
  ----------------- -------------------------------- ----------------- -----------------
  POST              `/api/login`                     Public            Authenticate HR
                                                                       user and return
                                                                       JWT

  POST              `/api/register`                  Public            Register an HR
                                                                       user

  GET               `/api/test`                      Public            Check that the
                                                                       API responds

  GET               `/api/employees`                 JWT required      Retrieve employee
                                                                       records

  POST              `/api/employees`                 JWT required      Add an employee

  PUT               `/api/employees/<employee_id>`   JWT required      Update an
                                                                       employee

  DELETE            `/api/employees/<employee_id>`   JWT required      Delete an
                                                                       employee
  --------------------------------------------------------------------------------------

Protected endpoints expect this request header:

``` http
Authorization: Bearer <access_token>
```

## Run locally

Prerequisites: Python, Node.js/npm, access to the TiDB cluster, and the
TiDB CA certificate.

### Backend

From the project root:

``` powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Set environment variables in the same PowerShell window. Use your own
values and never paste secrets into source code:

``` powershell
$env:TIDB_HOST = "your-tidb-host"
$env:TIDB_PORT = "4000"
$env:TIDB_USER = "your-tidb-username"
$env:TIDB_CA = "C:\path\to\isrgrootx1.pem"
$secure = Read-Host "TiDB password" -AsSecureString
$env:TIDB_PASSWORD = [System.Net.NetworkCredential]::new("", $secure).Password
$env:JWT_SECRET_KEY = "your-long-random-secret"
```

Start Flask:

``` powershell
python app.py
```

Local API: `http://127.0.0.1:5000`

### Frontend

Open a second terminal:

``` powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually
`http://localhost:5173`).

The frontend reads `VITE_API_BASE_URL`. If it is not set, the current
code falls back to `http://127.0.0.1:5000`.

## Deploy the backend on Render

Create a Render **Web Service** connected to this GitHub repository:

  Setting          Value
  ---------------- -----------------------------------
  Root Directory   `backend`
  Runtime          Python
  Branch           `main`
  Build Command    `pip install -r requirements.txt`
  Start Command    `gunicorn app:app`

Add these environment variables in Render:

-   `TIDB_HOST`
-   `TIDB_PORT`
-   `TIDB_USER`
-   `TIDB_PASSWORD`
-   `JWT_SECRET_KEY`

Upload the TiDB CA certificate under Render **Secret Files** using the
filename `isrgrootx1.pem`, then set:

``` text
TIDB_CA=/etc/secrets/isrgrootx1.pem
```

Use the CA certificate downloaded for your TiDB cluster. Do not put it
in GitHub.

After deployment, copy the Render service URL, for example
`https://your-api-service.onrender.com`. Use the base URL only---do not
add `/api/employees`.

## Deploy the frontend on Vercel

1.  Sign in to Vercel with GitHub.
2.  Choose **Add New → Project**.
3.  Import `Manojmb017/Employee_Management_System`.
4.  Set **Root Directory** to `frontend`.
5.  Select the Vite framework preset if it is not detected
    automatically.
6.  Set **Build Command** to `npm run build`.
7.  Set **Output Directory** to `dist`.
8.  Add this environment variable:

``` text
VITE_API_BASE_URL=https://your-api-service.onrender.com
```

Replace the example with the actual Render backend URL. Do not add a
trailing slash or `/api` suffix.

9.  Click **Deploy**.

Vite embeds `VITE_` variables into the frontend build. Redeploy Vercel
after changing this value.

## Production checklist

-   Render backend starts successfully.
-   `GET /api/test` responds.
-   Vercel frontend can reach the Render API.
-   HR login returns an access token.
-   Employee list loads.
-   Add, edit, and delete operations work.
-   Database credentials, JWT secret, CA certificate, and `.env` files
    are not committed.
-   Flask debug mode is disabled.
-   Restrict Flask CORS to the deployed Vercel website origin before
    production use. The current `CORS(app)` setting is broad; replace it
    with the exact deployed frontend origin when known.

## Update the deployment

After changing code locally:

``` powershell
git add .
git commit -m "Describe your changes"
git push origin main
```

With GitHub integration enabled, Render and Vercel can automatically
deploy new commits from `main`.

## Useful links

-   GitHub: https://github.com/Manojmb017/Employee_Management_System
-   Vercel: https://vercel.com/
-   Render: https://render.com/
-   TiDB Cloud: https://tidbcloud.com/

**Project:** Employee Management System\
**Frontend:** React + Vite\
**Backend:** Python Flask\
**Database:** TiDB Cloud
