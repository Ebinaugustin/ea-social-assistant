# EA Social Assistant — Render backend package

This package serves the existing dashboard and provides a server-side `/api/search` endpoint. It does not bypass Meta review, API permissions, rate limits, or Instagram account requirements.

## Render settings
- Runtime: Node
- Branch: `main`
- Root Directory: leave blank
- Build Command: `npm install`
- Start Command: `npm start`
- Instance: Free (if available)

## Required private Render environment variables
- `META_ACCESS_TOKEN`: a valid Meta access token with the required Instagram Graph API permissions. Keep it in Render only; never commit it to GitHub or send it in chat.
- `IG_USER_ID`: the numeric Instagram professional-account ID required by the Graph API.
- `META_GRAPH_API_VERSION`: optional; set to a currently supported Graph API version if needed. Default in code is `v23.0`; update it to the version supported by your Meta app if Meta rejects it.

## Notes
- The API may return errors until the Meta app, linked Facebook Page/Instagram professional account, access token, and Public Content Access feature are correctly configured and approved for the intended use.
- Search uses Meta's official hashtag search and recent media endpoints. It does not scrape Instagram.
- The token is never sent to the browser. Error details are intentionally generic in API responses; diagnostic details are written to Render logs.
