/*
 * Public browser configuration template for SvS / SvSam.
 *
 * This file is intentionally safe to commit and serve. Every value in a
 * browser-delivered JavaScript file is public. Never put partner credentials,
 * private tokens, signing keys, webhook secrets, passwords, or private API
 * endpoints here. Copy only reviewed, non-secret settings into the deployed
 * public configuration.
 */
window.SVS_PUBLIC_CONFIG = Object.freeze({
  brandShortName: "SvS",
  brandFullName: "SvSam",
  siteOrigin: "https://svsam.com",
  apiBaseUrl: "https://api.svsam.com",

  // Keep features disabled until the corresponding partner agreement,
  // privacy review, server-side proxy, and production checks are complete.
  bookingSearchEnabled: false,
  partnerReferralLinksEnabled: false,
  analyticsEnabled: false,
  nonEssentialCookiesEnabled: false,

  // Public policy/contact URLs only. These may be relative paths.
  privacyNoticeUrl: "/privacy.html",
  cookieNoticeUrl: "/privacy.html#current-use",
  affiliateDisclosureUrl: "/affiliate-disclosure.html",
  supportUrl: "/privacy.html#rights",

  // UI metadata; this is not an access-control mechanism.
  environmentLabel: "production",
  configVersion: "1"
});
