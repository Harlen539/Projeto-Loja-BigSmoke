import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { LocaleProvider } from "./context/LocaleContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles/index.css";

const basename = window.location.pathname.startsWith("/loja") ? "/loja" : "/";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <LocaleProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </LocaleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
