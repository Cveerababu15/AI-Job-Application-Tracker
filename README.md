# AI-Powered Job Application Tracker (JobTracker AI)

![JobTracker AI Dashboard](frontend/src/Job%20Application.png)

## 📌 Project Overview
JobTracker AI is a comprehensive, full-stack web application designed to help job seekers safely organize their job hunt, track interview stages, and optimize their resumes. Using advanced heuristic algorithms, the application parses PDF resumes, compares them against pasted job descriptions, and delivers ATS-style keyword match scores and actionable suggestions.

## 🚀 Key Features
- **Job Pipeline Management:** Add, track, and update job applications across various stages (Applied, Interviewing, Offered, Rejected).
- **AI-Driven Resume Analysis:** Upload a PDF resume and a job description. The backend engine instantly parses the text and calculates a customized ATS-compatibility score.
- **Skill Gap & Feedback:** Extrapolates missing industry keywords and automatically suggests tailored changes to make your CV stand out.
- **Dashboard Analytics:** Visual overview summarizing total applications, recent activity, and pipeline metrics.
- **Dark/Light Mode UI:** Built with an aesthetically stunning, modern, and completely responsive glassmorphic UI.
- **Secure Authentication:** Complete JWT-based registration and secure login.

## 🛠️ Tech Stack
- **Frontend:** React 19, Tailwind CSS v4, React Router DOM, Vite
- **Backend:** Node.js, Express.js, JSON Web Tokens (JWT)
- **Database:** MongoDB
- **Key Libraries:** `pdf-parse` (for reading PDFs), `multer` (for secure file uploads), `axios`, `react-toastify`

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or MongoDB Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/Cveerababu15/AI-Job-Application-Tracker.git
cd AI-Job-Application-Tracker
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
```
Start the frontend server:
```bash
npm run dev
```

## 💡 How it Works (Resume AI)
The application utilizes the `pdf-parse` library to safely extract raw text buffers from uploaded resumes natively without relying on external APIs. It then leverages a heuristic algorithm running against a catalogue of tech industry keywords to identify matches and calculate critical keyword gaps between the job description and the resume.

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
