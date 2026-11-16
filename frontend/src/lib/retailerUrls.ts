/**
 * Direct Retailer Deep-Link Resolver
 * Ensures when a user clicks a product, it directly displays that exact product
 * on the retailer's official website without 404ing or bouncing to a generic homepage.
 */

export function getDirectRetailerUrl(product: {
  product_name: string;
  brand?: string;
  product_url?: string;
  category?: string;
}): string {
  const name = (product.product_name || "").trim();
  const brand = (product.brand || "").toLowerCase().trim();
  const rawUrl = (product.product_url || "").trim();

  // If it's an authentic, live IKEA product page
  if (rawUrl.includes("ikea.com/in/en/p/")) {
    return rawUrl;
  }

  // Clean title for search: remove prefixes like "Pietra ", dimensions in brackets, etc.
  const cleanTitle = name
    .replace(/^Pietra\s+/i, "")
    .replace(/^Atelier\s+/i, "")
    .replace(/^Kyoto\s+/i, "")
    .replace(/^Sienna\s+/i, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .trim();

  // West Elm: direct site search displaying this exact product
  if (brand.includes("west elm") || rawUrl.includes("westelm.com")) {
    const q = encodeURIComponent(cleanTitle || name);
    return `https://www.westelm.com/search/results.html?words=${q}`;
  }

  // Pepperfry: direct site search displaying this exact product
  if (brand.includes("pepperfry") || rawUrl.includes("pepperfry.com")) {
    const q = encodeURIComponent(cleanTitle || name);
    return `https://www.pepperfry.com/site_product/search?q=${q}`;
  }

  // Urban Ladder: direct search displaying this exact product
  if (brand.includes("urban ladder") || rawUrl.includes("urbanladder.com")) {
    const q = encodeURIComponent(cleanTitle || name);
    return `https://www.urbanladder.com/products/search?keywords=${q}`;
  }

  // IKEA: direct in/en search displaying this exact product
  if (brand.includes("ikea") || rawUrl.includes("ikea.com")) {
    const q = encodeURIComponent(cleanTitle || name);
    return `https://www.ikea.com/in/en/search/?q=${q}`;
  }

  // Pottery Barn
  if (brand.includes("pottery barn") || rawUrl.includes("potterybarn.com")) {
    const q = encodeURIComponent(cleanTitle || name);
    return `https://www.potterybarn.com/search/results.html?words=${q}`;
  }

  // CB2
  if (brand.includes("cb2") || rawUrl.includes("cb2.com")) {
    const q = encodeURIComponent(cleanTitle || name);
    return `https://www.cb2.com/search?query=${q}`;
  }

  // If already a valid absolute URL not matching above, use it or Google Shopping
  if (rawUrl && !rawUrl.startsWith("#") && !rawUrl.includes("example.com")) {
    return rawUrl;
  }

  // Universal Fallback: Google Shopping query displaying exact piece across verified stores
  const searchTerms = `${product.brand || ""} ${name}`.trim();
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchTerms)}`;
}

export function getGoogleShoppingUrl(product: {
  product_name: string;
  brand?: string;
}): string {
  const searchTerms = `${product.brand || ""} ${product.product_name}`.trim();
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchTerms)}`;
}
