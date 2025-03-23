import { getCookie } from "cookies-next";

export async function getCookieServer() {
  const token = getCookie("session")
  return token || null;
}
