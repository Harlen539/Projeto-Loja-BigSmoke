export function useShipping(subtotal = 0) {
  return {
    shipping: subtotal > 0 ? 0 : 0,
    label: "Frete calculado no checkout"
  };
}
