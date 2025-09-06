# School Management System Setup Guide

## 🚀 Quick Setup with Neon Database

### 1. Database Setup (Neon)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project or use existing one
3. Copy your connection string from the dashboard
4. Create a `.env.local` file in the project root with:

```env
# Neon Database Connection
DATABASE_URL="postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_your_secret_key_here"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"

# ImageKit (Optional)
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="your_imagekit_public_key"
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_imagekit_id/"
IMAGEKIT_PRIVATE_KEY="your_imagekit_private_key"
```

### 2. Clerk Authentication Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Go to API Keys section
4. Copy your Secret Key and Publishable Key
5. Add them to your `.env.local` file

### 3. Database Migration & Seeding

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with sample data
npx prisma db seed
```

### 4. Create Admin User in Clerk

```bash
# Start the development server
npm run dev

# In another terminal, create admin user
curl -X POST http://localhost:3000/api/create-admin
```

### 5. Default Admin Login Credentials

- **Phone:** `+998901234567`
- **Password:** `admin123`

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and login with the admin credentials above.

## 🎯 What's Included

- **4 User Types:** Admin, Teacher, Student, Parent
- **Sample Data:** 4 admins, 15 teachers, 25 parents, 50 students
- **Default Password:** All users have password `admin123`
- **Phone-based Authentication:** Uses Uzbek phone number format

## 🔧 Troubleshooting

1. **"Couldn't find your account" error:** Make sure you've run the create-admin API endpoint
2. **Database connection error:** Verify your Neon DATABASE_URL in `.env.local`
3. **Clerk authentication error:** Check your Clerk API keys in `.env.local`

## 📁 Project Structure

```
full-stack-school/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Sample data
├── src/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── admin/        # Admin dashboard
│   │   ├── teacher/      # Teacher dashboard
│   │   ├── student/      # Student dashboard
│   │   └── parent/       # Parent dashboard
│   └── components/       # Reusable components
└── .env.local           # Environment variables (create this)
```
