# Secret Santa MERN App

A festive Secret Santa coordinator built with the MERN stack, Vite, and Tailwind CSS. Hosts can generate invite codes, members can join, everyone can see who has arrived, and once the host starts the event each person can submit a wish list that gets emailed to a randomly selected Secret Santa.

## Features

- Google OAuth (token-based) and classic email/password authentication.
- Create or join private groups with shareable codes.
- Copy-to-clipboard button for group codes.
- Manual refresh roster: see members, host badge, wish status, and per-group Santa assignment state.
- Host-only control to start the event (locks further joining) and delete the group.
- Leave Group action for non-host members (removes their wish + assignment state for that group).
- Per-group Secret Santa assignment tracking (users can be Santa in multiple groups independently).
- Automatic Santa selection with instant email (no persistent pairing matrix).
- Auto-dismissing success/error banners (5s) for cleaner UX.
- Responsive, Christmas-inspired UI using Tailwind.

## Project Structure

```
SecretSanta/
├── backend/        # Express + MongoDB API
├── frontend/       # Vite + React + Tailwind client
├── Login.png       # Provided assets (copied into frontend/src/assets)
├── Dashboard.png
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or hosted)
- Google Cloud OAuth 2.0 Web Client ID (for one-tap login)
- SMTP credentials (e.g., SendGrid, Mailgun) for sending wish emails

## Backend Setup (`backend/`)

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy the sample environment file and fill it out:
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `PORT`: API port (default 5000)
   - `MONGODB_URI`: Mongo connection string (NOTE: sample file used `MONGO_URI`; rename to `MONGODB_URI`)
   - `JWT_SECRET`: long random string (e.g. `devansh.secretsanta.<hex>`) – changing invalidates existing tokens
   - `CLIENT_URLS`: comma-separated allowed origins (`http://localhost:5173` in dev)
   - `GOOGLE_CLIENT_ID`: Google OAuth client ID (client secret not required for current One Tap flow)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: mail server settings
   Optional / feature flags:
   - `CORS_DISABLE`: set to `true` to allow all origins (dev only)
3. Start the API:
   ```bash
   npm run dev
   ```
   The server provides endpoints under `http://localhost:5000/api`.

## Frontend Setup (`frontend/`)

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Copy the sample env file and point it to your API + Google client ID:
   ```bash
   cp .env.example .env
   ```
   - `VITE_API_URL` should include the `/api` suffix (e.g., `http://localhost:5000/api`).
   - `VITE_GOOGLE_CLIENT_ID` must match the backend value.
3. Run the Vite dev server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:5173`.

## Key Workflows

1. **Authentication**
   - Users may register/login with email + password.
   - Alternatively they can use Google One Tap. The frontend obtains the credential via `google.accounts.id` and the backend verifies it with `google-auth-library`.

2. **Groups**
   - Hosts create a group and receive a 6-character code (random, collision-checked).
   - Members join via that code until the host starts Secret Santa. After start, new joins are blocked; existing members can still load the group.
   - Copy button next to the code speeds sharing.
   - Non-host members can leave the group; leaving removes their wish and per-group Santa assignment entry.

3. **Starting Secret Santa**
   - Only the host can press “Start Secret Santa”. After that, a “Make a Wish” button shows for everyone.
   - Members complete the modal form (Name, Favorite Color, Snacks, Hobbies, wish list, and do-not-need list; the latter two capped at three entries).

4. **Wish Submission & Emailing**
   - The backend stores the form, picks a Secret Santa excluding the wish submitter.
   - Selection prefers members who have not yet been assigned within THIS group (`hasAssignedGift` does not include the group title). Falls back to all other members if everyone has already been assigned once.
   - Sends a rich HTML email to the selected Santa with sanitized wish details.
   - Marks the Santa by pushing the group title into their `hasAssignedGift` array (per-group tracking).
   - Cleans up assignment entries if a user leaves or the host deletes the group.

## API Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Basic health check |
| `/api/auth/register` | POST | Email/password registration |
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/google` | POST | Google credential login |
| `/api/auth/me` | GET | Current user profile (auth) |
| `/api/groups` | GET | List groups for user |
| `/api/groups` | POST | Create group (host) |
| `/api/groups/join` | POST | Join group by code (blocked if started) |
| `/api/groups/:code` | GET | Get group details (member only) |
| `/api/groups/:code/start` | PATCH | Host starts Secret Santa (locks joining) |
| `/api/groups/:code/leave` | DELETE | Member leaves group + wish removal |
| `/api/groups/:code` | DELETE | Host deletes group + cleanup |
| `/api/wishes/:code/status` | GET | Wish status for current user |
| `/api/wishes/:code` | POST | Submit wish and trigger Santa assignment |

## Data Model Notes

- `User.hasAssignedGift` is now an array of group titles where the user has already been selected as a Santa. Previously a boolean; migrate old data by setting `hasAssignedGift: []` for users with `false` and `hasAssignedGift: [<existing group title>]` if you had implicit single-group assignments.
- Group deletion and member leaving both remove the group title from affected users’ `hasAssignedGift` arrays.
- Wish pairing is ephemeral; only the receiving Santa is tracked indirectly by their assignment array.

## Useful Scripts

### Backend
- `npm run dev` – start Express with Nodemon
- `npm start` – start Express once (production)

### Frontend
- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview production build locally

## UI Enhancements

- Auto-dismiss banners after 5s for success/errors.
- Group code copy button for quick sharing.
- Join modal auto-closes on “already started” error.
- Member name/email truncation on small screens to prevent layout overflow.
- Always-visible email deliverability heads-up banner on load (session-only dismiss).

## Notes & Next Steps

- Configure HTTPS origins for production and add them to `CLIENT_URLS`.
- For production email throughput, use a dedicated provider and domain-authenticated sender.
- If you want live updates instead of manual refresh, you can layer in websockets or server-sent events later on.

Happy gifting! 🎅

---

### Migration Quick Tips

If upgrading from the earlier boolean `hasAssignedGift`:
```js
// One-off script example
await db.collection('users').updateMany(
   { hasAssignedGift: { $in: [true, false] } },
   [
      { $set: { hasAssignedGift: { $cond: [ { $eq: ['$hasAssignedGift', true] }, [], [] ] } } }
   ]
);
```
Or simply read users in application code and normalize: `if(!Array.isArray(user.hasAssignedGift)) user.hasAssignedGift = [];`.

### Generating a Strong JWT Secret

```bash
node -e "console.log('devansh.secretsanta.'+require('crypto').randomBytes(48).toString('hex'))"
```

Keep the same secret across redeploys to avoid invalidating existing tokens.
