# File Path: backend/main.py
# Filename: main.py
"""
FastAPI Backend Proxy for SAP Integration Suite - Updated with correct design guidelines APIs
Handles authentication, token management, and API proxying
"""
from fastapi import Query
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import asyncio
import logging
from datetime import datetime, timedelta
import os
import json
import csv
from pathlib import Path

from config import Settings, get_settings
from sap_client import SAPClient, SAPCredentials
from models import (
    IntegrationFlow,
    BaseTenantData,
    ConnectionTestResult,
    APIResponse,
    TenantConfig,
    IntegrationPackage
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SAP Integration Suite Proxy",
    description="Backend proxy for SAP Integration Suite API calls",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global SAP client instance
sap_client: Optional[SAPClient] = None

@app.on_event("startup")
async def startup_event():
    """Initialize SAP client on startup"""
    global sap_client
    settings = get_settings()

    # Initialize with CCCI_SANDBOX credentials
    credentials = SAPCredentials(
        client_id=settings.sap_client_id,
        client_secret=settings.sap_client_secret,
        token_url=settings.sap_token_url,
        base_url=settings.sap_base_url
    )

    sap_client = SAPClient(credentials)
    logger.info("SAP Client initialized successfully")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "SAP Integration Suite Backend Proxy",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    global sap_client

    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "running",
            "sap_connection": "unknown"
        }
    }

    # Test SAP connection
    if sap_client:
        try:
            # Quick connectivity test
            is_healthy = await sap_client.test_connection()
            health_status["services"]["sap_connection"] = "healthy" if is_healthy else "degraded"
        except Exception as e:
            health_status["services"]["sap_connection"] = "error"
            health_status["sap_error"] = str(e)

    return health_status

# Tenant Management Endpoints

@app.post("/api/tenants/test-connection")
async def test_tenant_connection(tenant_config: TenantConfig) -> ConnectionTestResult:
    """Test connection to SAP tenant with provided credentials"""
    try:
        logger.info(f"Testing connection for tenant: {tenant_config.name}")

        # Create temporary SAP client with provided credentials
        credentials = SAPCredentials(
            client_id=tenant_config.client_id,
            client_secret=tenant_config.client_secret,
            token_url=tenant_config.token_url,
            base_url=tenant_config.base_url
        )

        temp_client = SAPClient(credentials)

        # Test authentication
        start_time = datetime.now()
        token = await temp_client.get_access_token()
        response_time = (datetime.now() - start_time).total_seconds() * 1000

        # Test API accessibility
        packages = await temp_client.get_integration_packages()

        return ConnectionTestResult(
            success=True,
            message="Connection successful! SAP Integration Suite is accessible.",
            response_time=int(response_time),
            details={
                "token_obtained": True,
                "api_accessible": True,
                "packages_found": len(packages),
                "test_timestamp": datetime.now().isoformat()
            }
        )

    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        return ConnectionTestResult(
            success=False,
            message=f"Connection failed: {str(e)}",
            response_time=0,
            details={
                "token_obtained": False,
                "api_accessible": False,
                "error": str(e),
                "test_timestamp": datetime.now().isoformat()
            }
        )

# SAP Integration Suite API Endpoints

@app.get("/api/sap/packages", response_model=APIResponse)
async def get_packages():
    """Get all Integration Packages from SAP Integration Suite"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info("Fetching Integration Packages from SAP")
        packages = await sap_client.get_integration_packages()
        return APIResponse(
            success=True,
            data=packages,
            message="Successfully fetched integration packages"
        )
    except Exception as e:
        logger.error(f"Failed to fetch packages: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/api/sap/iflows/{iflow_id}/configurations")
async def get_iflow_configurations(iflow_id: str, version: str) -> APIResponse:
    """Get configuration parameters for a specific integration flow"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info(f"Fetching configurations for iFlow: {iflow_id}, version: {version}")
        configurations = await sap_client.get_iflow_configurations(iflow_id, version)

        return APIResponse(
            success=True,
            data=configurations,
            message=f"Successfully retrieved configurations for {iflow_id}",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to fetch iflow configurations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch iflow configurations: {str(e)}"
        )


class IFlowConfigurationData(BaseModel):
    iflowId: str
    iflowName: str
    version: str
    configurations: Dict[str, str]

class SaveConfigurationRequest(BaseModel):
    environment: str
    timestamp: str
    iflows: List[IFlowConfigurationData]

# Create configurations directory if it doesn't exist
CONFIGURATIONS_DIR = Path("configurations")
CONFIGURATIONS_DIR.mkdir(exist_ok=True)

