import { Navigate, Route, Routes } from "react-router-dom";

import { BottomAdminNav } from "./components/layout/BottomAdminNav.jsx";
import { MobileAdminHeader } from "./components/layout/MobileAdminHeader.jsx";
import { Sidebar } from "./components/layout/Sidebar.jsx";
import { Topbar } from "./components/layout/Topbar.jsx";
import { AdminNotificationsProvider } from "./context/NotificationsContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { Customers } from "./pages/Customers.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Login } from "./pages/Login.jsx";
import { Orders } from "./pages/Orders.jsx";
import { Products } from "./pages/Products.jsx";
import { Settings } from "./pages/Settings.jsx";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate replace to="/login" />;
}

function Shell({ children }) {
  return (
    <AdminNotificationsProvider>
      <div className="admin-shell">
        <Sidebar />
        <div className="admin-main">
          <MobileAdminHeader />
          <Topbar />
          {children}
          <BottomAdminNav />
        </div>
      </div>
    </AdminNotificationsProvider>
  );
}

function NotFound() {
  return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <p style={{ fontSize: "3rem", opacity: 0.15, fontWeight: 700 }}>404</p>
      <h2>Página não encontrada</h2>
      <a href="/">Voltar ao dashboard</a>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Shell>
              <Dashboard />
            </Shell>
          </PrivateRoute>
        }
      />
      <Route
        path="/produtos"
        element={
          <PrivateRoute>
            <Shell>
              <Products />
            </Shell>
          </PrivateRoute>
        }
      />
      <Route
        path="/pedidos"
        element={
          <PrivateRoute>
            <Shell>
              <Orders />
            </Shell>
          </PrivateRoute>
        }
      />
      <Route
        path="/graficos"
        element={<Navigate replace to="/" />}
      />
      <Route
        path="/clientes"
        element={
          <PrivateRoute>
            <Shell>
              <Customers />
            </Shell>
          </PrivateRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <PrivateRoute>
            <Shell>
              <Settings />
            </Shell>
          </PrivateRoute>
        }
      />
      <Route
        path="*"
        element={
          <PrivateRoute>
            <Shell>
              <NotFound />
            </Shell>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
