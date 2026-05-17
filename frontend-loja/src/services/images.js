import { buildApiUrl } from "./api.js";

function flattenImageCandidates(product) {
  const images = Array.isArray(product?.images) ? product.images : [];
  const colorImages = Array.isArray(product?.colors)
    ? product.colors.flatMap((color) => (Array.isArray(color?.images) ? color.images : []))
    : [];

  return [
    product?.image,
    product?.image_url,
    ...images,
    ...colorImages
  ];
}

export function resolveImageUrl(url) {
  const value = String(url || "").trim();

  if (!value || value.startsWith("/src/")) {
    return "";
  }

  if (/^(https?:|data:image\/|blob:)/i.test(value)) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    return buildApiUrl(value);
  }

  if (value.startsWith("uploads/")) {
    return buildApiUrl(`/${value}`);
  }

  return value;
}

export function resolveProductImage(product, fallbackImage) {
  for (const candidate of flattenImageCandidates(product)) {
    const imageUrl = resolveImageUrl(candidate);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return fallbackImage;
}
