import {lazy,Suspense} from "react"
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

const Dashboard=lazy(()=>import("./pages/Dashboard.jsx"));
const Jobs=lazy(()=>import("./pages/Jobs.jsx"));
const AddJob =lazy(()=> import( "./pages/AddJob.jsx"));
const ResumeUpload = lazy(()=> import("./pages/ResumeUpload.jsx"));

function PageLoader(){
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent">

      </div>
    </div>
  )
}

function App() {
  return (
    <MainLayout>
      <Suspense fallback={<PageLoader/>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <Jobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-job"
          element={
            <ProtectedRoute>
              <AddJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <ResumeUpload />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Suspense>
    </MainLayout>
  );
}

export default App;
