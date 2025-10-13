# Mobile App Authentication Integration

This document provides instructions for integrating the React Native/Expo mobile app with the NiMet Events Portal backend authentication system.

## Overview

The backend now supports JWT-based authentication that can be used by both the web portal and mobile app. Mobile users will use the same user accounts as the web portal.

## API Endpoints

### Authentication Endpoints

#### 1. Login
- **URL**: `POST /api/auth/login`
- **Description**: Authenticate user and receive JWT token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "email": "user@example.com",
      "role": "admin"
    },
    "token": "jwt_token_here"
  }
  ```

#### 2. Verify Token
- **URL**: `GET /api/auth/verify`
- **Description**: Verify JWT token and get user data
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "email": "user@example.com",
      "role": "admin"
    }
  }
  ```

#### 3. Refresh Token
- **URL**: `POST /api/auth/refresh`
- **Description**: Get a new JWT token using current token
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Same as login response

### Mobile App Endpoints

#### 1. Get Events
- **URL**: `GET /api/mobile/events`
- **Description**: Get all active events for mobile app
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "success": true,
    "events": [
      {
        "id": "event_id",
        "name": "Event Name",
        "slug": "event-slug",
        "startDate": "2024-01-01",
        "endDate": "2024-01-02",
        "location": "Event Location",
        "description": "Event Description",
        "isInternal": true,
        "department": "ICT",
        "position": "General Manager"
      }
    ]
  }
  ```

#### 2. Get Participants
- **URL**: `GET /api/mobile/participants/{eventId}`
- **Description**: Get participants for a specific event
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "success": true,
    "participants": [
      {
        "id": "participant_id",
        "name": "Participant Name",
        "organization": "Organization",
        "designation": "Designation",
        "department": "Department",
        "position": "Position",
        "contact": "email@example.com",
        "phone": "08012345678",
        "eventId": "event_id",
        "eventName": "Event Name"
      }
    ]
  }
  ```

#### 3. Scan Attendance
- **URL**: `POST /api/mobile/scan`
- **Description**: Mark attendance for a participant
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "participantId": "participant_id",
    "eventId": "event_id",
    "attendanceDate": "2024-01-01" // Optional, defaults to today
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Attendance marked successfully",
    "attendance": {
      "id": "attendance_id",
      "participantId": "participant_id",
      "eventId": "event_id",
      "checkedInAt": "2024-01-01T10:00:00.000Z",
      "attendanceDate": "2024-01-01"
    }
  }
  ```

## React Native/Expo Implementation

### 1. Install Dependencies

```bash
npm install @react-native-async-storage/async-storage
# or
expo install @react-native-async-storage/async-storage
```

### 2. Authentication Service

Create an authentication service in your mobile app:

```typescript
// services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-domain.com/api'; // Replace with your domain

interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  token?: string;
  error?: string;
}

export class AuthService {
  private static TOKEN_KEY = 'auth_token';

  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        await AsyncStorage.setItem(this.TOKEN_KEY, data.token);
      }
      
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  static async logout(): Promise<void> {
    await AsyncStorage.removeItem(this.TOKEN_KEY);
  }

  static async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(this.TOKEN_KEY);
  }

  static async verifyToken(): Promise<LoginResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  static async refreshToken(): Promise<LoginResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        await AsyncStorage.setItem(this.TOKEN_KEY, data.token);
      }
      
      return data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}
```

### 3. API Service

Create an API service for making authenticated requests:

```typescript
// services/apiService.ts
import { AuthService } from './authService';

const API_BASE_URL = 'https://your-domain.com/api'; // Replace with your domain

export class ApiService {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  static async getEvents() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/mobile/events`, {
      method: 'GET',
      headers,
    });
    return await response.json();
  }

  static async getParticipants(eventId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/mobile/participants/${eventId}`, {
      method: 'GET',
      headers,
    });
    return await response.json();
  }

  static async scanAttendance(participantId: string, eventId: string, attendanceDate?: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/mobile/scan`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        participantId,
        eventId,
        attendanceDate,
      }),
    });
    return await response.json();
  }
}
```

### 4. Environment Configuration

Add your API base URL to your environment configuration:

```typescript
// config/environment.ts
export const ENV = {
  API_BASE_URL: 'https://your-domain.com/api', // Replace with your actual domain
  // Add other environment variables as needed
};
```

## Security Considerations

1. **JWT Secret**: Make sure to set a strong JWT secret in your environment variables:
   ```bash
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   ```

2. **HTTPS**: Always use HTTPS in production for API communication.

3. **Token Storage**: The mobile app stores JWT tokens in AsyncStorage. Consider using secure storage for sensitive applications.

4. **Token Expiration**: Tokens expire after 7 days by default. Implement token refresh logic in your mobile app.

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Optional, for validation errors
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

## Testing

You can test the API endpoints using tools like Postman or curl:

```bash
# Login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Get events (replace TOKEN with actual token)
curl -X GET https://your-domain.com/api/mobile/events \
  -H "Authorization: Bearer TOKEN"
```

## Next Steps

1. Update your mobile app to use the authentication service
2. Implement the API service for making authenticated requests
3. Add proper error handling and loading states
4. Test the integration thoroughly
5. Deploy and configure your production environment variables
