import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardStream from "./pages/DashboardStream";
import { AuthProvider, ProtectedRoute } from "./components/AuthProvider";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen w-full bg-[#0a0a0a]">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardStream />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App;
