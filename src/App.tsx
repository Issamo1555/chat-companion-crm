import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { socketService } from "@/services/socket";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Conversations from "@/pages/Conversations";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Reminders from "@/pages/Reminders";
import Team from "@/pages/Team";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ActivityLogs from "@/pages/ActivityLogs";
import Users from "@/pages/Users";

const queryClient = new QueryClient();

const App = () => {
  // Socket connection moved to ProtectedRoute/Layout to handle auth

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/conversations" element={<Conversations />} />
                      <Route path="/clients" element={<Clients />} />
                      <Route path="/clients/:id" element={<ClientDetail />} />
                      <Route path="/rappels" element={<Reminders />} />
                      <Route path="/team" element={<Team />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/logs" element={<ActivityLogs />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
