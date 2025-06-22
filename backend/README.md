# SAP Integration Suite Backend Proxy

A FastAPI-based backend proxy service for SAP Integration Suite API calls. This backend handles OAuth authentication, token management, and proxies API calls to avoid CORS restrictions in the browser.

## Features

- 🔐 **OAuth 2.0 Authentication** with SAP Integration Suite
- 🔄 **Automatic Token Management** with caching and refresh
- 🚀 **FastAPI Framework** with automatic API documentation
- 🔒 **CORS Handling** for frontend integration
- 📊 **Health Monitoring** and status endpoints
- 🎯 **SAP-Specific Scopes** and API handling
- ⚡ **Async/Await** for high performance
- 📝 **Comprehensive Logging** and error handling

## Quick Start

### 1. Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### 2. Installation

```bash
# Clone or navigate to the backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration

Create a `.env` file in the backend directory with your SAP credentials:

```env
# SAP Integration Suite Configuration
SAP_CLIENT_ID=sb-4d88ec4d-cf00-4e40-b9a3-bf20640f4941!b236015|it!b182722
SAP_CLIENT_SECRET=68998671-12de-4a2c-ab02-8968d571b4cd$1hejXEfNv1qrX8raaVfuD_x-6PtP1xub7uRFmr55gaI=
SAP_TOKEN_URL=https://ccci-integration-suite-fuom1yo5.authentication.eu10.hana.ondemand.com/oauth/token
SAP_BASE_URL=https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com

# Application Configuration
ENVIRONMENT=development
DEBUG=true
HOST=0.0.0.0
PORT=8000

# CORS Configuration (add your frontend URLs)
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173","http://localhost:8080"]
```

### 4. Run the Backend

```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will start on `http://localhost:8000`

### 5. Verify Installation

Visit these URLs to verify the backend is working:

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **API Status**: http://localhost:8000/

## API Endpoints

### Health & Status

- `GET /` - Basic status
- `GET /health` - Detailed health check
- `GET /api/config` - Backend configuration
- `GET /api/sap/token-status` - OAuth token status

### SAP Integration Suite APIs

- `GET /api/sap/packages` - Get all Integration Packages
- `GET /api/sap/iflows` - Get all Integration Flows
- `GET /api/sap/base-tenant-data` - Get complete base tenant data
- `GET /api/sap/packages/{package_id}` - Get package details
- `GET /api/sap/iflows/{iflow_id}` - Get iFlow details

### Token Management

- `POST /api/sap/refresh-token` - Manually refresh OAuth token

### Testing

- `POST /api/tenants/test-connection` - Test SAP connection with credentials

## Frontend Integration

Update your frontend to use the backend proxy instead of direct SAP calls.

### Example Frontend Code

```typescript
// Replace direct SAP calls with backend calls
const API_BASE_URL = "http://localhost:8000";

// Get Integration Packages
const response = await fetch(`${API_BASE_URL}/api/sap/packages`);
const result = await response.json();

if (result.success) {
  const packages = result.data;
  // Handle packages data
}
```

## Production Deployment

### Environment Variables

Set these environment variables in production:

```env
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your-secure-secret-key
SAP_CLIENT_ID=your-production-client-id
SAP_CLIENT_SECRET=your-production-client-secret
ALLOWED_ORIGINS=["https://your-frontend-domain.com"]
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t sap-backend .
docker run -p 8000:8000 --env-file .env sap-backend
```

### Cloud Deployment Options

1. **AWS Lambda** with Mangum adapter
2. **Google Cloud Run**
3. **Azure Container Instances**
4. **Heroku** with Procfile
5. **SAP BTP Cloud Foundry**

## Development

### Code Structure

```
backend/
├── main.py              # FastAPI application
├── sap_client.py        # SAP Integration Suite client
├── models.py            # Pydantic data models
├── config.py            # Configuration management
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

### Adding New Endpoints

1. Add model to `models.py`
2. Add SAP client method to `sap_client.py`
3. Add API endpoint to `main.py`

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest

# Run with coverage
pip install pytest-cov
pytest --cov=.
```

## Troubleshooting

### Common Issues

1. **OAuth Token Errors**

   - Verify SAP credentials in `.env`
   - Check token URL and scopes
   - Review SAP user permissions

2. **CORS Issues**

   - Add frontend URL to `ALLOWED_ORIGINS`
   - Verify frontend is calling correct backend URL

3. **Connection Timeouts**

   - Check network connectivity to SAP
   - Increase `HTTP_TIMEOUT` in configuration

4. **Import Errors**
   - Ensure virtual environment is activated
   - Install all requirements: `pip install -r requirements.txt`

### Logging

Enable debug logging:

```env
LOG_LEVEL=DEBUG
DEBUG=true
```

View logs for detailed error information.

## Security Considerations

- Store SAP credentials securely (environment variables, secrets manager)
- Use HTTPS in production
- Implement rate limiting for public APIs
- Regular security updates for dependencies
- Monitor and log all API access

## Support

For issues and questions:

1. Check the logs for detailed error messages
2. Verify SAP connectivity with Postman
3. Test backend endpoints with the built-in documentation at `/docs`
4. Review configuration and environment variables

## License

This project is for internal use with SAP Integration Suite.
