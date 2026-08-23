const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

const getCookieOptions = (isProduction) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "none",
});

const setAuthCookies = (res, result, isProduction = false) => {
  const cookieOptions = getCookieOptions(isProduction);

  res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/auth",
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE);
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/auth" });
};

const withoutTokens = (result) => {
  const { accessToken, refreshToken, ...safeResult } = result;
  return safeResult;
};

export { setAuthCookies, clearAuthCookies, withoutTokens };
