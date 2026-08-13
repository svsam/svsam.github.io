# Future SvS consumer travel API boundary

This directory documents a future server-side proxy for consumer accommodation search and partner referrals. It is a contract, not a deployed API. No credential, partner entitlement, booking integration, or production endpoint is included.

The GitHub Pages site at `https://svsam.com` is public and static. Credentialed partner requests must originate from a separately hosted backend such as `https://api.svsam.com`; they must never originate directly from browser JavaScript.

## Permitted first implementation

The first implementation should support search and referral only:

- accept a minimal, structured accommodation search;
- query only providers for which SvS has a current written API or affiliate agreement;
- normalise and label results without changing the provider's material terms;
- generate or pass through an agreement-compliant provider deep link;
- send the visitor to the provider to book, pay, amend, cancel, and obtain booking support.

On-site reservations, card handling, stored traveller profiles, booking modification, cancellation, refunds, loyalty accounts, guest-to-property messaging, identity documents, and emergency support are not part of this contract.

## Proposed public interface

All endpoints use HTTPS and JSON. Version every route from the beginning.

### `GET /v1/health`

Returns service availability without environment, dependency, credential, build-path, or stack details.

```json
{
  "status": "ok",
  "version": "v1"
}
```

### `GET /v1/providers`

Returns only providers currently enabled by contract and operational approval.

```json
{
  "providers": [
    {
      "id": "example-provider",
      "displayName": "Example provider",
      "bookingMode": "external_referral",
      "disclosureRequired": true
    }
  ]
}
```

The example is illustrative and does not assert a relationship with any real platform.

### `POST /v1/accommodation/search`

Example request:

```json
{
  "destination": "York, UK",
  "checkIn": "2026-09-10",
  "checkOut": "2026-09-12",
  "adults": 2,
  "children": 0,
  "rooms": 1,
  "currency": "GBP"
}
```

The server must reject free-form HTML, unknown fields, invalid dates, unreasonable date ranges, unsupported currencies, and party sizes outside documented bounds. It should not accept names, emails, telephone numbers, payment data, passport/identity data, accessibility or health information, or booking references.

Example response shape:

```json
{
  "searchId": "opaque-short-lived-id",
  "retrievedAt": "2026-08-06T12:00:00Z",
  "currency": "GBP",
  "offers": [
    {
      "offerId": "opaque-offer-id",
      "providerId": "example-provider",
      "propertyName": "Example accommodation",
      "areaLabel": "Central York",
      "price": {
        "amount": "240.00",
        "currency": "GBP",
        "basis": "total",
        "taxesAndFeesStatus": "provider_supplied"
      },
      "bookingMode": "external_referral",
      "expiresAt": "2026-08-06T12:10:00Z",
      "redirectPath": "/v1/referrals/opaque-offer-id"
    }
  ],
  "notices": [
    "Price and availability must be confirmed on the provider website."
  ]
}
```

Return decimal money as strings, always pair it with a currency, identify whether taxes/fees are included, and preserve partner-required attribution and disclaimers. Do not return raw upstream payloads, partner credentials, internal scores, debug objects, or unrestricted HTML.

### `GET /v1/referrals/{offerId}`

Validates a short-lived opaque offer identifier, records only the approved minimal referral event, and returns an HTTP redirect to an agreement-compliant provider URL. It must prevent open redirects by resolving destinations from trusted server-side data rather than accepting a visitor-supplied URL.

Affiliate redirects must be clearly disclosed in the website UI. Use link semantics such as `rel="sponsored noopener noreferrer"` where applicable.

## Standard errors

Use stable public codes and generic messages. Do not expose upstream bodies or stack traces.

```json
{
  "error": {
    "code": "INVALID_SEARCH",
    "message": "Check the search details and try again.",
    "requestId": "opaque-support-id"
  }
}
```

Expected statuses include `400` invalid input, `404` unknown/expired offer, `429` rate limit, `502` approved provider unavailable, and `503` service unavailable. Avoid revealing whether a credential, account, quota, or named internal dependency failed.

## Security invariants

- Partner keys, OAuth secrets, signing material, and full provider responses exist only server-side.
- The browser uses no shared API key; a key embedded in the site would be public.
- Allow CORS only for exact reviewed origins, while recognising that CORS does not prevent non-browser abuse.
- Apply IP/session rate limits, request/body limits, timeouts, bounded retries, provider circuit breakers, and bot controls.
- Validate against an explicit schema and encode all returned text before rendering it in the site.
- Build redirect URLs from server-held provider configuration and allowlisted hosts.
- Never log authorization headers, cookies, precise full URLs containing partner tokens, raw upstream payloads, or unnecessary search fields.
- Use short-lived opaque identifiers; do not encode traveller or secret data into identifiers.
- Keep production and development credentials separate and store them in the backend platform's secret manager.
- Restrict outbound network access to contracted provider endpoints where the host supports it.
- Maintain provider kill switches and a global search/referral kill switch independent of client-side flags.
- Return restrictive security headers from the API and prevent caching of error or user-correlated responses.

Potential server secret names may be documented in a private deployment system, for example `PARTNER_API_KEY` and `PARTNER_WEBHOOK_SECRET`, but their values must never be stored here, in `.env` files committed to Git, in GitHub Pages configuration, or in browser output.

## Privacy and retention contract

The API owner must approve a data-flow record before launch covering browser data, proxy logs, each provider, hosting/subprocessors, international transfers, purposes, lawful basis, retention, deletion, access controls, and incident response.

Default posture:

- no account and no persistent search history;
- no third-party advertising or analytics identifier;
- cache provider results only as permitted by contract and without user identifiers;
- retain security logs for a documented, proportionate period with search fields removed or minimised;
- keep referral reporting aggregate unless provider terms require an approved pseudonymous identifier;
- do not use search or referral data for unrelated marketing or AI training.

## Partner adapter boundary

Each provider integration should implement an internal adapter rather than leak provider-specific fields into the public interface:

```text
validatePublicSearch(input)
  -> providerAdapter.search(normalisedInput)
  -> normaliseOffers(providerResponse)
  -> enforceDisclosureAndFreshnessRules(offers)
  -> publicResponse
```

Each adapter needs a recorded agreement owner, permitted markets, attribution rules, trademark/content licences, cache limits, rate limits, price/tax requirements, deep-link construction rules, support/escalation route, data-processing position, and a tested disable switch. Airbnb, Booking.com, and similar names must remain examples only until the relevant written approval exists.

## Deployment separation

The API runtime must not be deployed to GitHub Pages. A production implementation needs:

- a backend host capable of server-side execution and managed secrets;
- the `api.svsam.com` DNS/TLS configuration;
- separate development and production environments;
- deployment identity with least privilege and owner-approved recovery;
- monitoring, redacted logs, alerting, dependency updates, backups where state exists, and a rollback release;
- contract tests using fixtures with no guest, client, or credential data;
- a production readiness/security review before any public feature flag is enabled.

The public `apiBaseUrl` is safe to expose. Everything that grants partner access or changes a booking/referral must remain behind this server boundary.
