import instagram from "../../assets/instagram_logo.png";
import whatsapp from "../../assets/Whatsapp_logo.png";

export function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div>
        <strong>BigSmoke</strong>
        <p>Streetwear autoral com checkout seguro e atendimento direto.</p>
      </div>
      <div className="footer-social">
        <a href="https://instagram.com" target="_blank" rel="noreferrer"><img src={instagram} alt="Instagram" /></a>
        <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "5583986494691"}`} target="_blank" rel="noreferrer"><img src={whatsapp} alt="WhatsApp" /></a>
      </div>
    </footer>
  );
}
