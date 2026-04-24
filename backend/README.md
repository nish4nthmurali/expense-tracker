# Expense Tracker Backend

## Running Locally

```bash
# Set environment variables for your Neon PostgreSQL
export DATABASE_URL=jdbc:postgresql://<your-neon-host>/expense_tracker?sslmode=require
export DATABASE_USERNAME=<your-username>
export DATABASE_PASSWORD=<your-password>

# Build and run
./mvnw spring-boot:run
```

## Running Tests

```bash
./mvnw test
```

Tests use H2 in-memory database (no external DB needed).

## API Endpoints

- `POST /api/expenses` — Create expense (supports `Idempotency-Key` header)
- `GET /api/expenses?category=Food&sort=date_desc` — List/filter/sort expenses
- `GET /api/expenses/categories` — Get distinct category list
