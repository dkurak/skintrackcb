/**
 * Generate a URL-friendly slug from a title
 * @param title - The title to slugify
 * @returns A lowercase, hyphenated slug
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 50); // Limit length
}

/**
 * Generate a full slug with short ID suffix
 * Format: "title-slug-shortid" (e.g., "morning-gothic-tour-9e2dd17c")
 * @param title - The title to slugify
 * @param id - The full UUID
 * @returns The full slug with ID suffix
 */
export function generateTripSlug(title: string, id: string): string {
  const slug = slugify(title);
  const shortId = id.split('-')[0]; // First segment of UUID (8 chars)
  return `${slug}-${shortId}`;
}

/**
 * Parse a trip URL parameter to extract the ID
 * Supports both formats:
 * - Full UUID: "9e2dd17c-196d-4554-ba6e-db8bd2ca595f"
 * - Slug with short ID: "morning-gothic-tour-9e2dd17c"
 * @param param - The URL parameter
 * @returns The short ID (first 8 chars of UUID) or full UUID
 */
export function parseSlugOrId(param: string): string {
  // If it's a full UUID (contains multiple hyphens in UUID pattern)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(param)) {
    return param;
  }

  // Otherwise, extract the last segment (short ID) from slug
  const parts = param.split('-');
  const shortId = parts[parts.length - 1];

  // Validate it looks like a short ID (8 hex chars)
  if (/^[0-9a-f]{8}$/i.test(shortId)) {
    return shortId;
  }

  // Fallback: return the whole param (might be just an ID)
  return param;
}

/**
 * Get the URL path for a trip
 * Uses slug if available, otherwise falls back to ID
 * @param trip - Object with id and optionally slug
 * @returns The URL path (e.g., "/trips/morning-gothic-tour-9e2dd17c")
 */
export function getTripPath(trip: { id: string; slug?: string | null; title?: string }): string {
  // If slug exists, use it
  if (trip.slug) {
    return `/trips/${trip.slug}`;
  }

  // If we have a title but no slug, generate one on the fly
  if (trip.title) {
    const slug = generateTripSlug(trip.title, trip.id);
    return `/trips/${slug}`;
  }

  // Fallback to ID
  return `/trips/${trip.id}`;
}
