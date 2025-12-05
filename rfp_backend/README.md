# Node Backend Template (TypeScript)

A modern, minimal, and scalable Node.js backend template using TypeScript. This template helps you quickly bootstrap robust REST APIs or microservices with best practices out of the box.

## Features & Packages

This template includes the following features and packages:

- **TypeScript Support**  
  - [`typescript`](https://www.npmjs.com/package/typescript): Type-safe development.
  - [`ts-node`](https://www.npmjs.com/package/ts-node): Run TypeScript directly.
- **Express Server**  
  - [`express`](https://www.npmjs.com/package/express): Fast, minimalist web framework.
  - [`@types/express`](https://www.npmjs.com/package/@types/express): Type definitions.
- **Environment Variables**  
  - [`dotenv`](https://www.npmjs.com/package/dotenv): Loads `.env` files.
- **Development Tools**  
  - [`nodemon`](https://www.npmjs.com/package/nodemon): Auto-restart server on changes.
- **Other Type Definitions**  
  - [`@types/node`](https://www.npmjs.com/package/@types/node): Node.js types.

> See `package.json` for the full and exact list of dependencies.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Bun](https://bun.sh/) (optional, for ultra-fast install & dev)
- [npm](https://www.npmjs.com/), [Yarn](https://yarnpkg.com/), or [Bun](https://bun.sh/)

### Installation

#### Using degit

```bash
npx degit Manjil246/node-backend-template-ts my-backend
cd my-backend
```

#### Using git

```bash
git clone https://github.com/Manjil246/node-backend-template-ts.git
cd node-backend-template-ts
```

#### Install dependencies

With npm:
```bash
npm install
```
With Yarn:
```bash
yarn install
```
With Bun:
```bash
bun install
```

### Running the Server

With npm:
```bash
npm run dev
```
With Yarn:
```bash
yarn dev
```
With Bun:
```bash
bun run dev
```

The server will start on the port defined in your `.env` file (default: `3000`).

### Building for Production

With npm:
```bash
npm run build
npm start
```
With Yarn:
```bash
yarn build
yarn start
```
With Bun:
```bash
bun run build
bun start
```

## Actual Project Structure

Below is the actual folder structure as found in this template:

```
c:\Myself\node-backend-template-ts
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   ├── utils/
│   └── index.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── README.md
```

### Folder & File Purpose

- **src/**: Main source code for the backend API.
  - **controllers/**: Route handler logic.
  - **routes/**: API route definitions.
  - **services/**: Business logic/services.
  - **middlewares/**: Express middlewares.
  - **utils/**: Utility/helper functions.
  - **index.ts**: App entry point.
- **.env**: Environment variables for local development.
- **.env.example**: Example environment file for reference.
- **package.json**: Project metadata, dependencies, and scripts.
- **tsconfig.json**: TypeScript configuration.
- **README.md**: Project documentation.

> **Note:** If your folder structure differs, update this section to match your actual setup.

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

```
PORT=3000
DB_URL=your_database_url
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch
5. Open a pull request

## Author

Made with ❤️ by [Manjil Dhungana](https://github.com/Manjil246)

## License

MIT

---
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch
5. Open a pull request

## Author

Made with ❤️ by [Manjil Dhungana](https://github.com/Manjil246)

## License

MIT

---
