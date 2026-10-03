# Invoice Intelligence Frontend

Responsive Vite + React + TypeScript dashboard for an ML invoice intelligence project.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Production build

```bash
npm run build
npm run preview
```

## Next integration

Recommended architecture:

Browser -> React/Vite -> FastAPI -> S3/MySQL -> ML inference/MLOps pipeline

Suggested endpoints:
- POST /api/invoices/upload
- GET /api/invoices
- GET /api/invoices/{invoice_id}
- POST /api/invoices/{invoice_id}/predict
- GET /api/dashboard/summary

The current UI uses mock data intentionally so the frontend can be reviewed before API integration.
