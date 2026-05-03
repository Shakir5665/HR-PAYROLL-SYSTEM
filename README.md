# HR-Pay-Nexus

A full-stack Human Resources & Payroll Management System with Sri Lankan statutory compliance (EPF/ETF).

## 🚀 Tech Stack

- **Backend**: .NET 8 (ASP.NET Core Web API)
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Database**: PostgreSQL (Neon.tech recommended)
- **Authentication**: JWT with Refresh Tokens & RBAC
- **PDF Generation**: QuestPDF
- **Caching**: Redis

## 🛠️ Local Setup

### 1. Backend
- Navigate to `backend/`
- Update `HRPayNexus.API/appsettings.json` (Currently configured with your Neon PostgreSQL).
- Run migrations or let `DbInitializer` create the schema on startup.
- Run the API:
  ```bash
  dotnet run --project HRPayNexus.API/HRPayNexus.API.csproj
  ```

### 2. Frontend
- Navigate to `frontend/`
- Create a `.env` file based on `.env.example`.
- Install dependencies and start:
  ```bash
  npm install
  npm run dev
  ```

## 🔐 Default Credentials
- **Admin**: `admin@hrpaynexus.com` / `Admin@123`
- **HR**: `hr@hrpaynexus.com` / `HR@123`
- **Finance**: `finance@hrpaynexus.com` / `Finance@123`

## 🌍 Deployment

### 1. Backend (Render)
- Use **Docker** environment.
- Root: `backend/`
- Set `ConnectionStrings__DefaultConnection` and `Jwt__Key` in Render Dashboard.

### 2. Frontend (Vercel)
- Framework: **Vite**.
- Root: `frontend/`
- Set `VITE_API_URL` to your Render service URL.

For a detailed step-by-step walkthrough, refer to [Deployment Guide](file:///C:/Users/shaki/.gemini/antigravity/brain/5252c786-9796-4e02-9635-51038cb6dcfe/deployment_guide.md).

---

## 📄 License
MIT License. Created by Antigravity.

## 📊 Core Features
- **Employee Lifecycle**: CRUD, Role hierarchy.
- **Payroll Engine**: Automated calculations for Gross, Net, EPF (8%/12%), ETF (3%).
- **Leave Management**: Request/Approval workflow with balance tracking.
- **Role-Based Access**: Admin, HR, Finance, Manager, Employee roles.
- **Digital Payslips**: Professional PDF generation and download.

## ☁️ Deployment

### Backend (Render)
- Connect GitHub repo.
- Root directory: `backend`
- Build Command: `dotnet restore && dotnet publish -c Release`
- Start Command: `dotnet HRPayNexus.API/bin/Release/net8.0/publish/HRPayNexus.API.dll` (or use Dockerfile)

### Frontend (Vercel)
- Connect GitHub repo.
- Root directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: `VITE_API_URL`

## 🧪 Testing Payroll Logic
Unit tests are located in `HRPayNexus.Tests` (Note: Add a test project if needed).
Statutory logic is in `HRPayNexus.Application/Services/PayrollService.cs`.

Email: admin@hrpaynexus.com
Password: Admin@123