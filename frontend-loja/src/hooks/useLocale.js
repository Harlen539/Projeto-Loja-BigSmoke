import { useContext } from "react";

import { LocaleContext } from "../context/LocaleContext.jsx";

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale precisa estar dentro de LocaleProvider.");
  }
  return value;
}
