import brasil from "../../assets/bandeira_BRA.jpg";
import eua from "../../assets/bandeira_EUA.jpg";
import espanha from "../../assets/bandeira_ESP.png";
import { useLocale } from "../../hooks/useLocale.js";

const flags = { pt: brasil, en: eua, es: espanha };

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="language-switcher" aria-label="Selecionar idioma">
      {["pt", "en", "es"].map((option) => (
        <button
          className={`language-option ${locale === option ? "active" : ""}`}
          key={option}
          onClick={() => setLocale(option)}
          type="button"
        >
          <img src={flags[option]} alt={option.toUpperCase()} />
        </button>
      ))}
    </div>
  );
}
