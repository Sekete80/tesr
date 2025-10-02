# LUCT Lecturer Reporting - Starter Project

This starter project contains a minimal full-stack scaffold for your Assignment 2:
- Frontend: React (simple structure)
- Backend: Node.js + Express
- Database: MySQL (schema provided)

## Structure
- frontend/  -> React app (minimal)
- backend/   -> Express server with API endpoints
- db/        -> SQL schema file
- .env.example
- README.md

## Quick start (local)
1. Install and run MySQL (XAMPP) and create a database `luct_reporting`.
   Import `db/schema.sql` or run its contents manually.

2. Backend
   ```bash
   cd backend
   npm install
   # create .env from .env.example and fill DB credentials
   npm run dev
   ```
   Server runs on http://localhost:5000 by default.

3. Frontend
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend runs on http://localhost:3000 and proxies API requests to backend.

## What this starter includes
- Lecturer reporting form (frontend) that posts to backend.
- Basic REST API for creating and listing reports.
- SQL schema for `users`, `courses`, `reports`.
- README and notes for extension (authentication, modules, extra credit).

Good luck — expand and style as required by your assignment!
