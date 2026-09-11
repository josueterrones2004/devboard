# DevBoard

A full-stack project and task management platform built to organize projects, manage tasks and track work through dashboards and Kanban workflows.

DevBoard was designed as a complete web application rather than a static demo, with persistent data, authentication, protected resources and a responsive interface.

## Overview

DevBoard provides a centralized workspace where users can:

- Create and manage projects
- Organize tasks by project
- Track work through Kanban boards
- Assign task priorities and due dates
- Filter and search projects and tasks
- Review upcoming and completed work
- Manage their account
- Access only projects and data they are authorized to view

## Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- React Router
- dnd-kit
- Vite

### Backend

- Node.js
- Express
- MongoDB
- Mongoose

### Security

- JWT authentication
- HttpOnly session cookies
- bcrypt password hashing
- Helmet security headers
- Rate limiting
- CORS origin restrictions
- Protected API routes
- Object-level project authorization
- Server-side input validation

## Features

### Authentication

- User registration
- User login
- Secure logout
- Persistent authenticated sessions
- Protected application routes
- Account information management

Authentication tokens are stored in **HttpOnly cookies**, preventing frontend JavaScript from directly accessing session tokens.

### Dashboard

The main dashboard provides an overview of:

- Current projects
- Active projects
- Open tasks
- Completed tasks
- Upcoming deadlines
- Recent project activity

### Project Management

Users can:

- Create projects
- Edit project information
- Delete projects
- Search projects
- Filter projects by status
- Sort projects
- View project progress

Supported project states include:

- Planning
- Active
- Completed

### Task Management

Tasks can include:

- Title
- Description
- Status
- Priority
- Assignee
- Labels
- Due date
- Position within a workflow

Supported task states:

- Todo
- In Progress
- Done

Supported priorities:

- Low
- Medium
- High

### Kanban Workflow

Project tasks can be managed through an interactive Kanban board.

Tasks can be moved between workflow stages using drag-and-drop interactions.

### My Tasks

The My Tasks section provides a centralized view of tasks assigned to the current user.

Tasks can be:

- Searched
- Filtered by project
- Filtered by priority
- Filtered by status
- Sorted by due date
- Viewed as a list or board

## Security

DevBoard includes multiple layers of backend security.

### Session Security

Authentication uses signed JWT sessions stored in HttpOnly cookies.

Cookies are configured with security settings appropriate for development and production environments.

### Password Security

Passwords are hashed using bcrypt before being stored in the database.

Password validation is performed server-side before account creation.

### Authorization

Access to project resources is validated on the backend.

Users cannot access projects belonging to another account simply by changing a project ID in the URL or API request.

### API Protection

The backend includes:

- Helmet security headers
- Request rate limiting
- Login rate limiting
- Registration rate limiting
- Request body size limits
- CORS restrictions
- Origin validation
- Protected API routes

## Project Structure

```text
devboard/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── vite.config.*
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.js
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## Running Locally

Clone the repository:

```bash
git clone https://github.com/josueterrones2004/devboard.git
cd devboard
```

### Backend

Install dependencies:

```bash
cd server
npm install
```

Create your local environment configuration using the included `.env.example` as reference.

The real `.env` file must remain private and should never be committed to Git.

Start the backend:

```bash
npm run dev
```

The development API runs on:

```text
http://localhost:5000
```

### Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Vite will provide the local frontend URL, normally:

```text
http://localhost:5173
```

## Production Build

Build the frontend with:

```bash
cd client
npm run build
```

Run the frontend linter with:

```bash
npm run lint
```

## Environment Variables

Sensitive values are stored using environment variables and are not committed to the repository.

Backend configuration includes values such as:

```text
MONGO_URI
JWT_SECRET
CLIENT_URL
```

Use `server/.env.example` as the reference for the required configuration.

Never commit real credentials, database passwords or JWT secrets.

## Database

DevBoard uses MongoDB with Mongoose for persistent application data.

The application stores information including:

- Users
- Projects
- Tasks
- Project membership
- Task assignments
- Workflow state

## API

The backend exposes REST endpoints for resources including:

```text
/api/auth
/api/projects
/api/tasks
```

Protected endpoints require an authenticated session.

## Deployment

DevBoard is designed so the frontend and backend can be deployed separately while using MongoDB Atlas as the production database.

A public deployment will be added here after deployment configuration is complete.

## Repository

Source code:

https://github.com/josueterrones2004/devboard

## Author

**Josué Terrones**

Full Stack Web Developer  
Tonalá, Jalisco, México

GitHub:  
https://github.com/josueterrones2004

LinkedIn:  
https://www.linkedin.com/in/josueterrones2004/

## License

This project was created as a personal full-stack development project and portfolio piece.

The source code is publicly available for reference and demonstration purposes.
