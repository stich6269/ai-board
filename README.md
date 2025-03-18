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
  "id": "string",
  "name": "string"
}
```

#### Teams
```json
{
  "id": "string",
  "name": "string",
  "engineers": ["string"]
}
```

#### Projects
```json
{
  "id": "string",
  "name": "string",
  "teams": ["string"]
}
```

#### Issues
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "team": "string",
  "engineer": "string",
  "project": "string",
  "startDate": "number",
  "endDate": "number"
}
```
## Dependencies

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [ESLint](https://eslint.org/)
- [Vitest](https://vitest.dev/)
- [JSON Server](https://github.com/typicode/json-server)
- [MUI](https://mui.com/)
- [React Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)