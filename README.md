# Cloud Task Manager

A full-stack task management application with Auth0 authentication, MongoDB Atlas storage, and Dropbox cloud attachment backups.

## Repository Structure

```text
Cloud_Task_Manager_project/
│
├── backend/
│   ├── package.json
│   ├── server.js
│   └── .env.example
│
├── frontend/
│   ├── package.json
│   ├── public/
│   ├── src/
│   └── .env.example
│
├── vercel.json
└── README.md
```

## Features

- **Auth0 Authentication**: Secure login & logout with user session management.
- **Task Management**: Create, view, edit, priority filter, search, and delete tasks.
- **MongoDB Atlas Integration**: Cloud persistence for all task documents.
- **Dropbox Cloud Attachments**: Direct document uploads with shareable Dropbox links.
- **Modern UI**: Designed with Vibrant Teal, Bright Coral, Sunny Yellow, and Soft Mint White, featuring responsive cards and smooth micro-animations.

## Local Setup

### 1. Backend

```bash
cd backend
npm install
npm start
```
Runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm start
```
Runs on `http://localhost:3000`.

## Deployment

### Vercel (Multi-Service)
The repository is pre-configured with `vercel.json` to deploy both services in a single project:
- **Frontend root**: `frontend` (Create React App)
- **Backend root**: `backend` (Express Node.js)
- **Routing**: `/api/*` rewrites to backend, `/*` rewrites to frontend.

### Environment Variables
Configure the following in your hosting provider settings:
- **Backend**: `MONGODB_URI`
- **Frontend**: `REACT_APP_AUTH0_DOMAIN`, `REACT_APP_AUTH0_CLIENT_ID`, `REACT_APP_DROPBOX_ACCESS_TOKEN`
