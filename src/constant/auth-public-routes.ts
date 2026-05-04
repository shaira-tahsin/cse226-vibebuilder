export const publicRoutes = [
  '/login',
  '/signup',
  '/sso-signup',
  '/sent-email',
  '/activate',
  '/resetpassword',
  '/success',
  '/activate-failed',
  '/forgot-password',
  '/verify-mfa',
  '/sso/:provider/callback',
  '/oidc',
];

// Dynamic public route prefixes — any path starting with these is public
export const publicRoutePrefixes = ['/site/'];
