# Rail Madad Internal Dashboard

A minimal React + Tailwind CSS single-page dashboard for Rail Madad internal testing.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the local URL shown by Vite.

## Notes

- Base API URL is configured at `src/App.jsx` as `http://localhost:8000/api`
- Login screen supports the provided test credentials.
- Admin and department dashboards are rendered conditionally based on `user.role`.
- Authentication uses an HTTP-only cookie set by the backend. The frontend sends cookies with every request via `withCredentials: true`.
- See `API_INTEGRATION.md` for endpoint details used by the Admin and Department Employee dashboards.
