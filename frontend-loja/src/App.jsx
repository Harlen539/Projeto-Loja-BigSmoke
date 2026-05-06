import { Route, Routes } from "react-router-dom";

import { CartDrawer } from "./components/cart/CartDrawer.jsx";
import { Footer } from "./components/layout/Footer.jsx";
import { Navbar } from "./components/layout/Navbar.jsx";
import { TopTicker } from "./components/layout/TopTicker.jsx";
import { Home } from "./pages/Home.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { Pedidos } from "./pages/Pedidos.jsx";
import { Perfil } from "./pages/Perfil.jsx";
import { Politica } from "./pages/Politica.jsx";
import { Produto } from "./pages/Produto.jsx";

export default function App() {
  return (
    <>
      <TopTicker />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produto" element={<Produto />} />
        <Route path="/produto/:id" element={<Produto />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/politica" element={<Politica />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <CartDrawer />
    </>
  );
}
