
# DASH

DASH is a full-stack web application for interactive chat and data visualization. It consists of a Next.js/React frontend and a Python backend API. Below is a technical overview of the architecture, features, and setup instructions.

## Table of Contents
- [Project Structure](#project-structure)
- [Frontend](#frontend)
- [Backend](#backend)
- [Setup & Installation](#setup--installation)
- [Development](#development)
- [Deployment](#deployment)
- [License](#license)

---

## Project Structure

```
DASH/
├── backend/           # Python FastAPI backend
│   ├── api.py         # Main API endpoints
│   ├── main.py        # App entry point
│   ├── lambda_function.py # AWS Lambda handler
│   ├── tools.py       # Utility functions
│   ├── requirements.txt # Python dependencies
│   └── Dockerfile     # Containerization
├── frontend/          # Next.js React frontend
│   ├── app/           # Application pages and API routes
│   ├── components/    # UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Client-side utilities
│   ├── public/        # Static assets
│   ├── styles/        # Global styles
│   ├── package.json   # Frontend dependencies
│   └── tailwind.config.ts # Tailwind CSS config
├── LICENSE
└── README.md
```

---

## Frontend
- **Framework:** Next.js (React, TypeScript)
- **Styling:** Tailwind CSS, PostCSS
- **Features:**
  - Modular UI components for chat, sidebar, dialogs, and theme management
  - API routes for chat functionality
  - Utility libraries for chat storage and date formatting
  - Responsive design and modern UI/UX

### Key Files
- `app/`: Main application pages and API endpoints
- `components/`: Reusable UI components (chat, sidebar, dialogs, etc.)
- `hooks/`: Custom React hooks
- `lib/`: Client-side utilities
- `public/`: Static assets
- `styles/`: Global CSS

---

## Backend
- **Language:** Python 3.13+
- **Framework:** FastAPI (or compatible API framework)
- **Features:**
  - RESTful API endpoints for chat and data operations
  - AWS Lambda handler for serverless deployment
  - Utility functions for backend logic
  - Dockerfile for containerization

### Key Files
- `api.py`: Defines API endpoints
- `main.py`: Application entry point
- `lambda_function.py`: AWS Lambda handler
- `tools.py`: Utility functions
- `requirements.txt`: Python dependencies
- `Dockerfile`: Container setup

---

## Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.13+
- pnpm (for frontend package management)
- Docker (optional, for backend containerization)

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   pnpm install
   ```
3. Start the development server:
   ```powershell
   pnpm dev
   ```

### Backend Setup
1. Navigate to the `backend` directory:
   ```powershell
   cd backend
   ```
2. (Optional) Create a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Run the backend server:
   ```powershell
   python main.py
   ```
5. (Optional) Build and run with Docker:
   ```powershell
   docker build -t dash-backend .
   docker run -p 8000:8000 dash-backend
   ```

---

## Development
- **Frontend:** Hot-reloading with Next.js, modular component structure, TypeScript for type safety.
- **Backend:** FastAPI for rapid API development, Docker for containerization, AWS Lambda compatibility for serverless deployment.

---

## Deployment
- **Frontend:** Deployable to Vercel, Netlify, or any platform supporting Next.js.
- **Backend:** Deployable to AWS Lambda, Docker containers, or traditional servers.

---

## License
This project is licensed under the terms of the LICENSE file in the root directory.

---

## Contact
For questions or contributions, please open an issue or pull request.
