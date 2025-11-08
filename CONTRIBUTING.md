# Contributing to Revert

Thanks for taking the interest in contributing ♥. We really appreciate any support in making this project thrive.

## Before getting started

-   Before jumping into a PR be sure to search [existing PRs](https://github.com/revertinc/revert/pulls) or [issues](https://github.com/revertinc/revert/issues) for an open or closed item that relates to your submission.
-   Select an issue from [here](https://github.com/revertinc/revert/issues) or create a new one
-   Consider the results from the discussion in the issue

## Good First Issues

Looking for a place to start? Check out issues tagged with [good first issue](https://github.com/revertinc/revert/labels/good%20first%20issue). These are curated tasks suitable for new contributors.

## Development Setup

### Prerequisites

-   Node.js 16+ (Check `.nvmrc` for the exact version)
-   Yarn 3.2.2 or higher
-   Docker & Docker Compose (for running services locally)
-   Git

### Quick Start

1. **Clone and Setup Repository**
   ```bash
   git clone https://github.com/revertinc/revert.git
   cd revert
   nvm use  # Use correct Node version from .nvmrc
   yarn install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Fill in your configuration values
   ```

3. **Run Dev Environment**
   ```bash
   # Using dev container (recommended)
   # Open repo in VS Code and use "Reopen in Container"
   
   # Or manually start services
   docker-compose up -d
   yarn dev:all  # Starts backend, frontend, and JS package in parallel
   ```

### Backend Setup

Located in `packages/backend/`:

```bash
cd packages/backend
yarn install
yarn dev  # Runs on http://localhost:4001
```

**Key Commands:**
- `yarn build` - Production build
- `yarn test` - Run tests
- `yarn db:migrate` - Run database migrations
- `yarn db:seed` - Seed database with test data

### Frontend Setup

Located in `packages/client/`:

```bash
cd packages/client
yarn install
yarn start  # Runs on http://localhost:3000
```

### Running Tests

```bash
# Backend tests
cd packages/backend
yarn test

# Frontend tests
cd packages/client
yarn test
```

## Working with Examples

### Postman Collection

Import the Postman collection to test API endpoints:

1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `/postman/revert-api.postman_collection.json`
4. Configure variables (apiToken, tenantId, baseUrl)
5. Start testing!

[Postman Collection Documentation](./postman/README.md)

### Example Applications

We provide example implementations to help you understand the API:

#### Node.js Example
```bash
cd examples/nodejs
npm install
cp .env.example .env
# Update .env with your credentials
npm start  # Runs on http://localhost:3000
```

#### Python Example
```bash
cd examples/python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Update .env with your credentials
python app.py  # Runs on http://localhost:5000
```

#### React Custom UI Example
```bash
cd examples/custom-ui
npm install
cp .env.example .env
# Update .env with your API endpoint
npm start  # Runs on http://localhost:3000
```

### Developer Test Suite

Run integration tests against the API:

```bash
cd examples/dev-tester
npm install
cp .env.example .env
# Update .env with your test credentials
npm test  # Runs smoke tests
```

## Developing

### Git Workflow

-   The development branch is <code>main</code>. All pull requests should be made against this branch.
-   If you need help getting started, [join us on Discord](https://discord.gg/q5K5cRhymW).
-   Use [Conventional Commits](https://www.conventionalcommits.org/) to keep everything nice and clean.
-   Choose your branch name using the issue you are working on and a conventional commit type.

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device.

2. Create a new branch:
   ```sh
   git checkout -b feat/issue-123-feature-description
   ```

3. Make your changes and commit using conventional commits:
   ```sh
   git add .
   git commit -m "feat: add new feature"
   git push origin feat/issue-123-feature-description
   ```

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Branch is up to date with `main`
- [ ] Code follows the project style guidelines
- [ ] Changes are tested locally (`yarn test`)
- [ ] All tests pass (`npm test` for examples)
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] PR description clearly describes the changes
- [ ] No breaking changes (or documented in the PR)
- [ ] Documentation updated (if applicable)
- [ ] Examples updated (if modifying API contracts)

## Building

> **Note**
> Please be sure that you can make a full production build before pushing code or creating PRs.

- Install dependencies:
```bash
yarn install
```

- Build all packages:
```bash
yarn build
```

- Build specific package:
```bash
cd packages/backend
yarn build
```

## Code Quality

### Linting

```bash
# Check code style
yarn lint

# Fix linting issues
yarn lint:fix
```

### Formatting

The project uses Prettier for code formatting:

```bash
# Format code
yarn format

# Check formatting
yarn format:check
```

## Documentation

### API Documentation

API documentation is generated using Fern and available at [docs.revert.dev](https://docs.revert.dev).

To preview docs locally:
```bash
yarn fern:preview
```

To deploy docs:
```bash
yarn fern:docs
```

### Contributing an API Integration

See https://docs.revert.dev/overview/developer-guide/contribute-an-api-integration for more on how to contribute an integration.
