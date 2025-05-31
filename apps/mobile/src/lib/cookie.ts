function parseCookie(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(",").map((cookie) => {
      const [key, value] = cookie.trim().split(";")[0].split("=");
      return [key, value];
    })
  );
}

export default parseCookie;
