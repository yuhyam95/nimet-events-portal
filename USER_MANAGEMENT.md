# User Management System

This document describes the user management workflow implemented in the NIMET Events Portal.

## Features

### User Management
- **User Creation**: Admins can create new users with full name, email, password, and role
- **User Editing**: Admins can update user information (name, email, role)
- **User Deletion**: Admins can delete users from the system
- **User Listing**: View all users with search and sort functionality
- **Role-based Access**: Two roles available - 'admin' and 'user'

### Authentication
- **Secure Login**: Email and password authentication with bcrypt hashing
- **Session Management**: Persistent login sessions using localStorage
- **Password Security**: Passwords are hashed using bcrypt with salt rounds of 12

### User Profile
- **Profile Viewing**: Users can view their profile information
- **Password Change**: Users can change their own passwords
- **Account Information**: Display of account creation and last update dates

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  fullName: String (required, min 2 characters),
  email: String (required, unique, valid email),
  password: String (required, min 6 characters, hashed),
  role: String (required, enum: ['admin', 'user']),
  createdAt: String (ISO date string),
  updatedAt: String (ISO date string)
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install bcryptjs @types/bcryptjs
```

### 2. Initialize Database
To create the default admin user and set up database indexes, make a POST request to:
```
POST /api/init-db
```

This will create:
- Default admin user: `admin@nimet.com` / `admin123`
- Database indexes for better performance

### 3. Environment Variables
Ensure your `.env.local` file contains:
```
MONGODB_URI=your_mongodb_connection_string
```

## Usage

### Admin Workflow

1. **Login**: Use the default admin credentials or any admin account
2. **Access Users**: Navigate to `/admin/users` in the sidebar
3. **Create Users**: Click "Add User" to create new user accounts
4. **Manage Users**: Edit or delete existing users as needed

### User Workflow

1. **Login**: Use credentials provided by an admin
2. **View Profile**: Navigate to `/admin/profile` to see account information
3. **Change Password**: Use the "Change Password" feature in the profile page

## API Endpoints

### Authentication
- `authenticateUser(email, password)` - Authenticate user login

### User Management
- `getUsers()` - Get all users
- `getUserById(id)` - Get user by ID
- `getUserByEmail(email)` - Get user by email
- `createUser(data)` - Create new user
- `updateUser(id, data)` - Update user information
- `deleteUser(id)` - Delete user
- `changePassword(id, data)` - Change user password

## Security Features

### Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Minimum password length of 6 characters
- Password confirmation required for changes

### Data Validation
- Email format validation
- Required field validation
- Role enum validation
- Unique email constraint

### Access Control
- Role-based authentication
- Admin-only user management features
- Users can only change their own passwords

## Components

### UserForm
- Form for creating and editing users
- Validation using Zod schema
- Password field optional for updates

### UserList
- Displays users in table/card format
- Search and sort functionality
- Mobile-responsive design
- CRUD operations with confirmation dialogs

### ChangePasswordForm
- Secure password change form
- Current password verification
- New password confirmation
- Validation and error handling

### Profile Page
- User profile information display
- Password change functionality
- Account creation/update timestamps

## Error Handling

The system includes comprehensive error handling for:
- Database connection issues
- Validation errors
- Authentication failures
- Duplicate email addresses
- Invalid user operations

## Best Practices

1. **Password Security**: Always use strong passwords and change them regularly
2. **User Roles**: Assign appropriate roles based on user responsibilities
3. **Regular Backups**: Ensure database backups are performed regularly
4. **Access Monitoring**: Monitor user access and activity
5. **Security Updates**: Keep dependencies updated for security patches

## Troubleshooting

### Common Issues

1. **Login Fails**: Verify email/password and check if user exists
2. **Database Connection**: Ensure MONGODB_URI is correctly set
3. **Permission Errors**: Check user role and access permissions
4. **Validation Errors**: Review form input and validation rules

### Support

For technical support or questions about the user management system, please contact the development team.
