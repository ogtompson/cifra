# Cifra

Cifra is a personal finance application for organizing accounts, income, expenses, recurring transactions, cards, budgets, and credit-card invoices.

The repository has a Next.js web interface and a Spring Boot REST API backed by PostgreSQL.

## Stack

- **Frontend:** Next.js 16, React 19, JavaScript, Tailwind CSS 4
- **Backend:** Java 21, Spring Boot 4.1
- **Persistence:** PostgreSQL, Spring Data JPA, Hibernate, Flyway
- **Security:** Spring Security
- **Testing:** Maven Test, JUnit, Spring Boot Test
- **Notable libraries:** Lombok, Flyway, PostgreSQL JDBC

## How it fits together

The frontend uses `src/lib/api.js` to call backend endpoints under `/api`, attaching the saved session token as a bearer token. Protected routes in the Next.js application render the dashboard and financial management screens.

The backend exposes controllers for authentication and financial resources, delegates business rules to services, and persists domain objects through JPA repositories. Flyway migrations initialize the PostgreSQL schema, while scheduled jobs process recurring financial entries.

## Repository structure

```text
backend/
  src/main/java/com/cifra/backend/
    config/       Security, CORS, and application configuration
    controller/   REST endpoints
    dto/          Request and response structures
    exception/    API error handling
    job/          Scheduled recurrence processing
    model/        JPA entities
    repository/   Spring Data repositories
    security/     Session authentication
    service/      Business logic
  src/main/resources/
    db/migration/ Flyway SQL migrations
    application.properties
  src/test/java/  Backend unit and integration tests
  pom.xml         Maven build and dependencies

frontend/
  src/app/        Next.js routes and root layout
  src/components/ Dashboard, navigation, and feature components
  src/lib/        API client and financial utilities
  public/         Static assets
  package.json    Frontend scripts and dependencies

docs/
  AUDITORIA-DIA-1.md
  AUDITORIA-DIA-2.md
  PLANO-DEPLOY-7-DIAS.md
  TRANSICAO-MAQUINA-PESSOAL.md
```

## Running locally

### 1. Start PostgreSQL

Create a database named `cifra` and configure the backend credentials:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/cifra
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
```

### 2. Start the backend

```bash
cd backend
./mvnw spring-boot:run
```

The API runs at `http://localhost:8080/api`.

Without Maven Wrapper present in the repository, use Maven directly:

```bash
cd backend
mvn spring-boot:run
```

The following environment variables can also be configured:

```text
RECORRENCIAS_CRON
RECORRENCIAS_ZONE
CORS_ALLOWED_ORIGINS
AUTH_SESSION_DURATION
```

### 3. Start the frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The web application runs at `http://localhost:3000`.

The frontend reads `NEXT_PUBLIC_API_URL`, which defaults to `http://localhost:8080/api`.

## Available frontend commands

```bash
npm run dev    # Development server
npm run build  # Production build
npm run start  # Production server
npm run lint   # ESLint
```

## Backend tests

```bash
cd backend
mvn test
```
