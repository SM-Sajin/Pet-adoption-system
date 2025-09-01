# Pet Adoption Website - Startup Guide

## Prerequisites

### For macOS:
1. **Node.js** (v18 or higher) - Already installed via NVM
2. **MongoDB** - You'll need to install this

### For Windows:
1. **Node.js** (v18 or higher) - Download from https://nodejs.org/
2. **MongoDB** - Download from https://www.mongodb.com/try/download/community

## Installation Steps

### Step 1: Install MongoDB

#### macOS (using Homebrew):
```bash
# Install Homebrew first (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

#### Windows:
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB will be installed as a service and should start automatically

### Step 2: Install Project Dependencies

From the project root directory:
```bash
npm run install-all
```

This will install dependencies for:
- Root project (concurrently)
- Backend (server)
- Frontend (client)

### Step 3: Environment Configuration

#### Backend (.env file in server directory):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pet-adoption
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLIENT_URL=http://localhost:3000
```

#### Frontend (.env file in client directory):
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Step 4: Start the Application

#### Option 1: Start both frontend and backend together
```bash
npm start
```

#### Option 2: Start them separately
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

## Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000 (basic endpoint test)

## Available Scripts

- `npm start` - Start both frontend and backend
- `npm run server` - Start only the backend
- `npm run client` - Start only the frontend
- `npm run install-all` - Install all dependencies
- `npm run build` - Build the frontend for production

## Cross-Platform Compatibility

This project is designed to work on both macOS and Windows without any code changes. The only differences are:

1. **Installation commands**: Use Homebrew on macOS, direct installers on Windows
2. **MongoDB service**: Different startup commands but same functionality
3. **File paths**: All paths are relative and cross-platform compatible

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `brew services list` (macOS) or check Services (Windows)
- Check if MongoDB is listening on port 27017
- Verify the connection string in server/.env

### Port Already in Use
- Backend (5000): Change PORT in server/.env
- Frontend (3000): React will automatically suggest an alternative port

### Node.js Version Issues
- Ensure you're using Node.js v18 or higher
- Use `nvm use 18` to switch to the correct version

## Next Steps

After the base setup is running:

1. **Sprint 1**: Implement pet listing and display features
2. **Sprint 2**: Add search, filtering, and wishlist functionality
3. **Sprint 3**: Build adoption application and chat system
4. **Sprint 4**: Add ratings and AI chatbot

## Support

For issues specific to your operating system:
- **macOS**: Check Homebrew and NVM documentation
- **Windows**: Check MongoDB and Node.js installation guides 