@app.post("/api/save-iflow-configurations")
async def save_iflow_configurations(request: SaveConfigurationRequest):
    """
    Save iFlow configurations to CSV file
    Creates two files in the environment folder: iflow_configuration.csv and iflow_configuration_<ENV>.csv
    """
    try:
        # Create environment-specific directory
        env_dir = CONFIGURATIONS_DIR / request.environment.upper()
        env_dir.mkdir(parents=True, exist_ok=True)

        # File names
        file1 = env_dir / "iflow_configuration.csv"
        file2 = env_dir / f"iflow_configuration_{request.environment.upper()}.csv"

        # Prepare CSV data
        csv_data = []
        for iflow in request.iflows:
            for param_key, param_value in iflow.configurations.items():
                # Try to get the type from the value if it's a tuple or dict, else default to 'xsd:string'
                param_type = 'xsd:string'
                if isinstance(param_value, dict) and 'type' in param_value:
                    param_type = param_value['type']
                elif isinstance(param_value, tuple) and len(param_value) == 2:
                    param_type = param_value[1]
                # If the value is just a string, keep xsd:string
                csv_data.append({
                    'iFlow_ID': iflow.iflowId,
                    'iFlow_Name': iflow.iflowName,
                    'iFlow_Version': iflow.version,
                    'Parameter_Key': param_key,
                    'Parameter_Value': param_value if not isinstance(param_value, (dict, tuple)) else (param_value[0] if isinstance(param_value, tuple) else param_value.get('value', '')),
                    'Parameter_Type': param_type,
                    'Saved_At': datetime.now().isoformat()
                })

        # Define CSV headers (no Environment, no Timestamp)
        headers = [
            'iFlow_ID',
            'iFlow_Name',
            'iFlow_Version',
            'Parameter_Key',
            'Parameter_Value',
            'Parameter_Type',
            'Saved_At'
        ]

        # Write both files
        for path in [file1, file2]:
            with open(path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=headers, delimiter='|')
                writer.writeheader()
                writer.writerows(csv_data)

        logger.info(f"✅ Saved {len(csv_data)} configuration parameters to {file1} and {file2}")

        return {
            "success": True,
            "message": f"Successfully saved {len(csv_data)} configuration parameters",
            "data": {
                "file1": str(file1),
                "file2": str(file2),
                "total_parameters": len(csv_data),
                "total_iflows": len(request.iflows),
                "environment": request.environment
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Failed to save configurations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save configurations: {str(e)}"
        )

@app.get("/api/list-configuration-files")
async def list_configuration_files():
    """
    List all saved configuration files
    """
    try:
        files = []
        
        if CONFIGURATIONS_DIR.exists():
            for file_path in CONFIGURATIONS_DIR.glob("*.csv"):
                stat = file_path.stat()
                files.append({
                    "filename": file_path.name,
                    "filepath": str(file_path),
                    "size": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        # Sort by modification time (newest first)
        files.sort(key=lambda x: x["modified"], reverse=True)
        
        return {
            "success": True,
            "message": f"Found {len(files)} configuration files",
            "data": {
                "files": files,
                "total_files": len(files),
                "configurations_directory": str(CONFIGURATIONS_DIR)
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to list configuration files: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list configuration files: {str(e)}"
        )

@app.get("/api/download-configuration-file/{filename}")
async def download_configuration_file(filename: str):
    """
    Download a specific configuration file
    """
    try:
        filepath = CONFIGURATIONS_DIR / filename
        
        if not filepath.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Configuration file '{filename}' not found"
            )
        
        # Read CSV file and return as JSON
        configurations = []
        with open(filepath, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile, delimiter='')
            configurations = list(reader)
        
        return {
            "success": True,
            "message": f"Successfully loaded configuration file '{filename}'",
            "data": {
                "filename": filename,
                "filepath": str(filepath),
                "configurations": configurations,
                "total_records": len(configurations)
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to download configuration file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download configuration file: {str(e)}"
        )

@app.get("/api/sap/iflows/{iflow_id}/design-guidelines")
async def get_design_guidelines(iflow_id: str, version: str, execution_id: Optional[str] = None) -> APIResponse:
    """Get design guidelines execution results for a specific integration flow"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info(f"Fetching design guidelines for iFlow: {iflow_id}, version: {version}, execution_id: {execution_id}")
        guidelines = await sap_client.get_design_guidelines(iflow_id, version, execution_id)

        return APIResponse(
            success=True,
            data=guidelines,
            message=f"Successfully retrieved design guidelines for {iflow_id}",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to fetch design guidelines: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch design guidelines: {str(e)}"
        )

@app.post("/api/sap/iflows/{iflow_id}/execute-guidelines")
async def execute_design_guidelines(iflow_id: str, version: str) -> APIResponse:
    """Execute design guidelines for a specific integration flow"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info(f"Executing design guidelines for iFlow: {iflow_id}, version: {version}")
        result = await sap_client.execute_design_guidelines(iflow_id, version)

        return APIResponse(
            success=True,
            data=result,
            message=f"Successfully executed design guidelines for {iflow_id}",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to execute design guidelines: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute design guidelines: {str(e)}"
        )

@app.get("/api/sap/iflows/{iflow_id}/design-guidelines-with-execution/{execution_id}")
async def get_design_guidelines_by_execution(iflow_id: str, version: str, execution_id: str) -> APIResponse:
    """Get design guidelines execution results using specific execution ID"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info(f"Fetching design guidelines for iFlow: {iflow_id}, version: {version}, execution_id: {execution_id}")
        guidelines = await sap_client.get_design_guidelines(iflow_id, version, execution_id)

        return APIResponse(
            success=True,
            data=guidelines,
            message=f"Successfully retrieved design guidelines for execution {execution_id}",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to fetch design guidelines: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch design guidelines: {str(e)}"
        )

@app.get("/api/sap/iflows/{iflow_id}/resources")
async def get_iflow_resources(iflow_id: str, version: str) -> APIResponse:
    """Get resources/dependencies for a specific integration flow"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info(f"Fetching resources for iFlow: {iflow_id}, version: {version}")
        resources = await sap_client.get_iflow_resources(iflow_id, version)

        return APIResponse(
            success=True,
            data=resources,
            message=f"Successfully retrieved resources for {iflow_id}",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to fetch iflow resources: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch iflow resources: {str(e)}"
        )

@app.post("/api/sap/iflows/{iflow_id}/deploy")
async def deploy_iflow(iflow_id: str, version: str, target_environment: str) -> APIResponse:
    """Deploy integration flow to runtime"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info(f"Deploying iFlow: {iflow_id}, version: {version} to {target_environment}")
        result = await sap_client.deploy_iflow(iflow_id, version, target_environment)

        return APIResponse(
            success=True,
            data=result,
            message=f"Successfully deployed {iflow_id} to {target_environment}",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to deploy iflow: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to deploy iflow: {str(e)}"
        )

@app.get("/api/sap/iflows")
async def get_integration_flows(package_ids: Optional[str] = None) -> APIResponse:
    """Get Integration Flows from SAP Integration Suite

    Args:
        package_ids: Comma-separated list of package IDs to filter by (optional)
    """
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        # Parse package IDs if provided
        selected_package_ids = []
        if package_ids:
            selected_package_ids = [pkg_id.strip() for pkg_id in package_ids.split(',') if pkg_id.strip()]
            logger.info(f"Fetching Integration Flows from {len(selected_package_ids)} selected packages: {selected_package_ids}")
        else:
            logger.info("Fetching Integration Flows from all packages")

        iflows = await sap_client.get_integration_flows(selected_package_ids if selected_package_ids else None)

        return APIResponse(
            success=True,
            data=iflows,
            message=f"Successfully retrieved {len(iflows)} integration flows{f' from {len(selected_package_ids)} packages' if selected_package_ids else ''}",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to fetch iflows: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch integration flows: {str(e)}"
        )

@app.get("/api/sap/packages/paginated")
async def get_paginated_packages(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    search: Optional[str] = Query(None, description="Search term"),
    sort_field: str = Query("modifiedDate", description="Sort field"),
    sort_direction: str = Query("desc", description="Sort direction")
) -> APIResponse:
    """Get paginated integration packages with search and sorting"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info(f"Fetching paginated packages: page={page}, size={page_size}, search='{search}'")
        
        # Get all packages (for now - optimize later with SAP API pagination)
        all_packages = await sap_client.get_integration_packages()
        
        # Apply search filter
        filtered_packages = all_packages
        if search:
            search_lower = search.lower()
            filtered_packages = [
                pkg for pkg in all_packages
                if (search_lower in pkg.get('Name', '').lower() or 
                    search_lower in pkg.get('Description', '').lower() or
                    search_lower in pkg.get('ModifiedBy', '').lower())
            ]
        
        # Apply sorting
        def get_sort_value(pkg, field):
            field_map = {
                'name': pkg.get('Name', ''),
                'modifiedDate': int(pkg.get('ModifiedAt', '0') or '0'),
                'modifiedBy': pkg.get('ModifiedBy', ''),
                'createdDate': int(pkg.get('CreatedAt', '0') or '0'),
                'createdBy': pkg.get('CreatedBy', ''),
            }
            return field_map.get(field, pkg.get('Name', ''))
        
        reverse_sort = sort_direction.lower() == 'desc'
        filtered_packages.sort(
            key=lambda x: get_sort_value(x, sort_field), 
            reverse=reverse_sort
        )
        
        # Apply pagination
        total_count = len(filtered_packages)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_packages = filtered_packages[start_idx:end_idx]
        
        # Calculate pagination info
        total_pages = math.ceil(total_count / page_size)
        has_next = page < total_pages
        has_previous = page > 1
        
        response_data = {
            "packages": paginated_packages,
            "pagination": {
                "current_page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next_page": has_next,
                "has_previous_page": has_previous
            }
        }

        return APIResponse(
            success=True,
            data=response_data,
            message=f"Retrieved {len(paginated_packages)} packages (page {page} of {total_pages})",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to fetch paginated packages: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch paginated packages: {str(e)}"
        )
@app.get("/api/sap/base-tenant-data")
async def get_base_tenant_data() -> APIResponse:
    """Get complete base tenant data (packages + iflows)"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info("Fetching complete base tenant data from SAP")

        # Fetch packages and iflows in parallel for better performance
        packages_task = sap_client.get_integration_packages()
        iflows_task = sap_client.get_integration_flows()

        packages, iflows = await asyncio.gather(packages_task, iflows_task)

        base_tenant_data = BaseTenantData(
            tenant_id="ccci-sandbox-001",
            tenant_name="CCCI_SANDBOX",
            packages=packages,
            iflows=iflows,
            last_synced=datetime.now(),
            connection_status="connected"
        )

        return APIResponse(
            success=True,
            data=base_tenant_data.dict(),
            message=f"Successfully retrieved base tenant data: {len(packages)} packages, {len(iflows)} iflows",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to fetch base tenant data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch base tenant data: {str(e)}"
        )

@app.get("/api/sap/packages/{package_id}")
async def get_package_details(package_id: str) -> APIResponse:
    """Get detailed information about a specific integration package"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info(f"Fetching package details for: {package_id}")
        package_details = await sap_client.get_package_details(package_id)

        return APIResponse(
            success=True,
            data=package_details,
            message=f"Successfully retrieved package details for {package_id}",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to fetch package details: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=f"Package not found or failed to fetch: {str(e)}"
        )

@app.get("/api/sap/iflows/{iflow_id}")
async def get_iflow_details(iflow_id: str) -> APIResponse:
    """Get detailed information about a specific integration flow"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info(f"Fetching iflow details for: {iflow_id}")
        iflow_details = await sap_client.get_iflow_details(iflow_id)

        return APIResponse(
            success=True,
            data=iflow_details,
            message=f"Successfully retrieved iflow details for {iflow_id}",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to fetch iflow details: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=f"Integration flow not found or failed to fetch: {str(e)}"
        )

# Token Management Endpoints

@app.post("/api/sap/refresh-token")
async def refresh_sap_token() -> APIResponse:
    """Manually refresh SAP OAuth token"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        logger.info("Manually refreshing SAP OAuth token")
        await sap_client.refresh_token()

        return APIResponse(
            success=True,
            data={"token_refreshed": True},
            message="SAP OAuth token refreshed successfully",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to refresh token: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh token: {str(e)}"
        )

@app.get("/api/sap/token-status")
async def get_token_status() -> APIResponse:
    """Get current OAuth token status"""
    global sap_client

    if not sap_client:
        raise HTTPException(status_code=500, detail="SAP client not initialized")

    try:
        token_info = await sap_client.get_token_status()

        return APIResponse(
            success=True,
            data=token_info,
            message="Token status retrieved successfully",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Failed to get token status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get token status: {str(e)}"
        )

# Configuration Endpoints

@app.get("/api/config")
async def get_backend_config() -> APIResponse:
    """Get backend configuration information"""
    settings = get_settings()

    config_info = {
        "sap_base_url": settings.sap_base_url,
        "sap_token_url": settings.sap_token_url,
        "environment": settings.environment,
        "debug": settings.debug,
        "backend_version": "1.0.0",
        "supported_apis": [
            "Integration Packages",
            "Integration Flows",
            "Package Details",
            "iFlow Details",
            "Design Guidelines",
            "iFlow Configurations",
            "iFlow Resources"
        ]
    }

    return APIResponse(
        success=True,
        data=config_info,
        message="Backend configuration retrieved",
        timestamp=datetime.now().isoformat()
    )

# Error handlers

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "details": str(exc) if get_settings().debug else "An unexpected error occurred",
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )