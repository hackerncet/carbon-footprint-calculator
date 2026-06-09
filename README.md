# EcoCoach

### Empowering individuals to calculate, reduce, and offset emissions with precision.

**EcoCoach** is a carbon tracking, analytics, and gamification platform built as a React + Vite frontend, an Express + SQLite backend, and a shared TypeScript package for validation and domain types. Users can log footprint entries, review dashboard metrics, set monthly carbon budgets, earn gamification points and badges, and spend points in a simulated offset marketplace.

---

## 🚀 Live Demo & Status
* **Live**: `https://carbon-footprint-calculator-1-20xh.onrender.com/`

---

## ⚠️ Problem Statement
Carbon dioxide and greenhouse gas emissions are driving climate change, yet the average individual has no visibility into how their daily actions - commuting, eating, disposing of waste, or heating their homes - affect their personal carbon footprint. Traditional calculators are either overly simplistic, static, or fail to provide incentives for behavioral change. Without accessible, real-time feedback loops and gamified structures, individuals struggle to understand their impact or take steps toward net-zero targets.

---

## 💡 Solution
EcoCoach solves this by offering a responsive dashboard that tracks, validates, and aggregates carbon emissions. By converting logged footprint entries into points, streaks, and achievements, it incentivizes green habits. Users can set custom reduction goals and immediately purchase simulated offsets with their earned points, fostering an engaging ecosystem that turns climate awareness into daily action.

---

## 🌟 Key Features

### 🧮 Carbon Footprint Calculator
* **Purpose**: Allows users to log emissions across four sectors: Energy, Transport, Food, and Waste.
* **User Benefit**: Tracks personal impact using practical metrics like kWh, km, and kg.
* **Technical Summary**: Requests are validated with shared Zod schemas, and calculations are computed on the Express backend using shared emission factors and unit mappings in `shared/src/constants.ts`.

### 📊 Smart Sustainability Dashboard
* **Purpose**: Aggregates monthly emissions, active streaks, points, goals, and category breakdowns.
* **User Benefit**: Gives an immediate overview of emissions patterns and progress.
* **Technical Summary**: Built with `Recharts` charts and backed by accessible HTML summary tables for screen reader users.

### 🎯 Personalized Carbon Reduction Goals
* **Purpose**: Set monthly targets in kg CO2e per emission category.
* **User Benefit**: Provides actionable budgets that show whether usage is on track.
* **Technical Summary**: Managed through `/api/user/goals` routes backed by the `user_goals` SQLite table.

### 🏆 Gamification & Achievement System
* **Purpose**: Auto-allocates points and logs daily tracking streaks.
* **User Benefit**: Rewards sustainable behavior through unlocked milestones.
* **Technical Summary**: Uses the streak and badge logic in `server/src/utils/gamification.ts` to award points, challenges, and achievements.

### 🍃 Carbon Offset Marketplace
* **Purpose**: Exchange earned points to support simulated offset initiatives.
* **User Benefit**: Offset unavoidable emissions while learning about project types such as forestry, renewables, and community projects.
* **Technical Summary**: Purchase flows are wrapped in SQLite transactions to prevent double-spending and keep points consistent.

---

## 🛠️ Technology Stack

### Frontend
* **React 19 & TypeScript**: Provides type-safe user interfaces.
* **Vite**: Handles hot reloading and code splitting.
* **Recharts**: Renders the dashboard charts.
* **Lucide React**: Supplies the icon set used across the UI.
* **CSS Variables**: Drives the light and dark theme system in `client/src/index.css`.

### Backend
* **Node.js & Express**: Serves the REST API and production static files.
* **Zod**: Validates incoming request payloads.
* **Winston**: Writes structured application logs.
* **Helmet, CORS, and rate limiting**: Add baseline HTTP security controls.

### Database
* **SQLite (Better-SQLite3)**: Relational database used by default.
* **Drizzle ORM**: Type-safe query builder running in WAL mode.

---

## 🔥 Firebase Setup Guide

