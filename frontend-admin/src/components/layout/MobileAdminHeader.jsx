import logo from "../../assets/logo_bigsmoke_admin.jpg";
import { NotificationCenter } from "./NotificationCenter.jsx";

export function MobileAdminHeader() {
  return (
    <header className="mobile-admin-header">
      <div className="mobile-admin-brand">
        <img src={logo} alt="Big Smoke" />
        <div>
          <strong>BigSmoke</strong>
          <span>Painel Admin</span>
        </div>
      </div>
      <NotificationCenter variant="mobile" />
    </header>
  );
}
