export function TopTicker() {
  const items = ["Frete para todo o Brasil", "Pagamento via PIX", "Streetwear autoral BigSmoke", "Atendimento direto pelo WhatsApp"];
  return (
    <div className="top-ticker">
      <div className="ticker-track">
        {[...items, ...items].map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
      </div>
    </div>
  );
}
