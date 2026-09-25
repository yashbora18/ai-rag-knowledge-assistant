RAGAI — AI-Powered RAG Knowledge Assistant
RAGAI is a full-stack AI-powered knowledge assistant that allows users to upload documents, build a personal knowledge base, and interact with their documents through Retrieval-Augmented Generation (RAG).
The application provides a modern SaaS-style interface with authentication, document management, AI conversations, analytics, profiles, settings, notifications, and complete dark/light mode support.
✨ Features
🔐 Authentication
- User registration
- User login
- JWT-based authentication
- Protected routes
- Password reset flow
- Authenticated API requests
- Automatic unauthorized-session handling
- Secure password validation
📚 Document Management
- Upload documents
- View documents
- Search documents
- Sort documents
- Grid and list views
- Document details
- Extracted document content
- Document chunks
- Relevant source information
- Delete documents
- Loading and empty states
- Responsive document interface
🤖 AI-Powered RAG Chat
- AI-powered conversations
- Retrieval-Augmented Generation
- Document-based question answering
- Context-aware responses
- Relevant document retrieval
- Source-aware responses
- Conversation history
- Multiple conversations
- Document-specific retrieval
- Search across available documents
📊 Dashboard
- Total documents
- Knowledge chunks
- AI conversations
- AI usage
- RAG requests
- Success rate
- Average response time
- Average retrieval count
- Average similarity
- Best similarity
- Low-quality requests
- Retrieval quality
- Recent documents
- Recent RAG requests
- RAG performance information
- AI assistant section
- Quick actions
📈 Analytics
- RAG request history
- Success and failure tracking
- Retrieval quality metrics
- Similarity metrics
- Response performance
- Evaluation trends
- Date-range filtering
- Request diagnostics
- Analytics insights
- Evaluation summaries
- Refreshable analytics data
👤 Profile
- User name
- Email
- User ID
- Account status
- Account creation date
- Last updated information
- Account activity information
⚙️ Settings
- Theme preferences
- Dark mode
- Light mode
- Account information
- Security information
- Quick navigation
🔔 Notifications
- Notification center
- Unread notification count
- Individual notification actions
- Mark notification as read
- Mark all notifications as read
- Automatic notification refresh
- Responsive mobile notifications
🌙 Dark & Light Mode
The entire application supports:
- ☀️ Light mode
- 🌙 Dark mode
Theme support is available across the landing page, authentication pages, dashboard, documents, document details, AI Chat, analytics, profile, settings, navigation, modals, cards, forms, and notifications.
📱 Responsive Design
RAGAI is designed for:
- 💻 Desktop
- 💻 Laptop
- 📱 Tablet
- 📱 Mobile
🛠️ Technology Stack
Frontend
- React
- Vite
- React Router
- Axios
- Lucide React
- CSS
- Responsive design
- Dark/Light theme system
Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- JWT Authentication
- Uvicorn
AI / RAG
- Retrieval-Augmented Generation
- Google Gemini API
- Document processing
- Text chunking
- Vector-based retrieval
- Similarity-based retrieval
Development
- Git
- GitHub
- VS Code
- Swagger / OpenAPI
🏗️ System Architecture
                         ┌─────────────────────┐
                         │        User         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React + Vite      │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                               REST API / JWT
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      FastAPI        │
                         │       Backend       │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
          │  PostgreSQL  │   │  RAG Engine  │   │ Gemini API   │
          │   Database   │   │  Retrieval   │   │ AI Response  │
          └──────────────┘   └──────┬───────┘   └──────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │ Document         │
                            │ Knowledge Base   │
                            └──────────────────┘
📁 Project Structure
ai-rag-knowledge-assistant/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   └── database.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── .env
│
├── .gitignore
└── README.md
Note: .env files are local configuration files and are excluded from Git using .gitignore.

⚙️ Local Development Setup
1. Clone the Repository
git clone https://github.com/yashbora18/ai-rag-knowledge-assistant.git
cd ai-rag-knowledge-assistant
🐍 Backend Setup
2. Open Backend Directory
cd backend
3. Create Virtual Environment
Windows
python -m venv venv
.\venv\Scripts\Activate.ps1
macOS / Linux
python3 -m venv venv
source venv/bin/activate
4. Install Dependencies
pip install -r requirements.txt
5. Configure Backend Environment
Create backend/.env.
Example:
DATABASE_URL=your_postgresql_database_url

JWT_SECRET_KEY=your_secure_jwt_secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

GEMINI_API_KEY=your_gemini_api_key

APP_NAME=RAGAI
APP_VERSION=1.0.0

ENVIRONMENT=development

FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
AUTO_CREATE_TABLES=true
⚠️ Never commit .env files or expose database credentials, JWT secrets, or API keys.

6. Start Backend
From the backend directory:
uvicorn app.main:app --reload
Backend: http://127.0.0.1:8000
⚛️ Frontend Setup
Open a second terminal.
cd frontend
7. Install Dependencies
npm install
8. Configure Frontend Environment
Create frontend/.env.
VITE_API_BASE_URL=http://127.0.0.1:8000
9. Start Frontend
npm run dev
Frontend: http://localhost:5173
🔗 Application URLs
Service	URL
Frontend	http://localhost:5173
Backend	http://127.0.0.1:8000
Swagger API Docs	http://127.0.0.1:8000/docs
OpenAPI Schema	http://127.0.0.1:8000/openapi.json
Health Check	http://127.0.0.1:8000/health


📡 API
RAGAI provides REST APIs using FastAPI.
Interactive API Documentation
http://127.0.0.1:8000/docs
OpenAPI Schema
http://127.0.0.1:8000/openapi.json
Authenticated requests use:
Authorization: Bearer <access_token>
🔐 Security
RAGAI includes:
- JWT authentication
- Protected frontend routes
- Authenticated API requests
- Password hashing
- Environment-based secrets
- CORS configuration
- Sensitive .env files excluded from Git
- Unauthorized-session handling
- API key protection
Never commit
.env
.env.*
Sensitive values include:
- Database credentials
- JWT secrets
- Gemini API keys
- Production credentials
🧪 Project Verification
The project has been verified locally.
Frontend Verification
npm install
npm run build
The Vite production build completes successfully.
Backend Verification
The backend has been verified for:
- Application startup
- API availability
- Health endpoint
- Swagger documentation
- OpenAPI schema
- Database connectivity
- User registration
- User login
- JWT authentication
- Protected API endpoints
- Frontend/backend communication
- CORS
Health Endpoint
GET /health
Example response:
{
  "status": "healthy"
}
🚀 Deployment
RAGAI is currently not deployed to production.
The project is currently configured and verified for local development.
Future production deployment will require:
- Production PostgreSQL database
- Backend hosting
- Frontend hosting
- Production environment variables
- Production CORS configuration
- Production API URL
- Secure production JWT secret
- Gemini API configuration
- HTTPS
Production deployment will be configured separately when deployment begins.
🔮 Future Improvements
Potential future improvements include:
- Production deployment
- Advanced document formats
- Streaming AI responses
- Advanced RAG evaluation
- Improved document processing
- Team collaboration
- Role-based workspaces
- Usage limits
- Additional AI providers
- CI/CD pipeline
- Advanced vector database optimization
👨‍💻 Author
Yash Bora
Computer Science & Engineering
GitHub
https://github.com/yashbora18
📄 License
This project currently does not specify an open-source license.
A license can be added when the project is ready for open-source distribution.
