import ms from "ms";

export function getExpiryDate(duration) {
  return new Date(Date.now() + ms(duration));
}