# Clypso Project Information

## 🔐 Authentication Credentials
Credentials for role-based access control are configured via environment variables. See `.env.local` for details.

| Role | Environment Variable (User) | Environment Variable (Pass) |
|---|---|---|
| **Admin** | `NEXT_PUBLIC_ADMIN_USER` | `NEXT_PUBLIC_ADMIN_PASS` |
| **Client** | `NEXT_PUBLIC_CLIENT_USER` | `NEXT_PUBLIC_CLIENT_PASS` |

---

## 🛠️ Integrated Testing Accounts (LinkMe Network)
The following accounts are pre-configured in the `scan-engine` and auto-start on boot:

- **TikTok**: `@linkme.snipes`, `@linkmeprime`
- **YouTube**: `@linkmetalks`, `@linkmevision`
- **Instagram**: `@linkmevision`

---

## 📡 Backend Infrastructure
- **Frontend Port**: `3000` (Next.js)
- **Scan Engine Port**: `4000` (Node/Express)
- **Data Directory**: `~/.forensic-scan-data/`
- **Scraping Engine**: Integrated with Apify (TikTok/Instagram) and YouTube V3 API.

---

## 🗺️ Roadmap & Expansion
A detailed roadmap for Phase 2 expanded features can be found in `v2_feature_expansion_plan.md` (located in the brain/artifacts folder for your remote session).
