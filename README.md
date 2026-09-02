# CivicNexus — Civic Innovation & Research Marketplace
*Smart India Hackathon 2026 Platform*

CivicNexus connects citizens reporting real civic infrastructure challenges with accredited universities, student engineering labs, faculty mentors, and corporate escrow sponsors.

---

## 🚀 1-Click Local Setup (Friend's Laptop / New Machine)

### Windows:
Simply double-click:
```cmd
setup.bat
```
*(Or in terminal: `npm run setup:local`)*

### Linux / macOS:
```bash
chmod +x setup.sh
./setup.sh
```

---

## 🛠️ What the Setup Script Automatically Does:
1. **Node.js Check**: Verifies Node.js 18+ is installed.
2. **Environment Setup**: Automatically creates `.env.local` with database connection string.
3. **SSL Certificates**: Verifies `localhost-key.pem` and `localhost.pem` for HTTPS WebRTC camera support.
4. **Dependencies**: Installs NPM packages cleanly with `--legacy-peer-deps`.
5. **Database Schema**: Applies all schema extensions and custom PostgreSQL enums to Neon database.
6. **Demo Ecosystem Seeder**: Seeds realistic citizen problems, R&D projects, faculty mentorship records, industry needs, and escrow ledgers.
7. **Type Verification**: Runs `npx tsc --noEmit` to guarantee 0 build errors.

---

## 🏃 Running the Application

### Start Development Server:
```bash
npm run dev
```
*(Or double-click `start.bat` / `./start.sh`)*

Open **https://localhost:3000** in your browser.

---

## 👥 Presentation Demo Accounts

All demo accounts have pre-seeded data and can be accessed with 1-click using the **Demo Presentation Accounts** buttons on the `/login` page:

| Persona | Name | Email | Role | Department / Affiliation | Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Citizen** | Aarti Verma | `demo.citizen@civicnexus.demo` | `CITIZEN` | Resident, South Delhi | `DemoPassword@2026` |
| **Student (CSE)** | Aarav Sharma | `demo.student.cse@civicnexus.demo` | `STUDENT` | IIT Delhi — B.Tech CSE (Year 4) | `DemoPassword@2026` |
| **Student (IoT)** | Priya Patel | `demo.student.iot@civicnexus.demo` | `STUDENT` | IIT Bombay — B.Tech IoT (Year 3) | `DemoPassword@2026` |
| **Faculty Mentor** | Dr. Rajesh Kulkarni | `demo.faculty@civicnexus.demo` | `FACULTY` | IIT Delhi — Computer Science & Urban Tech | `DemoPassword@2026` |
| **Industry Partner** | Vikram Malhotra | `demo.industry@civicnexus.demo` | `COMPANY_REP` | NexGen Urban Infrastructure Labs | `DemoPassword@2026` |
| **Administrator** | CivicNexus Admin | `demo.admin@civicnexus.demo` | `ADMIN` | National Civic Moderation Desk | `DemoPassword@2026` |

---

## 🔄 Re-seeding / Refreshing Demo Data

To reset or refresh the presentation dataset at any time without deleting your personal account:
```bash
npm run seed:demo
```
