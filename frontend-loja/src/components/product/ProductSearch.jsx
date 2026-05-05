export function ProductSearch({ value, onChange }) {
  return (
    <input
      className="product-search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Buscar produto"
      type="search"
    />
  );
}
