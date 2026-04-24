# Expense Tracker

A production-quality personal finance tool for recording and reviewing expenses.

**Live Demo:**
- Frontend: _[Vercel URL — to be added after deployment]_
- Backend API: _[Railway URL — to be added after deployment]_

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.4 + Java 21 + Maven |
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| Database | PostgreSQL (Neon serverless) |
| Backend Hosting | Railway |
| Frontend Hosting | Vercel |

## Project Structure

```
expense-tracker/
├── backend/              # Spring Boot REST API
│   ├── src/main/java/    # Java source code
│   ├── src/test/java/    # JUnit 5 tests
│   ├── Dockerfile        # For Railway deployment
│   └── pom.xml
├── frontend/             # React + Vite SPA
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   └── package.json
└── README.md             # This file
```

## Key Design Decisions

### 1. Idempotency for Safe Retries
The `POST /api/expenses` endpoint accepts an `Idempotency-Key` header. The frontend generates a UUID per form submission. If the user clicks "Submit" multiple times or refreshes the page mid-request, the backend detects the duplicate key and returns the original response instead of creating a duplicate expense. This is critical for real-world reliability.

### 2. Money Handling with BigDecimal
All monetary values use `BigDecimal` in Java and `DECIMAL(12,2)` in PostgreSQL. We never use `float` or `double` for currency to avoid floating-point precision errors. The frontend sends amounts as numbers with at most 2 decimal places and displays them using `Intl.NumberFormat` for proper INR formatting.

### 3. Separate Frontend & Backend
While a monolithic approach (e.g., Next.js) would simplify deployment, keeping the backend and frontend separate provides:
- Clear separation of concerns
- Independent scaling and deployment
- Technology flexibility (Spring Boot for backend, React for frontend)

### 4. PostgreSQL via Neon (Serverless)
Chosen over in-memory storage for data persistence across restarts, and over SQLite for proper `DECIMAL` type support. Neon provides a generous free tier with serverless auto-scaling.

### 5. Client-Side Validation + Server-Side Validation
Both layers validate inputs. The frontend provides instant feedback (UX), while the backend enforces constraints authoritatively (security). Jakarta Bean Validation annotations on the DTO ensure the API is safe even without the frontend.

### 6. Category Filter Backed by API
Filtering and sorting happen server-side via query parameters (`?category=Food&sort=date_desc`). This ensures correctness as the dataset grows and avoids client-side data inconsistencies.

## Trade-offs Due to Timebox

| Decision | Trade-off |
|----------|-----------|
| JPA `ddl-auto: update` | Used instead of Flyway migrations for speed. In production, we'd use versioned migrations. |
| No pagination | The GET endpoint returns all expenses. For large datasets, we'd add cursor-based pagination. |
| Idempotency keys in PostgreSQL | Stored in the same DB for simplicity. In production, Redis with TTL would be more efficient. |
| No authentication | Single-user tool per the assignment scope. Multi-tenancy would require auth. |
| H2 for tests | Tests use H2 in-memory DB instead of Testcontainers + real PostgreSQL, trading fidelity for speed. |

## What Was Intentionally Left Out

- **User authentication / multi-tenancy** — Out of scope for a personal tool
- **Edit / Delete expense** — Not in the acceptance criteria
- **Pagination / infinite scroll** — Appropriate for larger datasets
- **Currency selection** — Assumed INR (₹) throughout
- **Dark mode** — "Keep styling simple; focus on correctness and clarity"
- **Optimistic UI updates** — Chose correctness (refetch after mutation) over perceived speed

## Running Locally

### Prerequisites
- Java 21
- Node.js 18+
- PostgreSQL (or use Neon free tier)

### Backend
```bash
cd backend

# Set database credentials
export DATABASE_URL=jdbc:postgresql://localhost:5432/expense_tracker
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=postgres

# Run
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install

# Point to backend API
echo "VITE_API_URL=http://localhost:8080/api" > .env.local

npm run dev
```

### Running Tests
```bash
# Backend (uses H2 in-memory DB)
cd backend && ./mvnw test

# Frontend
cd frontend && npm test
```

## Deployment

### Backend → Railway
1. Create a new Railway project
2. Connect the `backend/` directory
3. Set environment variables:
   - `DATABASE_URL` — Neon PostgreSQL JDBC URL
   - `DATABASE_USERNAME` — Neon username
   - `DATABASE_PASSWORD` — Neon password
   - `APP_CORS_ALLOWED_ORIGINS` — Your Vercel frontend URL
4. Railway auto-detects the Dockerfile and deploys

### Frontend → Vercel
1. Import the repo, set root directory to `frontend/`
2. Set environment variable:
   - `VITE_API_URL` — Your Railway backend URL + `/api`
3. Deploy

## API Reference

### POST /api/expenses
Create a new expense.

**Headers:**
- `Idempotency-Key` (optional): UUID to prevent duplicate creation on retries

**Request Body:**
```json
{
  "amount": 150.50,
  "category": "Food",
  "description": "Lunch at restaurant",
  "date": "2026-04-20"
}
```

**Response (201):**
```json
{
  "id": "a1b2c3d4-...",
  "amount": 150.50,
  "category": "Food",
  "description": "Lunch at restaurant",
  "date": "2026-04-20",
  "createdAt": "2026-04-20T10:30:00Z"
}
```

### GET /api/expenses
List expenses with optional filtering and sorting.

**Query Parameters:**
- `category` (optional): Filter by category name
- `sort` (optional): `date_desc` for newest first

### GET /api/expenses/categories
Returns a list of distinct category names for the filter dropdown.
