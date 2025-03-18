# Ai-board

Ai-board is a demo project powered by Vite. It includes a frontend client and a mock backend using `json-server`.

## Installation

To get started, clone this repository and install the dependencies:

```sh
npm install
```

## Available Scripts

### Development

Start both the frontend and backend in development mode:

```sh
npm run dev
```

This will run:

- `dev:client` – Vite development server
- `dev:server` – JSON Server on port `3000`

Alternatively, you can start them separately:

```sh
npm run dev:client  # Starts Vite
npm run dev:server  # Starts JSON Server
```

### Build

Compile the TypeScript project and build the frontend:

```sh
npm run build
```

### Linting

Check code quality using ESLint:

```sh
npm run lint
```

### Preview

Run a local preview of the production build:

```sh
npm run preview
```

### Testing

Run all tests using Vitest:

```sh
npm run test
```

Start the Vitest UI mode:

```sh
npm run test:ui
```

## Database (db.json)

The project includes a mock database file `db.json`, which is used by `json-server` to simulate a backend API.

### Structure

#### Engineers
```json
{
  "id": "string",           // "550e8400-e29b-41d4-a716-446655440000"
  "name": "string"          // "John Smith"
}
```

#### Teams
```json
{
  "id": "string",          // "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  "name": "string",        // "Trisolaris Alpha"
  "engineers": ["string"]  // ["550e8400-e29b-41d4-a716-446655440000", "3f2504e0-4f89-41d3-9a0c-0305e82c3301"]
}
```

#### Projects
```json
{
  "id": "string",        // "1f2e3d4c-5b6a-7890-abcd-ef1234567890"
  "name": "string",      // "Trisolaran Contact"
  "teams": ["string"]    // ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
}
```

#### Issues
```json
{
  "id": "string",        // "cea0845d-58e4-4aa1-a772-45e1cd50368e"
  "name": "string",      // "Boost Dark Forest signal strength"
  "type": "string",      // "IMPROVEMENT"
  "team": "string",      // "b2c3d4e5-f6a7-8901-bcde-f234567890ab"
  "engineer": "string",  // "456789ab-cdef-0123-4567-89abcdef0123"
  "project": "string",   // "3h4g5f6e-7d8c-9012-cdef-3456789abcde"
  "startDate": "number", // 1742835769
  "endDate": "number"    // 1743074752
}
```

### Running the JSON Server

To start the mock backend:

```sh
npm run dev:server
```

It will be available at `http://localhost:3000` and support basic CRUD operations.

## Dependencies

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [ESLint](https://eslint.org/)
- [Vitest](https://vitest.dev/)
- [JSON Server](https://github.com/typicode/json-server)
- [MUI](https://mui.com/)
- [React Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)