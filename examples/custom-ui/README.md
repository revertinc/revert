# Revert API - Custom UI Example (React)

React application demonstrating a custom UI component for managing Revert API contacts.

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running

Start the development server:
```bash
npm start
```

App will open on `http://localhost:3000`

## Features

- List all contacts from Revert API
- Create new contacts
- Refresh contact list
- Responsive table view

## Prerequisites

Ensure the Node.js example server is running on `http://localhost:3000` or update `REACT_APP_API_BASE_URL` in `.env`.

## Building

Create a production build:
```bash
npm run build
```
