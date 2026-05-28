# Guide: DeepSeek (OpenRouter) Resume Analysis Flow

This guide explains how **resume vs job description** analysis works end-to-end in this project, including where the DeepSeek/OpenRouter API key is used and how the UI renders the results.

---

## 1) Backend: What happens when a user clicks “Compare resume to job”

### Route

- **Endpoint**: `POST /api/ai/analyze`
- **File**: `backend/routes/aiRoutes.js`
- **Middleware chain**:
  - `authMiddleware` → verifies JWT (Bearer token)
  - `upload.single("resume")` → parses `multipart/form-data` and stores the PDF temporarily
  - `aiController.analyzeResume` → parses PDF text + calls the AI service

### Controller

**File**: `backend/controllers/aiController.js`

Flow:
1. Reads `jobDescription` from request body.
2. Reads `resumeText` from body OR (if file provided) parses PDF using `pdf-parse`.
3. Calls `analyzeAI(resumeText, jobDescription)` from `backend/services/aiService.js`.
4. Saves result into MongoDB as a `ResumeAnalysis` document.
5. Always deletes the uploaded PDF file in the `finally` block (storage cleanup).

---

## 2) Backend: AI service (DeepSeek/OpenRouter + fallback)

**File**: `backend/services/aiService.js`

The service is designed to be reliable and fast:

- If `OPENROUTER_API_KEY` exists, it calls OpenRouter with:
  - **Model**: `deepseek/deepseek-v4-flash` (or `OPENROUTER_MODEL`)
  - **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
  - **Timeout**: ~20s (AbortController)
  - **Response contract**: JSON only with keys:
    - `atsScore` (0–100)
    - `summary`
    - `missingSkills`
    - `skillsToAdd`
    - `suggestions`
    - `keyChanges`

- If the OpenRouter call fails (network, key missing, bad JSON), the service **falls back** to a lightweight heuristic matcher so the API still returns a valid analysis and your app never “breaks”.

### Why the app feels faster now

- Large resume/JD text is sliced before sending to the AI provider (smaller payload → lower latency).
- Fallback is constant-time keyword matching.

---

## 3) Frontend: How the UI calls the backend

### Axios instance + token attachment

**File**: `frontend/src/services/api.js`

- Reads `token` from `localStorage`
- Adds `Authorization: Bearer <token>` to every request
- Uses `VITE_API_URL` as the base URL (and auto-appends `/api`)

### Resume Upload page

**File**: `frontend/src/pages/ResumeUpload.jsx`

Flow:
1. User pastes job description.
2. User uploads a PDF resume.
3. The page builds `FormData`:
   - `resume` → the PDF file
   - `jobDescription` → trimmed text
4. Sends:
   - `API.post("/ai/analyze", formData)`
5. Renders:
   - Score (`atsScore`)
   - Summary (now asked to explain “why this score”)
   - Skills to add / missing skills
   - “Changes to make on your resume” (bullet list formatting for clarity)
   - Suggestions

---

## 4) Environment variables you must set (Backend)

Create/update `backend/.env`:

```env
PORT=5000
MONGO_URL=your_mongo_connection_string
JWT_SECRET=your_secret

# DeepSeek via OpenRouter
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=deepseek/deepseek-v4-flash

# Optional performance tuning (8–14 recommended)
BCRYPT_SALT_ROUNDS=10
```

Frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 5) Result fields meaning (what users see)

- **atsScore**: A 0–100 score estimating how well the resume matches the JD by skills/keywords and evidence.
- **summary**: Human-readable explanation of the score (why it is high/medium/low).
- **missingSkills**: Skills/requirements that appear in the JD but are not clearly present in the resume text.
- **skillsToAdd**: The most important missing items to add/emphasize first.
- **keyChanges**: Concrete, step-by-step improvements (displayed as bullets on the UI).
- **suggestions**: Additional advice for structure and wording.

---

## 6) Quick troubleshooting

- **401 Unauthorized**: token missing/expired → log in again; check `localStorage.token`.
- **AI returns fallback**: check `OPENROUTER_API_KEY` is set and backend restarted.
- **Slow responses**: reduce PDF size, shorten JD text, confirm network connectivity.

