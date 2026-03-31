import { env } from "./env.js";
import { getExpiryDate } from "../utils/date.util.js";

// set refresh token cookie:
export const getRefreshCookieConfig = () => ({
  httpOnly: env.COOKIE.HTTP_ONLY,
  sameSite: env.COOKIE.SAME_SITE,
  secure: env.COOKIE.SECURE,
  maxAge: getExpiryDate(env.JWT.REFRESH_EXPIRE)
});

// clear refresh token cookie:
export const getClearCookieConfig = () => ({
  httpOnly: env.COOKIE.HTTP_ONLY,
  sameSite: env.COOKIE.SAME_SITE,
  secure: env.COOKIE.SECURE,
});