To configure authentication for EcoCoach using Firebase:

### 1. Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and give it a name.
3. Click **Continue** and create the project.

### 2. Register a Web App
1. In the project dashboard, click the **Web** icon (`</>`).
2. Enter an app nickname and register the app.
3. Copy the web configuration values for your environment variables.

### 3. Enable Authentication Providers
1. Go to **Build > Authentication** and click **Get Started**.
2. Under **Sign-in method**:
	* **Email/Password**: Enable it and save.
	* **Google Sign-In**: Enable it and save.

### 4. Create Backend Credentials
1. Open **Project settings** in the Firebase Console.
2. Go to the **Service accounts** tab.
3. Generate a private key for the backend.
4. Save the values as:
	* `project_id` -> `FIREBASE_PROJECT_ID`
	* `client_email` -> `FIREBASE_CLIENT_EMAIL`
	* `private_key` -> `FIREBASE_PRIVATE_KEY` (preserve newline characters)

### 5. Local Environment Variables
Use the provided `.env.example` files as a starting point.

Server:

```bash
PORT=3000
NODE_ENV=development
DATABASE_URL=file:./app.db
```

Client:

```bash
VITE_API_URL=/api
```

---

## 🚀 Render Deployment Guide

EcoCoach is built as a workspace monorepo. In production, the Express backend builds and serves the frontend statically, so the app can run inside a single Render Web Service.

### 1. Deploy on Render
1. Push the code to GitHub.
2. Log into the [Render Dashboard](https://render.com/).
3. Click **New > Web Service**.
4. Connect the repository.
5. Use these settings:
	* **Language**: `Node`
	* **Build Command**: `npm install && npm run build`
	* **Start Command**: `npm --workspace=server start`
	* **Instance Type**: `Free` or paid, depending on your deployment target
6. Add environment variables:
	* `NODE_ENV=production`
	* `PORT=3000`
	* `DATABASE_URL=file:./app.db`
	* `CLIENT_ORIGIN=https://carbonfootprintcalculator.me`
	* `VITE_FIREBASE_API_KEY`
	* `VITE_FIREBASE_AUTH_DOMAIN`
	* `VITE_FIREBASE_PROJECT_ID`
	* `VITE_FIREBASE_APP_ID`
	* `FIREBASE_PROJECT_ID`
	* `FIREBASE_CLIENT_EMAIL`
	* `FIREBASE_PRIVATE_KEY`
7. Set the health check path to `/api/health`.

### 2. Authorize the Domain in Firebase Auth
After Render generates your app URL:
1. Open **Authentication > Settings** in Firebase.
2. Add your Render domain under **Authorized domains**.

---

## ♿ Accessibility Compliance (WCAG 2.1)
* **Keyboard Navigation**: The app includes a skip link, visible focus states, and tab-friendly form controls.
* **Screen Reader Support**: Charts are backed by hidden HTML tables so key values are still available to assistive technology.
* **Semantic Structure**: The UI uses landmarks like `nav` and `main`, plus labeled forms and live regions for status updates.
* **Responsive Layout**: The navigation and content grid adapt to smaller screens.

---

## 🔒 Security Architecture
1. **Authentication**: Uses Firebase Authentication on the client and verifies ID tokens on the backend with the Firebase Admin SDK.
2. **Input Validation**: Enforces request shapes with shared Zod schemas before database writes.
3. **CORS Hardening**: Restricts origins through an explicit allow-list and same-host check.
4. **Helmet CSP**: Applies security headers, including Content Security Policy, HSTS, and clickjacking protection.
5. **API Rate Limiting**: Limits API requests to `100 requests per 15 minutes` per IP address.
6. **Development Fallbacks**: Local mock auth and developer bypass headers exist for non-production use and should stay disabled in production.

---

## 🧪 Automated Testing
Run the automated test suite locally:

```bash
npm run test
```

The repository includes Vitest tests for calculator logic, Zod validation, API routes, and selected client utilities.

---

## 📄 License
This project is licensed under the MIT License.
