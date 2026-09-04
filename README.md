# DevBoard

A full-stack project and issue management platform for organizing projects, tasks, priorities, workflows, and personal assignments.

DevBoard provides a responsive SaaS-style workspace with authentication, project management, Kanban boards, drag-and-drop task organization, dashboards, and persistent data stored in MongoDB.

## Features

### Authentication

- User registration
- User login
- JWT authentication
- Protected application routes
- Automatic session expiration handling
- Profile management
- Logout

### Projects

- Create projects
- Edit project information
- Delete projects
- Project status management
- Search projects
- Filter projects by status
- Project members
- Project overview and progress

### Task Management

- Create tasks
- Edit tasks
- Delete tasks
- Assign tasks to project members
- Task priorities
- Due dates
- Labels
- Search tasks
- Filter by priority and status

### Kanban Board

Tasks are organized into three workflow stages:

- To do
- In progress
- Done

The board supports drag-and-drop task movement and persistent ordering.

### Dashboard

The dashboard displays real workspace data including:

- Total projects
- Active projects
- Open tasks
- Completed tasks
- Recent projects
- Upcoming assigned tasks

### My Tasks

Users can view all tasks assigned to them across projects with:

- Search
- Status filters
- Priority filters
- Project references
- Due dates

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- dnd-kit

### Backend

- Node.js
- Express
- REST API
- JWT
- bcrypt

### Database

- MongoDB Atlas
- Mongoose

### Development Tools

- Git
- GitHub
- Postman
- VS Code
- Linux

## Project Structure

```text
devboard/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
│
├── docs/
├── .gitignore
└── README.md
```

## API Endpoints

### Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/me
```

### Projects

```text
GET     /api/projects
POST    /api/projects
GET     /api/projects/:id
PATCH   /api/projects/:id
DELETE  /api/projects/:id
```

### Tasks

```text
GET     /api/projects/:projectId/tasks
POST    /api/projects/:projectId/tasks
GET     /api/tasks/mine
PATCH   /api/tasks/:id
DELETE  /api/tasks/:id
```

## Getting Started

### Requirements

Make sure you have installed:

- Node.js
- npm
- Git
- A MongoDB Atlas account

### Clone the repository

```bash
git clone https://github.com/josueterrones2004/devboard.git
cd devboard
```

### Backend Setup

Enter the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Start the development server:

```bash
npm run dev
```

The API will run at:

```text
http://localhost:5000
```

### Frontend Setup

Open another terminal and enter the client directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

The application will run at:

```text
http://localhost:5173
```

## Production Build

From the client directory:

```bash
npm run lint
npm run build
```

## Security

Sensitive values are stored using environment variables and are excluded from Git.

Never commit:

- MongoDB credentials
- JWT secrets
- `.env` files
- Authentication tokens

User passwords are hashed with bcrypt before being stored in MongoDB.

## Current Status

DevBoard v1 includes the complete core MVP:

- Authentication
- Project CRUD
- Task CRUD
- Persistent Kanban board
- Drag and drop
- Dashboard
- My Tasks
- Profile settings
- Responsive interface

## Author

**Josué Terrones**

Full Stack Web Developer

- GitHub: https://github.com/josueterrones2004
- LinkedIn: https://www.linkedin.com/in/josueterrones2004/

## License

This project is intended for portfolio and educational purposes.