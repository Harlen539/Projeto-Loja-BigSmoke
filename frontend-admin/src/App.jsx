import { Navigate, Route, Routes } from "react-router-dom";

import { Sidebar } from "./components/layout/Sidebar.jsx";
import { Topbar } from "./components/layout/Topbar.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { Charts } from "./pages/Charts.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Login } from "./pages/Login.jsx";
import { Orders } from "./pages/Orders.jsx";
import { Products } from "./pages/Products.jsx";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate replace to="/login" />;
}

function Shell({ children }) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Topbar />
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Shell><Dashboard /></Shell></PrivateRoute>} />
      <Route path="/produtos" element={<PrivateRoute><Shell><Products /></Shell></PrivateRoute>} />
      <Route path="/pedidos" element={<PrivateRoute><Shell><Orders /></Shell></PrivateRoute>} />
      <Route path="/graficos" element={<PrivateRoute><Shell><Charts /></Shell></PrivateRoute>} />
    </Routes>
  );
}
