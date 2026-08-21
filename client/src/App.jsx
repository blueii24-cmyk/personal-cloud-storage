import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import DrivePage from "./pages/DrivePage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/drive"
            element={
              <ProtectedRoute>
                <DrivePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drive/:folderId"
            element={
              <ProtectedRoute>
                <DrivePage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/drive" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
