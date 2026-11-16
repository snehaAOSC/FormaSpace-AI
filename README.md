# FormaSpace AI — Architectural Redesign, Video Walkthroughs & Smart Furniture Estimator

**FormaSpace AI** is an editorial-grade interior architecture platform combining generative spatial AI redesign, multi-angle cinematic video walkthroughs, authentic itemized furniture budgeting, and instant Stripe QR code online checkout.

---

## Key Features

1. **AI Studio Room Redesign**
   - Structure-preserving spatial transformations across curated styles (Modern Luxury, Japandi, Warm Minimalist, Scandinavian, Mediterranean, Industrial, Mid-Century Modern).
   - Support for Living Rooms, Bedrooms, Kitchens, Bathrooms, Dining Rooms, and Outdoor Terraces.
   - Smart image generation with live vision models or zero-config fallback.

2. **Cinematic Spatial Video Walkthroughs**
   - Multi-angle camera flight paths (Slow Dolly In, Wide Establishing, Glazing Pan, Material Close-Up, Ceiling Detail, Evening Glow).
   - Real-time 60FPS browser playback, camera switching, speed controls, and clip export.
   - Clean UI without placeholder text or obstructive watermarks.

3. **Smart Furniture & Room Cost Estimator**
   - Real-time furniture piece identification and itemized budgeting.
   - Authentic studio product photography for individual furniture items (curved sofas, travertine plinth tables, terracotta lounge armchairs, sculpted linen pendants, wool rugs).
   - Direct retailer purchase links matching exact catalog items.

4. **Stripe Online Payment & QR Code System**
   - Scannable dynamic QR code powered by Stripe with 256-bit SSL encryption.
   - Backend payment intent creation and real-time confirmation endpoints (`/api/modules/payment/stripe-intent` and `/api/modules/payment/confirm-stripe`).
   - Instant order confirmation and receipt generation.

5. **Authentication & Quick Demo Access**
   - Supabase Auth + local JWT security fallback.
   - Instant Demo Architect login for zero-friction evaluation.

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons, React Router 7.
- **Backend:** Python FastAPI, Pydantic, Pillow, Uvicorn, Stripe SDK, PyJWT, HTTPX.
- **Database & Auth:** Supabase PostgreSQL + Row-Level Security, with SQLite fallback.
- **Storage:** Supabase Storage with local filesystem fallback.

---

## Quick Start

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.10+ & pip
- Git

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(All core features work immediately out-of-the-box with built-in zero-config simulation mode).*

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload
```
API documentation available at: `http://localhost:8000/docs`

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Demo Accounts

- **Architect Demo:** `studio@formaspace.ai` / `FormaSpace2026!`
- **Admin Demo:** `admin@formaspace.ai` / `AdminForma2026!`

---

## License
MIT License. Created for FormaSpace AI Architectural Studio.
