# Smart Society – Backend API Documentation

This document describes the **Smart Society** backend API for frontend integration. Use it as the single source of truth for base URL, authentication, request/response formats, and all endpoints.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack & Run](#2-tech-stack--run)
3. [Environment Variables](#3-environment-variables)
4. [Base URL & CORS](#4-base-url--cors)
5. [Authentication](#5-authentication)
6. [Common Conventions](#6-common-conventions)
7. [API Endpoints](#7-api-endpoints)
8. [Data Models (Reference)](#8-data-models-reference)
9. [Important Notes & Quirks](#9-important-notes--quirks)

---

## 1. Overview

- **Purpose:** Backend for a society management system (residents, guards, admins, societies, blocks, flats, visitors, complaints, SOS, posts, gate-pass).
- **Database:** PostgreSQL (raw `pg` driver; no Prisma models in use).
- **Auth:** JWT; different flows for residents (cookie + optional body token), guards (Bearer), and admins/secretary/master/super-admin (Bearer or cookie depending on route).

---

## 2. Tech Stack & Run

- **Runtime:** Node.js  
- **Framework:** Express 5  
- **DB client:** `pg` (PostgreSQL)  
- **Auth:** `jsonwebtoken`, `bcrypt`  
- **Other:** `cookie-parser`, `cors`, `dotenv`, `firebase-admin` (FCM), `morgan`, `multer`, `body-parser`

**Run:**

```bash
npm install
# Set .env (see Environment Variables)
npm run server   # or: node server.js
```

Default port: **5001** (or `process.env.PORT`).

---

## 3. Environment Variables

Frontend does not use these directly; backend must have them set (e.g. in `.env`):


| Variable      | Description             | Example / Note          |
| ------------- | ----------------------- | ----------------------- |
| `PORT`        | Server port             | `5001`                  |
| `DB_HOST`     | PostgreSQL host         |                         |
| `DB_PORT`     | PostgreSQL port         | `5432`                  |
| `DB_USER`     | DB user                 |                         |
| `DB_PASSWORD` | DB password             |                         |
| `DB_NAME`     | Database name           |                         |
| `JWT_SECRET`  | Secret for signing JWTs | **Must be kept secret** |


Firebase (FCM) uses a service account JSON file path/object in code; no extra env vars are required for basic API use.

---

## 4. Base URL & CORS

- **Base URL (production):** Use the deployed backend URL (e.g. `https://your-api-domain.com`).  
- **Local:** `http://localhost:5001` (or whatever `PORT` is).

**CORS:** Backend allows only these origins (with credentials):

- `https://www.delhipropertybazaar.com`
- `https://delhipropertybazaar.com`
- `https://kamalhousing.com`

For local frontend (e.g. `http://localhost:3000`), backend CORS may need to be updated to include that origin.

**Credentials:** Use `credentials: 'include'` (or equivalent) when using cookie-based auth (e.g. resident login).

---

## 5. Authentication

There are **four auth mechanisms**. Use the one that matches the role and route.

### 5.1 Resident (Cookie + optional token in body)

- **Used for:** `/api/resident/`* protected routes.
- **Login:** `POST /api/resident/login` returns a **token in response body** and sets an **httpOnly cookie** named `token`.
- **Subsequent requests:** Send the **cookie** (automatically sent if same origin and credentials included). Backend also accepts the same token in the response body; frontend may store it (e.g. in memory or localStorage) and send it in body for cross-origin or mobile.
- **Middleware:** `protect` — reads `req.cookies.token`. If missing or invalid → `401` / `403`.

**Resident token payload (decoded JWT):**  
`{ id, role: "resident", email }`  
(role in signup is stored as `"residence"` in DB but login returns `"resident"` in token.)

### 5.2 Guard (Bearer token)

- **Used for:** `/api/guard/`* protected routes.
- **Login:** `POST /api/guard/login` (or signin) returns **token in response body** (no cookie documented).
- **Subsequent requests:** Header:  
`Authorization: Bearer <token>`
- **Middleware:** `guardProtect` — reads `Authorization`, splits for Bearer token. If missing or invalid → `401`.

**Guard token payload:** Same shape as admin (id, role, email from `admins` or guard table depending on implementation).

### 5.3 Secretary / Admin (Cookie or Bearer)

- **Used for:** `/api/secretory/`* (secretary routes).
- **Login:** `POST /api/secretory/sign-in` returns token (and possibly cookie; code uses `authMiddleware` which can use Bearer). Some routes expect **cookie** `admin_token` for `adminProtect`; others use **Bearer** via `authMiddleware`.
- **Sign-up:** `POST /api/secretory/sign-up` **requires** a valid token (e.g. master-admin) in request (Bearer or as per `authMiddleware`).
- **Subsequent requests:** Either cookie `admin_token` or `Authorization: Bearer <token>` depending on which middleware protects the route. For routes using `authMiddleware`, use Bearer.

**Note:** `authMiddleware` in code currently has a hardcoded fallback token; in production only the real token should be used.

### 5.4 Master Admin & Super Admin (Bearer)

- **Used for:** `/api/master-admin/`*, `/api/super-admin/*`.
- **Login:**  
  - Master: `POST /api/master-admin/sign-in`  
  - Super Admin: `POST /api/super-admin/sign-in`  
  Both return token in body.
- **Sign-up:**  
  - Master: `POST /api/master-admin/sing-up` (note typo: **sing-up**).  
  - Super Admin: `POST /api/super-admin/sign-up` (requires existing auth via `authMiddleware`).
- **Subsequent requests:** `Authorization: Bearer <token>` (routes use `authMiddleware`).

**Token payload (admins):** `{ id, role, email }` where `role` can be e.g. `master_admin`, `super_admin`, `admin`, etc.

### 5.5 Summary table


| Role / Area     | Login / Sign-in returns     | How to send auth in requests     |
| --------------- | --------------------------- | -------------------------------- |
| Resident        | Cookie `token` + body token | Cookie (preferred) or body token |
| Guard           | Body token                  | `Authorization: Bearer <token>`  |
| Secretary/Admin | Body (and possibly cookie)  | Cookie `admin_token` or Bearer   |
| Master Admin    | Body token                  | `Authorization: Bearer <token>`  |
| Super Admin     | Body token                  | `Authorization: Bearer <token>`  |


**Token expiry:** 1 hour (from `generateToken`).

---

## 6. Common Conventions

### 6.1 Request body

- **Content-Type:** `application/json` for JSON bodies.
- **Naming:** Backend uses **snake_case** (e.g. `society_id`, `flat_number`, `raised_by`, `fcm_tokens`). Send JSON in snake_case unless stated otherwise.

### 6.2 Pagination

Used where listed in endpoints (e.g. resident fetch, guards, apartments, secretaries).

- **Query parameters:**  
  - `page` (default: `1`)  
  - `limit` (default: `10`)
- **Response:** Usually includes a `pagination` object with `totalRecords`, `currentPage`, `totalPages`, `limit`, and a `data` (or similar) array.

### 6.3 Success response shape

- Many endpoints return:  
`{ success: true, message: "...", data?: ..., ... }`  
or similar (e.g. `apartment`, `posts`, `token`).  
- **Status codes:** `200` (OK), `201` (Created).

### 6.4 Error response shape

- **Body:** JSON with `message` and often `success: false`.  
- **Status codes:**  
  - `400` – Bad request / validation  
  - `401` – Unauthorized (no or invalid token)  
  - `403` – Forbidden  
  - `404` – Resource not found  
  - `409` – Conflict (e.g. email already exists)  
  - `500` – Server error

---

## 7. API Endpoints

All paths are relative to the **base URL** (e.g. `https://your-api.com`).  
**Auth required** means the route uses one of the auth middlewares; send the appropriate cookie or Bearer token.

---

### 7.1 Resident — `/api/resident`


| Method | Path          | Auth          | Description                                                                                        |
| ------ | ------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| POST   | `/signUp`     | No            | Register resident (onboard).                                                                       |
| POST   | `/login`      | No            | Login resident.                                                                                    |
| GET    | `/validation` | Yes (protect) | Validate signup fields (email, id_proof_number, phone_number, password) — **sends body with GET**. |
| GET    | `/fetch`      | No            | List all users (residents) with pagination.                                                        |
| GET    | `/checkAuth`  | Yes (protect) | Check if resident is authenticated.                                                                |
| PUT    | `/update/:id` | No            | Update resident by `id`.                                                                           |
| DELETE | `/delete/:id` | Yes (protect) | Delete resident by `id`.                                                                           |


**POST /api/resident/signUp**  

- **Body:**  
`{ "name", "email", "password", "phone_number", "fcm_tokens" }`  
(`fcm_tokens` optional; used for push notifications.)  
- **Success (201):**  
`{ success: true, message: "Resident onboard successfully.", token }`  
  - sets cookie `token`.

**POST /api/resident/login**  

- **Body:**  
`{ "email", "password" }`  
- **Success (200):**  
`{ success: true, message: "Login successful", token }`  
  - sets cookie `token`.
- **Error:** `401` – Invalid email or password.

**GET /api/resident/validation**  

- **Auth:** Cookie (or token) required.  
- **Body (unusual for GET; backend reads body):**  
`{ "email", "id_proof_number", "password", "phone_number" }`  
- **Success (200):**  
`{ success: true, message: "All validations passed" }`  
- **Error:** `400` (missing field), `409` (email / id_proof_number / phone_number already exists).

**GET /api/resident/fetch**  

- **Query:** `page`, `limit` (optional).  
- **Success (200):**  
`{ success: true, message: "Users fetched successfully", data: [...], pagination: { totalRecords, currentPage, totalPages, limit } }`  
Each item: `id, name, email, phone, role_id, fcm_token`.

**PUT /api/resident/update/:id**  

- **Params:** `id` – resident user id.  
- **Body:**  
`{ "name", "email", "phone_number" }`  
- **Success (200):**  
`{ success: true, data: { id, name, email, phone }, message: "Resident updated successfully." }`

**DELETE /api/resident/delete/:id**  

- **Auth:** Required (protect).  
- **Params:** `id` – resident id.  
- **Success (200):**  
`{ success: true, message: "Resident deleted successfully" }`

---

### 7.2 Guard — `/api/guard`


| Method | Path            | Auth               | Description                      |
| ------ | --------------- | ------------------ | -------------------------------- |
| POST   | `/signup`       | No                 | Register guard.                  |
| POST   | `/login`        | No                 | Login guard.                     |
| GET    | `/fetch`        | Yes (guardProtect) | List guards with pagination.     |
| GET    | `/validation`   | No                 | Validate guard signup fields.    |
| GET    | `/authenticate` | Yes (guardProtect) | Check if guard is authenticated. |
| DELETE | `/delete/:uuid` | Yes (guardProtect) | Delete guard by UUID.            |


**POST /api/guard/signup**  

- **Body:**  
`{ "name", "email", "phone", "password", "role" }` (and possibly `confirmPassword` for validation).  
- **Success (201):**  
`{ message: "Signup successful", user: { id, name, email } }`

**POST /api/guard/login**  

- Uses shared `signin` (Authentication.js):  
**Body:**  
`{ "email", "password" }`  
- **Success (200):**  
`{ message: "Login successful", token, user }`

**GET /api/guard/fetch**  

- **Auth:** Bearer required.  
- **Query:** `page`, `limit`.  
- **Success (200):**  
`{ success: true, message: "Guards fetched successfully", data: [...], pagination }`  
Each item: `id, name, email`.

**GET /api/guard/validation**  

- **Body (backend reads body):**  
`{ "name", "email", "password", "confirmPassword" }`  
- **Success (200):**  
`{ success: true, message: "Your details are valid." }`  
- **Error:** `401` for missing or mismatch.

**DELETE /api/guard/delete/:uuid**  

- **Params:** `uuid` – guard UUID.  
- **Success (200):**  
`{ success: true, message: "Guard deleted successfully" }`

---

### 7.3 Secretary / Admin — `/api/secretory`


| Method | Path                                   | Auth                 | Description                       |
| ------ | -------------------------------------- | -------------------- | --------------------------------- |
| POST   | `/sign-in`                             | No                   | Secretary login.                  |
| POST   | `/sign-up`                             | Yes (authMiddleware) | Create secretary (admin).         |
| PUT    | `/update`                              | Yes (authMiddleware) | Update secretary profile.         |
| PUT    | `/update-secretary`                    | Yes (authMiddleware) | Update admin (calls updateAdmin). |
| GET    | `/fetch-all`                           | Yes (authMiddleware) | List secretaries with pagination. |
| GET    | `/get-secretory-by-society/:societyId` | No                   | List secretaries by society.      |


**POST /api/secretory/sign-in**  

- **Body:**  
`{ "email", "password" }`  
- **Success (200):**  
`{ message: "Login successful", token, user }`

**POST /api/secretory/sign-up**  

- **Auth:** Bearer (e.g. master-admin).  
- **Body:**  
`{ "name", "email", "phone", "password", "role" }`  
- **Success (201):**  
`{ message: "Signup successful", user: { id, name, email } }`

**PUT /api/secretory/update**  

- **Auth:** Required.  
- **Body:**  
`{ "name", "phone", "email", "society_id" }`  
- Updates `secretaries` table by `req.user.id`.  
- **Success (200):**  
`{ success: true, data }`

**PUT /api/secretory/update-secretary**  

- **Auth:** Required.  
- **Body:**  
`{ "name", "email", "phone" }`  
- Updates `admins` by `req.user.id`.  
- **Success (200):**  
`{ message: "Admin updated successfully", data }`

**GET /api/secretory/fetch-all**  

- **Auth:** Required.  
- **Query:** `page`, `limit`.  
- **Success (200):**  
`{ success: true, pagination, data }` — admins created by the current user.

**GET /api/secretory/get-secretory-by-society/:societyId**  

- **Params:** `societyId`.  
- **Query:** `page`, `limit`.  
- **Success (200):**  
`{ success: true, pagination, data }`  
(Note: response references `totalRecords` which may not be set in this route.)

---

### 7.4 Master Admin — `/api/master-admin`


| Method | Path           | Auth                 | Description                                                |
| ------ | -------------- | -------------------- | ---------------------------------------------------------- |
| POST   | `/sing-up`    | No                   | **Note: path is "sing-up" (typo).** Register master admin. |
| POST   | `/sign-in`     | No                   | Master admin login.                                        |
| GET    | `/get-all`     | Yes (authMiddleware) | List all admins with pagination.                           |
| PUT    | `/updateAdmin` | Yes (authMiddleware) | Update current admin profile.                              |
| DELETE | `/delete/:id`  | Yes (authMiddleware) | Delete admin by id.                                        |


**POST /api/master-admin/sing-up**  

- **Body:**  
`{ "name", "email", "phone", "password", "role" }`  
- **Success (201):**  
`{ message: "Signup successful", user }`

**POST /api/master-admin/sign-in**  

- **Body:**  
`{ "email", "password" }`  
- **Success (200):**  
`{ message: "Login successful", token, user }`

**GET /api/master-admin/get-all**  

- **Auth:** Bearer required.  
- **Query:** `page`, `limit`.  
- **Success (200):**  
`{ total, page, limit, totalPages, data }`

**PUT /api/master-admin/updateAdmin**  

- **Auth:** Required.  
- **Body:**  
`{ "name", "email", "phone" }`  
- Updates the admin identified by `req.user.id`.  
- **Success (200):**  
`{ message: "Admin updated successfully", data }`

**DELETE /api/master-admin/delete/:id**  

- **Auth:** Required.  
- **Params:** `id` – admin id.  
- **Success (200):**  
`{ message: "Admin deleted successfully" }`  
- **Note:** Backend blocks deletion of a specific master admin id (hardcoded).

---

### 7.5 Super Admin — `/api/super-admin`


| Method | Path       | Auth                 | Description                   |
| ------ | ---------- | -------------------- | ----------------------------- |
| POST   | `/sign-in` | No                   | Super admin login.            |
| POST   | `/sign-up` | Yes (authMiddleware) | Create super admin.           |
| PUT    | `/update`  | Yes (authMiddleware) | Update current admin profile. |


**POST /api/super-admin/sign-in**  

- **Body:**  
`{ "email", "password" }`  
- **Success (200):**  
`{ message: "Login successful", token, user }`

**POST /api/super-admin/sign-up**  

- **Auth:** Bearer required.  
- **Body:**  
`{ "name", "email", "phone", "password", "role" }`  
- **Success (201):**  
`{ message: "Signup successful", user }`

**PUT /api/super-admin/update**  

- Same as master-admin update (by `req.user.id`).  
- **Body:**  
`{ "name", "email", "phone" }`

---

### 7.6 Apartment — `/api/apartment`


| Method | Path          | Auth | Description                        |
| ------ | ------------- | ---- | ---------------------------------- |
| POST   | `/create`     | No   | Create apartment.                  |
| PUT    | `/update/:id` | No   | Update apartment.                  |
| DELETE | `/delete/:id` | No   | Soft-delete (set status INACTIVE). |
| GET    | `/fetch`      | No   | List apartments with pagination.   |


**POST /api/apartment/create**  

- **Body:**  
`{ "society_id", "flat_number", "floor?", "owner_id?" }`  
Required: `society_id`, `flat_number`.  
- **Success (201):**  
`{ message: "Apartment created successfully", apartment }`  
`apartment`: `id, society_id, flat_number, floor, owner_id, status`.

**PUT /api/apartment/update/:id**  

- **Params:** `id`.  
- **Body:**  
`{ "flat_number?", "floor?", "owner_id?", "status?" }`  
- **Success (200):**  
`{ message: "Apartment updated successfully", apartment }`

**DELETE /api/apartment/delete/:id**  

- **Success (200):**  
`{ message: "Apartment deleted successfully" }`  
(Soft delete: status set to INACTIVE.)

**GET /api/apartment/fetch**  

- **Query:** `page`, `limit`.  
- **Success (200):**  
`{ page, limit, total, apartments }`  
Each apartment includes owner_name, owner_email (from join).

---

### 7.7 Complaint — `/api/complaint`


| Method | Path                    | Auth | Description                                         |
| ------ | ----------------------- | ---- | --------------------------------------------------- |
| POST   | `/create`               | No   | Create complaint.                                   |
| PUT    | `/udpate/:id`           | No   | **Note: path has typo "udpate".** Update complaint. |
| GET    | `/raised-by/:raised_by` | No   | Get complaints by raiser (user/resident id).        |
| DELETE | `/delete/:id`           | No   | Delete complaint.                                   |


**POST /api/complaint/create**  

- **Body:**  
`{ "society_id", "apartment_id", "raised_by", "title", "description" }`  
- **Success (201):**  
Returns created row (full complaint object).

**PUT /api/complaint/udpate/:id**  

- **Params:** `id` – complaint id.  
- **Body:**  
`{ "title?", "description?", "status?", "assigned_to?" }`  
- **Success (200):**  
Updated complaint row.

**GET /api/complaint/raised-by/:raised_by**  

- **Params:** `raised_by` – user/resident id.  
- **Success (200):**  
Array of complaints.

**DELETE /api/complaint/delete/:id**  

- **Success (200):**  
`{ message: "Complaint deleted successfully" }`

---

### 7.8 Visitor — `/api/visitor`


| Method | Path                | Auth | Description                                                                       |
| ------ | ------------------- | ---- | --------------------------------------------------------------------------------- |
| GET    | `/validation`       | No   | Validate visitor fields (body).                                                   |
| GET    | `/fetch`            | No   | List all visitor attendance records.                                              |
| GET    | `/fetch/:id`        | No   | Get single visitor attendance by id.                                              |
| POST   | `/create`           | No   | Create visitor + attendance.                                                      |
| PUT    | `/update`           | No   | Update visitor (backend expects id in path; route may be fixed to `/update/:id`). |
| DELETE | `/delete/:id`       | No   | Delete visitor by id.                                                             |
| GET    | `/get/:resident_id` | No   | Get visitors by resident.                                                         |


**GET /api/visitor/validation**  

- **Body (backend reads body):**  
`{ "vehicleInfo", "number" }`  
- **Success (200):**  
`{ message: "All fields are valid.", success: true }`  
- **Error:** `400` – vehicleInfo or number required / already exist.

**GET /api/visitor/fetch**  

- **Success (200):**  
Array of `visitor_attendance` rows (ordered by check_in DESC).  
(Table: `visitor_attendance`.)

**GET /api/visitor/fetch/:id**  

- **Params:** `id` – attendance id.  
- **Success (200):**  
Single attendance row.  
- **Error:** `404` – Visitor not found.

**POST /api/visitor/create**  

- **Body:**  
`{ "name", "phone", "vehicleinfo?", "resident_id", "check_in?" }`  
Required: `name`, `phone`, `resident_id`.  
`check_in` defaults to now if omitted.  
- **Success (201):**  
`{ success: true, message: "Visitor created successfully", data: { id, check_in, check_out, status, visitor: { id, name, phone, vehicleinfo, resident_id } } }`

**PUT /api/visitor/update**  

- **Note:** Route is currently `PUT /update` (no `:id` in path). Controller reads `req.params.id`, so **id is undefined** until backend adds `:id` to the path (e.g. `PUT /update/:id`). For now, frontend should call `PUT /api/visitor/update/:id` with **id in the path** once backend fixes the route; otherwise confirm with backend.  
- **Body:**  
`{ "name?", "phone?", "vehicleinfo?", "resident_id?" }`  
- **Success (200):**  
Updated visitor row.

**DELETE /api/visitor/delete/:id**  

- **Params:** `id` – visitor id.  
- **Success (200):**  
`{ message: "Visitor deleted successfully" }`

**GET /api/visitor/get/:resident_id**  

- **Params:** `resident_id`.  
- **Success (200):**  
`{ success: true, message: "Visitors fetched successfully", data: [ { id, check_in, check_out, status, visitor } ] }`

---

### 7.9 SOS — `/api/sos`


| Method | Path                   | Auth | Description                                                |
| ------ | ---------------------- | ---- | ---------------------------------------------------------- |
| POST   | `/create`              | No   | Create SOS alert.                                          |
| PUT    | `/update/:id`          | No   | Update SOS status.                                         |
| DELETE | `/delete/:id`          | No   | Delete SOS.                                                |
| GET    | `/fetch/:society_id`   | No   | Get SOS by society.                                        |
| GET    | `/fetch/:apartment_id` | No   | Get SOS by apartment (same path, different param meaning). |
| GET    | `/status/:status`      | No   | Get SOS by status.                                         |


**Important:**  
`GET /api/sos/fetch/:id` is used for both society and apartment; backend distinguishes by context. Confirm with backend which id is expected on which screen (society id vs apartment id).

**POST /api/sos/create**  

- **Body:**  
`{ "society_id", "appartment_id", "triggered_by", "description" }`  
(Note: backend uses `appartment_id` in insert.)  
- **Success (201):**  
`{ success: true, message: "Success created." }`

**PUT /api/sos/update/:id**  

- **Params:** `id` – SOS alert id.  
- **Body:**  
`{ "status" }`  
- **Success (200):**  
`{ message: "SOS updates successfully.", success: true }`

**GET /api/sos/fetch/:society_id**  

- **Success (200):**  
`{ success: true, data: [ ... ] }`

**GET /api/sos/status/:status**  

- **Success (200):**  
`{ success: true, data: [ ... ] }`

---

### 7.10 Get-pass (Gate pass / Alerts) — `/api/getpass`


| Method | Path                 | Auth | Description                                    |
| ------ | -------------------- | ---- | ---------------------------------------------- |
| POST   | `/send-notification` | No   | Send FCM notification to resident for visitor. |
| PUT    | `/approve-gatepass`  | No   | Approve or unapprove visitor entry.            |


**POST /api/getpass/send-notification**  

- **Body:**  
`{ "id", "visitorId" }`  
  - `id` – resident (user) id (for FCM token lookup).  
  - `visitorId` – visitor id.
- **Success (200):**  
`{ success: true, message: "Notification sent successfully" }`  
- **Error:** `404` – Resident or visitor not found; `400` – No FCM token.

**PUT /api/getpass/approve-gatepass**  

- **Body:**  
`{ "status", "id" }`  
  - `status`: `"approve"` or `"unapprove"`.  
  - `id` – visitor_attendance id.
- **Success (200):**  
  - `status === "approve"` → `{ success: true, message: "Visitor is allowed for entry." }`  
  - `status === "unapprove"` → `{ success: true, message: "Visitor is not allowed for entry." }`
- **Error:** `404` – Visitor not found.

---

### 7.11 Post — `/api/post`


| Method | Path                            | Auth | Description                |
| ------ | ------------------------------- | ---- | -------------------------- |
| GET    | `/fetch-by-resident/:id`        | No   | Get posts by resident id.  |
| GET    | `/fetch-by-owner/:id`           | No   | Get posts by owner id.     |
| POST   | `/create-postByRes/:id`         | No   | Create post as resident.   |
| POST   | `/create-post/:id`              | No   | Create post as owner.      |
| DELETE | `/delete/:id`                   | No   | Delete post by id.         |
| POST   | `/like-by-resident/:residentId` | No   | Toggle like (like/unlike). |


**GET /api/post/fetch-by-resident/:id**  

- **Params:** `id` – resident id.  
- **Success (200):**  
`{ success: true, total, posts }`

**GET /api/post/fetch-by-owner/:id**  

- **Params:** `id` – owner id (society_owners id).  
- **Success (200):**  
`{ success: true, total, posts }`

**POST /api/post/create-postByRes/:id**  

- **Params:** `id` – resident id.  
- **Body:**  
`{ "title", "description?", "images?" }`  
Required: `title`.  
- **Success (201):**  
`{ success: true, message: "Post created by resident successfully", post }`

**POST /api/post/create-post/:id**  

- **Params:** `id` – owner id (society_owners).  
- **Body:**  
`{ "title", "description?", "images?" }`  
- **Success (201):**  
`{ success: true, message: "Post created by owner successfully", post }`

**DELETE /api/post/delete/:id**  

- **Params:** `id` – post id.  
- **Success (200):**  
`{ message: "Post deleted successfully", success: true, deletedPost }`  
- **Error:** `404` – Post not found.

**POST /api/post/like-by-resident/:residentId**  

- **Params:** `residentId` – resident user id.  
- **Body:**  
`{ "post_id" }`  
- **Success (201):**  
`{ success: true, message: "Post liked successfully", data }`  
- **Success (200) when unliked:**  
`{ success: true, message: "Post unliked successfully" }`

---

### 7.12 Society Owner — `/api/owner`

Currently the router is mounted at `/api/owner` but **no routes are registered** in the code (no GET/POST/PUT/DELETE). The backend has controller functions `deleteOwner` and `getAllOwners`; these are not exposed. For integration, either backend adds routes (e.g. `GET /fetch`, `DELETE /delete/:id`) or these actions are not available via this API.

---

### 7.13 Society — `/api/society`


| Method | Path                               | Auth                 | Description                                                  |
| ------ | ---------------------------------- | -------------------- | ------------------------------------------------------------ |
| POST   | `/create/:id`                      | Yes (authMiddleware) | Create society.                                              |
| GET    | `/my-society/:id`                  | Yes (authMiddleware) | Get societies for admin (id can match logged-in user).       |
| PUT    | `/update`                          | No                   | Update society (uses req.user.id for society_owners lookup). |
| DELETE | `/delete/:id`                      | Yes (authMiddleware) | Delete society.                                              |
| GET    | `/fetch-society-by-owner/:ownerId` | No                   | Get societies by owner id.                                   |


**POST /api/society/create/:id**  

- **Auth:** Bearer required.  
- **Params:** `id` – not used in create (backend uses `req.user.id` as `created_by_admin`).  
- **Body:**  
`{ "name", "address" }`  
- **Success (201):**  
`{ message: "Society created successfully", society }`

**GET /api/society/my-society/:id**  

- **Auth:** Bearer required.  
- **Params:** `id` – admin id (used as `created_by_admin`).  
- **Success (200):**  
`{ success: true, data: [ { id, name, address, status, created_at, created_by_admin, blocks: [ { block_id, block_name, flats: [ ... ] } ] } ] }`

**PUT /api/society/update**  

- **Body:**  
`{ "name", "address" }`  
- Backend resolves society via `society_owners` and `req.user.id` (ownerId).  
- **Success (200):**  
`{ message: "Society updated successfully", society }`

**DELETE /api/society/delete/:id**  

- **Auth:** Bearer required.  
- **Params:** `id` – society id.  
- **Success (200):**  
`{ message: "Society deleted successfully", society }`

**GET /api/society/fetch-society-by-owner/:ownerId**  

- **Params:** `ownerId`.  
- **Success (200):**  
Same shape as my-society (societies with blocks and flats).

---

### 7.14 Blocks — `/api/blocks`


| Method | Path          | Auth | Description   |
| ------ | ------------- | ---- | ------------- |
| POST   | `/create`     | No   | Create block. |
| PUT    | `/update/:id` | No   | Update block. |
| DELETE | `/delete/:id` | No   | Delete block. |


**POST /api/blocks/create**  

- **Body:**  
`{ "society_id", "name" }`  
- **Success (201):**  
`{ message: "Block created successfully", data }`

**PUT /api/blocks/update/:id**  

- **Params:** `id` – block id.  
- **Body:**  
`{ "name" }`  
- **Success (200):**  
`{ message: "Block updated successfully", data }`

**DELETE /api/blocks/delete/:id**  

- **Success (200):**  
`{ message: "Block deleted successfully" }`

---

### 7.15 Flats — `/api/flats`


| Method | Path          | Auth | Description                                    |
| ------ | ------------- | ---- | ---------------------------------------------- |
| POST   | `/create`     | No   | Create flat.                                   |
| PUT    | `/udpate/:id` | No   | **Note: path has typo "udpate".** Update flat. |
| DELETE | `/delete/:id` | No   | Delete flat.                                   |


**POST /api/flats/create**  

- **Body:**  
`{ "society_id", "block_id", "flat_number", "floor?", "owner_id?", "status?" }`  
Required: `society_id`, `block_id`, `flat_number`.  
Defaults: `status` = "ACTIVE".  
- **Success (201):**  
`{ message: "Flat created successfully", data }`  
- **Note:** Backend SQL for create has a typo ("sta mm" instead of "status"); if you get 500, coordinate with backend to fix.

**PUT /api/flats/udpate/:id**  

- **Params:** `id` – flat id.  
- **Body:**  
`{ "flat_number", "floor", "owner_id", "status" }`  
- **Success (200):**  
`{ message: "Flat updated successfully", data }`

**DELETE /api/flats/delete/:id**  

- **Success (200):**  
`{ message: "Flat deleted successfully" }`

---

### 7.16 Root

**GET /**  

- **Success (200):**  
Plain text: `"Smart Society me apka swagat hai....😂"`  
(Health/welcome message.)

---

## 8. Data Models (Reference)

Inferred from queries; actual DB may have more columns or constraints. Use for understanding only; do not assume without checking backend/DB.

- **users** – id, name, email, password, phone, role_id, fcm_token, created_at, (id_proof_number, phone_number in validation).
- **guards** – id (UUID in delete), name, email.
- **admins** – id, name, email, phone, password, role, created_by, society_id, created_at, updated_at.
- **secretaries** – id, name, phone, email, society_id (used in secretary update).
- **societies** – id, name, address, status, created_by_admin, created_at.
- **blocks** – id, society_id, name.
- **flats** – id, society_id, block_id, flat_number, floor, owner_id, status.
- **apartments** – id, society_id, flat_number, floor, owner_id, status, created_at.
- **complaints** – id, society_id, apartment_id, raised_by, title, description, status, assigned_to, created_at.
- **visitors** – id, name, phone, vehicleinfo, resident_id.
- **visitor_attendance** – id, check_in, check_out, visitor_id, status, resident_id.
- **sos_alerts** – id, society_id, appartment_id (note spelling), triggered_by, description, status, created_at.
- **post** – id, title, description, images, createdByOwner, createdByResident, created_at.
- **post_likes** – id, post_id, user_id.
- **society_owners** – id, society_id, name, email, phone, profile_photo, created_at.

---

## 9. Important Notes & Quirks

1. **Route typos (use exactly as written):**
  - Complaints update: `PUT /api/complaint/udpate/:id`  
  - Flats update: `PUT /api/flats/udpate/:id`  
  - Master admin sign-up: `POST /api/master-admin/sing-up`
2. **GET with body:**
  Resident validation and visitor validation use **GET** but expect a **request body**. Not all HTTP clients send body with GET; if needed, use a client that supports it or ask backend to change to POST.
3. **Resident update param:**
  Route is `PUT /api/resident/update/:id`. Backend controller may read `userId` from params; ensure path param is the resident’s user `id`.
4. **SOS fetch path ambiguity:**
  `GET /api/sos/fetch/:society_id` and `GET /api/sos/fetch/:apartment_id` share the same path pattern. Backend differentiates by param name; frontend should use the correct id type (society id vs apartment id) per screen.
5. **Owner API:**
  `/api/owner` has no routes in code. Controllers exist for delete and getAll owners; if needed, backend must add routes.
6. **CORS:**
  Only specific production origins are allowed. For local dev, backend may need to add your frontend origin.
7. **Casing:**
  Use **snake_case** in JSON (e.g. `society_id`, `flat_number`, `raised_by`, `fcm_tokens`). Post table uses camelCase in column names (`createdByOwner`, `createdByResident`); those are DB column names, not necessarily request body keys (body still uses snake_case where applicable).
8. **Cooking / token:**
  Resident: prefer sending cookie; token in body is also supported. Other roles use Bearer unless a specific route is documented to use cookie.
9. **Token expiry:**
  JWT expires in 1 hour; implement refresh or re-login on 401.
10. **Casing of “secretory”:**
  Base path is `/api/secretory` (not “secretary”).
11. **Visitor update:**
  Route is `PUT /api/visitor/update` with no `:id`. Backend controller uses `req.params.id`, so it is currently undefined. Coordinate with backend to use `PUT /api/visitor/update/:id` and pass visitor id in the path.
12. **Resident update:**
  Use path param `id` (resident user id). Backend controller variable is `userId` but route defines `:id`, so the value is in `req.params.id` (backend may need to use `req.params.id` instead of `req.params.userId`).

---

**Document version:** 1.0  
**Backend repo:** Smart Society (Express + PostgreSQL).  
For any mismatch between this doc and actual behavior, align with the backend team and update this file.