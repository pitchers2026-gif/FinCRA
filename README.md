<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1i5Qh615H7HCtlX3bC0-g8Wr4lp4S6cKQ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## CRA Backend API (optional)

The CRA (Compliance Risk Assessment) engine can run as a backend API with scorecard lookups and full override conditions (industry_cbd, shell_company, adult_entertainment).

1. Install server dependencies: `cd server && npm install`
2. Start the API: `npm run server` (or `cd server && npm run start`)
3. API runs at `http://localhost:3233`. Vite proxies `/api` to it when the dev server is running.
4. **POST /api/cra/calculate** — body: `{ input: CRAInput, config?: CRAEngineConfig }`, returns `CRAOutput`.
5. On the Simulations page, check "Use backend API" to run batch scoring via the API (falls back to local calculator if the API is unavailable).

## When is the CRA API called?

The CRA engine API is called **only** when all of the following are true:

- The backend is running (`npm run server` or `npm run dev:all`).
- You are on the **Simulations** page.
- You have selected a rule, entered or pasted JSON input (CRA records).
- You have checked **"Use backend API (scorecards + full conditions)"**.
- You click **"RUN BATCH"**.

Then the frontend sends one **POST /api/cra/calculate** per record (with your CRA config). If the API is unreachable, the app falls back to the local calculator and still shows results.

## Testing end-to-end

1. **Start both frontend and backend**
   ```bash
   npm run dev:all
   ```
   - Frontend: http://localhost:3232  
   - API: http://localhost:3233  

2. **Open the app**  
   Go to http://localhost:3232 and open **Simulations** from the nav.

3. **Select a rule**  
   Choose any rule from the "Rule Selection" dropdown (e.g. an FCA template or a saved rule).

4. **Load sample data**  
   Click **"Generate sample data"** (or paste your own CRA input JSON).

5. **Turn on the backend API**  
   Check **"Use backend API (scorecards + full conditions)"**.  
   - You should see **"Backend API: reachable"** in green if the server is up.  
   - If you see **"Backend API: unreachable"**, start the backend (`npm run server` or `npm run dev:all`) and refresh.

6. **Run the batch**  
   Click **"RUN BATCH"**.  
   - With the API on: each record is scored via **POST /api/cra/calculate** (scorecards + full conditions).  
   - With the API off or unreachable: scoring uses the local calculator.

7. **Confirm API usage**  
   - **Browser:** DevTools → Network → filter by "calculate" or "cra" and confirm **POST** requests to `/api/cra/calculate`.  
   - **Terminal:** In the terminal where the API is running, you should see incoming requests when you run a batch with "Use backend API" checked.
