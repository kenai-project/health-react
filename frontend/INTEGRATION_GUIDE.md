# FastAPI Backend Integration Guide

This guide will help you integrate this React frontend with your existing FastAPI backend.

## Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000/api
```

### 2. CORS Configuration (FastAPI)

Add CORS middleware to your FastAPI backend:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Required API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Login endpoint that returns JWT token.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**FastAPI Example:**
```python
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(credentials: LoginRequest):
    # Verify credentials (example)
    user = authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create JWT token
    token = create_access_token({"sub": user.email, "role": user.role})
    
    return {
        "access_token": token,
        "token_type": "Bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }
```

#### POST /api/auth/logout
Logout endpoint (optional, can be client-side only).

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

#### GET /api/auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin"
}
```

**FastAPI Example:**
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredential

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthCredential = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = get_user_by_email(payload.get("sub"))
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }
```

### Users Management Endpoints

#### GET /api/users
Get all users (admin only).

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Admin",
    "email": "admin@example.com",
    "role": "admin",
    "status": "active",
    "lastLogin": "2026-06-22T10:30:00"
  }
]
```

#### GET /api/users/{id}
Get user by ID.

#### POST /api/users
Create new user.

**Request:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "securepassword",
  "role": "staff"
}
```

#### PUT /api/users/{id}
Update user.

#### DELETE /api/users/{id}
Delete user.

### Records Management Endpoints

#### GET /api/records
Get all medical records.

**Response:**
```json
[
  {
    "id": "REC001",
    "patientName": "John Doe",
    "age": 45,
    "department": "Cardiology",
    "doctor": "Dr. Smith",
    "date": "2026-06-20",
    "status": "Active",
    "diagnosis": "Hypertension"
  }
]
```

#### GET /api/records/{id}
Get record by ID.

#### POST /api/records
Create new record.

**Request:**
```json
{
  "patientName": "Jane Doe",
  "age": 32,
  "department": "Neurology",
  "doctor": "Dr. Johnson",
  "diagnosis": "Migraine",
  "notes": "Patient experiencing chronic migraines"
}
```

#### PUT /api/records/{id}
Update record.

#### DELETE /api/records/{id}
Delete record.

### Analytics Endpoints

#### GET /api/analytics/dashboard
Get dashboard statistics.

**Response:**
```json
{
  "totalUsers": 1245,
  "totalRecords": 3847,
  "activePatients": 892,
  "avgVisits": 24.5
}
```

#### GET /api/analytics/activity
Get recent activity log.

**Response:**
```json
[
  {
    "id": 1,
    "action": "New patient record created",
    "user": "Dr. Smith",
    "timestamp": "2026-06-22T10:25:00"
  }
]
```

#### GET /api/analytics/charts/{type}
Get chart data for specific type (monthly, department, etc.).

## JWT Token Handling

### Token Storage
The frontend stores the JWT token in localStorage under the key `token`.

### Token Transmission
The token is sent in the Authorization header:
```
Authorization: Bearer {token}
```

### Token Validation
Your FastAPI backend should:
1. Validate the token signature
2. Check token expiration
3. Extract user information
4. Return 401 if invalid

**FastAPI Middleware Example:**
```python
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip auth for login endpoint
        if request.url.path == "/api/auth/login":
            return await call_next(request)
        
        # Get token from header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing token")
        
        token = auth_header.split(" ")[1]
        
        # Validate token
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.state.user = payload
        except:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return await call_next(request)
```

## Role-Based Access Control

The frontend implements role-based routing:

- **Admin role**: Access to all routes including `/admin/users`
- **Staff role**: Access to `/staff/records` (read-only)
- **Default**: Access to home, dashboard, records, analytics, profile, settings

Implement the same role checking on your backend:

```python
from fastapi import Depends, HTTPException

def require_role(required_role: str):
    async def role_checker(current_user = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=403,
                detail=f"Access forbidden: {required_role} role required"
            )
        return current_user
    return role_checker

# Usage
@router.get("/admin/users")
async def get_users(admin = Depends(require_role("admin"))):
    # Only accessible by admin
    return get_all_users()
```

## Error Handling

The frontend expects errors in this format:

```json
{
  "message": "Error description",
  "detail": "Additional details (optional)"
}
```

**FastAPI Example:**
```python
from fastapi import HTTPException

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail}
    )
```

## Testing the Integration

### 1. Start your FastAPI backend
```bash
uvicorn main:app --reload --port 8000
```

### 2. Start the React frontend
```bash
npm install
npm run dev
```

### 3. Test the login flow
1. Navigate to http://localhost:5173/login
2. Enter credentials
3. Verify token is received and stored
4. Check that protected routes are accessible

## Production Deployment

### Build the frontend
```bash
npm run build
```

### Serve with FastAPI
```python
from fastapi.staticfiles import StaticFiles

# Mount the built React app
app.mount("/", StaticFiles(directory="dist", html=True), name="static")
```

### Environment Variables
Update `.env` for production:
```env
VITE_API_URL=https://your-api-domain.com/api
```

## Troubleshooting

### CORS Issues
- Ensure CORS middleware is properly configured
- Check that the origin matches your frontend URL
- Verify credentials are allowed

### Authentication Issues
- Check token format in requests
- Verify JWT secret key matches
- Ensure token hasn't expired
- Check Authorization header format

### 401 Errors
- Token may be expired
- Token signature invalid
- User not found in database

### 403 Errors
- User doesn't have required role
- Check role-based access control implementation

## Sample Data

For testing, create these sample users:

```python
users = [
    {
        "email": "admin@example.com",
        "password": "password",  # Hash this!
        "name": "Admin User",
        "role": "admin"
    },
    {
        "email": "doctor@example.com",
        "password": "password",  # Hash this!
        "name": "Dr. Smith",
        "role": "doctor"
    },
    {
        "email": "staff@example.com",
        "password": "password",  # Hash this!
        "name": "Staff Member",
        "role": "staff"
    }
]
```

## Security Best Practices

1. **Always hash passwords** using bcrypt or similar
2. **Use HTTPS** in production
3. **Set token expiration** (e.g., 24 hours)
4. **Validate all inputs** on the backend
5. **Implement rate limiting** for login attempts
6. **Use secure JWT secret keys**
7. **Don't expose sensitive data** in error messages

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check FastAPI logs
3. Verify API endpoint URLs
4. Test endpoints with tools like Postman
5. Check CORS configuration
