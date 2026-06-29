# Change Networks – IAM Backend

This is the backend API for the Change Networks IAM (Identity and Access Management) platform. It is built with **Node.js, Express, TypeScript, and Prisma**, and is designed to handle robust role-based access control (RBAC), permission boundaries, and delegated administration.

## 🚀 Tech Stack
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Security:** bcrypt, jsonwebtoken, helmet, express-rate-limit

---

## 🛠️ Local Setup Instructions

Follow these steps to get the backend running locally on your machine.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) running locally or a cloud database (like Aiven, Supabase, or Neon)

### 2. Clone and Install
```bash
# Clone your repository
git clone https://github.com/lakshyagupta001/iam-backend.git
cd backend

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of the `backend` directory based on the example:
```bash
cp .env.example .env
```

Open the `.env` file and fill in your connection details:
```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/iam_db?schema=public"

# The port the server will run on (Default: 8000)
PORT=8000

# Secret key for signing JWTs
JWT_SECRET="generate-a-strong-random-secret-key-here"

# Allowed frontend URL for CORS (e.g., http://localhost:5173 for local dev)
FRONTEND_URL="http://localhost:5173"
```

### 4. Database Setup & Seeding
Push the Prisma schema to your database to create the necessary tables, and then run the seed script to populate the database with dummy organizations, users, and policies.

```bash
# Push schema to database
npx prisma db push

# Seed the database with initial demo data
npm run prisma:seed
```

### 5. Run the Server
```bash
# Start the development server (uses nodemon + ts-node)
npm run dev
```
The server should now be running at `http://localhost:8000`.

---

## 📂 Project Structure

- `src/modules/` - Feature-based modules (IAM, Auth, Resources)
- `src/shared/` - Shared utilities, middleware, and configurations
- `prisma/` - Database schema and seeding scripts
- `dist/` - Compiled output (created after build)

## 📦 Build for Production

To compile the TypeScript code and run the optimized JavaScript:
```bash
npm run build
npm start
```
