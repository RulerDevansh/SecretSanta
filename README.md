# Secret Santa MERN App

A festive Secret Santa coordinator built with the MERN stack, Vite, and Tailwind CSS. Hosts can generate invite codes, members can join, everyone can see who has arrived, and once the host starts the event each person can submit a wish list that gets emailed to a randomly selected Secret Santa.

## Features

- Google OAuth (token-based) and classic email/password authentication.
- Create or join private groups with shareable codes.
- Real-time-ish roster with manual refresh so every member can see who joined, who submitted wishes, and who has been assigned as a Santa.
- Host-only controls for kicking off the exchange plus universal Make a Wish modal with the requested questions and limits.
- Automatic Santa selection with on-the-spot email delivery (no pairings stored in the database).
- Responsive, Christmas-inspired UI using Tailwind, plus supplied illustrations for login and dashboard backgrounds.

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
   - `MONGODB_URI`: Mongo connection string
   - `JWT_SECRET`: long random string for signing tokens
   - `CLIENT_URLS`: comma-separated allowed origins (`http://localhost:5173` during dev)
   - `GOOGLE_CLIENT_ID`: OAuth client ID used by the frontend
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: mail server settings
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
   - Hosts create a group and receive a 6-character code.
   - Members join via that code. Everyone sees a roster with host badges, wish submission indicators, and whether someone has already been selected as a Santa.

3. **Starting Secret Santa**
   - Only the host can press “Start Secret Santa”. After that, a “Make a Wish” button shows for everyone.
   - Members complete the modal form (Name, Favorite Color, Snacks, Hobbies, wish list, and do-not-need list; the latter two capped at three entries).

4. **Wish Submission & Emailing**
   - The backend stores the form, randomly picks a different member who hasn’t already been assigned as a Santa (falling back to all other members when needed), sends an email containing the wish details, and marks the selected Santa as “assigned”.
   - No pairing data is persisted—only wish content and boolean flags (`hasAssignedGift`, `deliveredToSanta`).

## Useful Scripts

### Backend
- `npm run dev` – start Express with Nodemon
- `npm start` – start Express once (production)

### Frontend
- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview production build locally

## Notes & Next Steps

- Configure HTTPS origins for production and add them to `CLIENT_URLS`.
- For production email throughput, use a dedicated provider and domain-authenticated sender.
- If you want live updates instead of manual refresh, you can layer in websockets or server-sent events later on.

Happy gifting! 🎅
