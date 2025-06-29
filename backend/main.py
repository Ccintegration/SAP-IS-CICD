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
import math
from datetime import datetime, timedelta
import os
import json
import csv
from pathlib import Path
import base64
import uuid

from config import Settings, get_settings
from sap_client import SAPClient, SAPCredentials
from models import (
    IntegrationFlow,
    BaseTenantData,
    ConnectionTestResult,
    APIResponse,
    TenantConfig,
    IntegrationPackage,
    TransportRelease,
    TransportArtifact,
    TransportReleaseList,
    TransportArtifactList
)
from database import db_manager

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
    """Initialize SAP client and database on startup"""
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
    
    # Initialize database connection
    await db_manager.connect()
    logger.info("Database connection initialized successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await db_manager.close()
    logger.info("Database connection closed")

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
                    param_type = param_value['type']                # type: ignore
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
        guidelines = await sap_client.get_design_guidelines(iflow_id, version, execution_id)    # type: ignore

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

        print("Final flows returned to frontend:", iflows)  # Debug print

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
                if (search_lower in pkg.Name.lower() or                 # type: ignore
                    search_lower in pkg.Description.lower() or       # type: ignore
                    search_lower in pkg.ModifiedBy.lower())          # type: ignore
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
# type: ignore
        base_tenant_data = BaseTenantData(
            tenant_id="ccci-sandbox-001",
            tenant_name="CCCI_SANDBOX",
            packages=packages,
            iflows=iflows,
            last_synced=datetime.now(), # type: ignore  
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

# Deployment Models
class DeploymentArtifact(BaseModel):
    iflowId: str
    iflowName: str
    version: str
    packageId: str
    packageName: str

class BatchDeploymentRequest(BaseModel):
    artifacts: List[DeploymentArtifact]
    target_environment: str = "CCCI_PROD"
    deployment_id: Optional[str] = None

class DeploymentProgress(BaseModel):
    iflowId: str
    iflowName: str
    version: str
    packageId: str
    packageName: str
    uploadStatus: str = "pending"
    uploadProgress: int = 0
    configureStatus: str = "pending"
    configureProgress: int = 0
    deployStatus: str = "pending"
    deployProgress: int = 0
    overallStatus: str = "pending"
    message: str = "Ready for deployment"
    errorMessage: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None

class BatchDeploymentResponse(BaseModel):
    deployment_id: str
    target_environment: str
    total_artifacts: int
    status: str
    progress: List[DeploymentProgress]
    start_time: str
    estimated_completion: Optional[str] = None

# Global deployment tracking
deployment_sessions: Dict[str, BatchDeploymentResponse] = {}

@app.post("/api/sap/deploy/batch", response_model=BatchDeploymentResponse)
async def batch_deploy_artifacts(request: BatchDeploymentRequest) -> BatchDeploymentResponse:
    """Deploy multiple iFlows to target environment with real-time progress tracking"""
    global deployment_sessions

    try:
        # Generate deployment ID
        deployment_id = request.deployment_id or f"deploy_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(deployment_sessions)}"
        
        # Initialize deployment progress
        progress = [
            DeploymentProgress(
                iflowId=artifact.iflowId,
                iflowName=artifact.iflowName,
                version=artifact.version,
                packageId=artifact.packageId,
                packageName=artifact.packageName
            )
            for artifact in request.artifacts
        ]

        deployment_response = BatchDeploymentResponse(
            deployment_id=deployment_id,
            target_environment=request.target_environment,
            total_artifacts=len(request.artifacts),
            status="initialized",
            progress=progress,
            start_time=datetime.now().isoformat()
        )

        # Store deployment session
        deployment_sessions[deployment_id] = deployment_response

        # Start deployment process asynchronously
        asyncio.create_task(execute_batch_deployment(deployment_id, request.artifacts, request.target_environment))

        return deployment_response

    except Exception as e:
        logger.error(f"Failed to initialize batch deployment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize batch deployment: {str(e)}"
        )

async def execute_batch_deployment(deployment_id: str, artifacts: List[DeploymentArtifact], target_environment: str):
    """Execute batch deployment with real-time progress updates using parallel execution"""
    global deployment_sessions

    try:
        deployment = deployment_sessions[deployment_id]
        deployment.status = "in-progress"

        # Instantiate dynamic clients for both tenants
        source_tenant_info = load_tenant_credentials("CCCI_SANDBOX")
        target_tenant_info = load_tenant_credentials("CCCI_PROD")
        source_client = SAPDynamicClient(source_tenant_info)
        target_client = SAPDynamicClient(target_tenant_info)

        async def deploy_single_artifact(artifact: DeploymentArtifact, index: int):
            """Helper function to deploy a single artifact"""
            progress_item = deployment.progress[index]
            progress_item.overallStatus = "in-progress"
            progress_item.startTime = datetime.now().isoformat()
            progress_item.message = "Starting deployment process..."

            try:
                logger.info(f"🚀 [ParallelDeploy] Starting deployment for {artifact.iflowId}")

                # Step 1: Fetch artifact from CCCI_SANDBOX
                progress_item.uploadStatus = "fetching"
                progress_item.message = "Fetching artifact from CCCI_SANDBOX..."
                artifact_content = await source_client.fetch_iflow_artifact(artifact.iflowId, artifact.version)
                progress_item.uploadStatus = "completed"
                progress_item.uploadProgress = 100
                progress_item.message = "Artifact fetched, ensuring package exists in CCCI_PROD..."

                # Step 2: Ensure package exists in CCCI_PROD
                progress_item.configureStatus = "checking"
                progress_item.message = "Checking if package exists in CCCI_PROD..."
                package_exists = await target_client.package_exists(artifact.packageId)
                if not package_exists:
                    # Fetch package details from source
                    source_package_data = await source_client.get_package_details(artifact.packageId)
                    # Use only the 'd' property if present (OData)
                    if 'd' in source_package_data:
                        source_package_data = source_package_data['d']
                    await target_client.create_package_from_source(source_package_data)
                progress_item.configureStatus = "completed"
                progress_item.configureProgress = 100
                progress_item.message = "Package ready, uploading or updating iFlow..."

                # Step 3: Upload or update iFlow in CCCI_PROD
                iflow_exists = await target_client.iflow_exists(artifact.iflowId, artifact.version)
                if iflow_exists:
                    await target_client.update_iflow(artifact.iflowId, artifact.version, artifact.packageId, artifact_content, artifact.iflowName)
                else:
                    await target_client.upload_iflow(artifact.iflowId, artifact.version, artifact.packageId, artifact_content, artifact.iflowName)
                progress_item.message = "iFlow uploaded/updated, applying configuration..."

                # Step 4: Apply configuration from CSV
                progress_item.configureStatus = "configuring"
                progress_item.message = "Applying configuration parameters..."
                # Map tenant to ENV folder
                if target_environment == "CCCI_PROD":
                    env_folder = "PRD"
                elif target_environment == "CCCI_SANDBOX":
                    env_folder = "SANDBOX"
                else:
                    env_folder = target_environment  # fallback, e.g., DEV, TST
                config_csv_path = os.path.join(os.path.dirname(__file__), "configurations", env_folder, "iflow_configuration.csv")
                parameters = []
                with open(config_csv_path, newline="") as csvfile:
                    reader = csv.DictReader(csvfile, delimiter="|")
                    for row in reader:
                        if row["iFlow_ID"] == artifact.iflowId and row["iFlow_Version"] == artifact.version:
                            parameters.append(row)
                if parameters:
                    await target_client.batch_update_iflow_config(artifact.iflowId, artifact.version, parameters)
                    progress_item.configureStatus = "completed"
                    progress_item.configureProgress = 100
                    progress_item.message = "Configuration applied successfully. Ready to deploy."
                else:
                    progress_item.configureStatus = "failed"
                    progress_item.message = "No configuration parameters found for this iFlow/version."
                    progress_item.errorMessage = "No configuration parameters found."
                    progress_item.configureProgress = 0

                # Step 5: Deploy iFlow in CCCI_PROD
                progress_item.deployStatus = "deploying"
                progress_item.deployProgress = 10
                progress_item.message = "Deploying iFlow to runtime..."
                deploy_result = await target_client.deploy_iflow(artifact.iflowId, artifact.version, target_environment)
                if deploy_result.get("status") == "deployed":
                    progress_item.deployStatus = "completed"
                    progress_item.deployProgress = 100
                    progress_item.message = deploy_result.get("message", "Deployment started.")
                    progress_item.overallStatus = "completed"
                    progress_item.endTime = datetime.now().isoformat()
                    logger.info(f"✅ [ParallelDeploy] Successfully deployed {artifact.iflowId}")
                else:
                    progress_item.deployStatus = "failed"
                    progress_item.deployProgress = 0
                    progress_item.message = deploy_result.get("message", "Deployment failed.")
                    progress_item.errorMessage = deploy_result.get("message", "Deployment failed.")
                    progress_item.overallStatus = "failed"
                    progress_item.endTime = datetime.now().isoformat()
                    logger.error(f"❌ [ParallelDeploy] Failed to deploy {artifact.iflowId}")

            except Exception as e:
                logger.error(f"❌ [ParallelDeploy] Failed to deploy artifact {artifact.iflowId}: {str(e)}")
                progress_item.overallStatus = "failed"
                progress_item.errorMessage = str(e)
                progress_item.message = f"Deployment failed: {str(e)}"
                progress_item.endTime = datetime.now().isoformat()

        # Deploy all artifacts in parallel
        logger.info(f"🚀 [ParallelDeploy] Starting parallel deployment of {len(artifacts)} artifacts")
        deployment_tasks = [deploy_single_artifact(artifact, i) for i, artifact in enumerate(artifacts)]
        await asyncio.gather(*deployment_tasks, return_exceptions=True)
        
        logger.info(f"✅ [ParallelDeploy] All {len(artifacts)} artifacts processed in parallel")

        # Update final deployment status
        completed_count = sum(1 for p in deployment.progress if p.overallStatus == "completed")
        failed_count = sum(1 for p in deployment.progress if p.overallStatus == "failed")
        
        if failed_count == 0:
            deployment.status = "completed"
        elif completed_count == 0:
            deployment.status = "failed"
        else:
            deployment.status = "partial"

        deployment.estimated_completion = datetime.now().isoformat()

    except Exception as e:
        logger.error(f"❌ [ParallelDeploy] Batch deployment failed: {str(e)}")
        deployment.status = "failed"
        deployment.estimated_completion = datetime.now().isoformat()

@app.get("/api/sap/deploy/status/{deployment_id}", response_model=BatchDeploymentResponse)
async def get_deployment_status(deployment_id: str) -> BatchDeploymentResponse:
    """Get real-time deployment status and progress"""
    global deployment_sessions

    if deployment_id not in deployment_sessions:
        raise HTTPException(status_code=404, detail="Deployment session not found")

    return deployment_sessions[deployment_id]

@app.get("/api/sap/deploy/sessions")
async def list_deployment_sessions() -> APIResponse:
    """List all active deployment sessions"""
    global deployment_sessions

    sessions = []
    for deployment_id, deployment in deployment_sessions.items():
        completed_count = sum(1 for p in deployment.progress if p.overallStatus == "completed")
        failed_count = sum(1 for p in deployment.progress if p.overallStatus == "failed")
        
        sessions.append({
            "deployment_id": deployment_id,
            "target_environment": deployment.target_environment,
            "total_artifacts": deployment.total_artifacts,
            "completed_artifacts": completed_count,
            "failed_artifacts": failed_count,
            "status": deployment.status,
            "start_time": deployment.start_time,
            "estimated_completion": deployment.estimated_completion
        })

    return APIResponse(
        success=True,
        data=sessions,
        message=f"Retrieved {len(sessions)} deployment sessions",
        timestamp=datetime.now().isoformat()
    )

# Transport Release API Endpoints

@app.get("/api/transport-releases", response_model=APIResponse)
async def get_transport_releases():
    """Get all transport releases from the database"""
    try:
        logger.info("Fetching transport releases from database")
        transport_releases = await db_manager.get_transport_releases()
        
        return APIResponse(
            success=True,
            data=TransportReleaseList(
                transport_releases=transport_releases,
                total_count=len(transport_releases)
            ),
            message=f"Successfully fetched {len(transport_releases)} transport releases"
        )
    except Exception as e:
        logger.error(f"Failed to fetch transport releases: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch transport releases: {str(e)}"
        )

@app.get("/api/transport-releases/{transport_release_id}", response_model=APIResponse)
async def get_transport_release(transport_release_id: str):
    """Get a specific transport release by ID"""
    try:
        logger.info(f"Fetching transport release: {transport_release_id}")
        transport_release = await db_manager.get_transport_release_by_id(transport_release_id)
        
        if not transport_release:
            raise HTTPException(
                status_code=404,
                detail=f"Transport release with ID {transport_release_id} not found"
            )
        
        return APIResponse(
            success=True,
            data=transport_release,
            message="Successfully fetched transport release"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch transport release {transport_release_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch transport release: {str(e)}"
        )

@app.get("/api/transport-releases/{transport_release_id}/artifacts", response_model=APIResponse)
async def get_transport_release_artifacts(transport_release_id: str):
    """Get all artifacts for a specific transport release"""
    try:
        logger.info(f"Fetching artifacts for transport release: {transport_release_id}")
        
        # Get transport release details
        transport_release = await db_manager.get_transport_release_by_id(transport_release_id)
        if not transport_release:
            raise HTTPException(
                status_code=404,
                detail=f"Transport release with ID {transport_release_id} not found"
            )
        
        # Get artifacts
        artifacts = await db_manager.get_transport_release_artifacts(transport_release_id)
        
        return APIResponse(
            success=True,
            data=TransportArtifactList(
                artifacts=artifacts,
                total_count=len(artifacts),
                transport_release=transport_release
            ),
            message=f"Successfully fetched {len(artifacts)} artifacts for transport release"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch artifacts for transport release {transport_release_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch transport release artifacts: {str(e)}"
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

def load_tenant_credentials(tenant_name: str):
    tenants_path = os.path.join(os.path.dirname(__file__), "tenants.json")
    with open(tenants_path, "r") as f:
        tenants = json.load(f)
    if tenant_name not in tenants:
        raise Exception(f"Tenant '{tenant_name}' not found in tenants.json")
    return tenants[tenant_name]

class SAPDynamicClient:
    """A dynamic SAP client that can be instantiated with different credentials."""
    def __init__(self, tenant_info):
        self.base_url = tenant_info["baseUrl"]
        self.client_id = tenant_info["oauthCredentials"]["clientId"]
        self.client_secret = tenant_info["oauthCredentials"]["clientSecret"]
        self.token_url = tenant_info["oauthCredentials"]["tokenUrl"]
        self.oauth_token = None
        self.token_expiry = None

    async def _get_auth_headers(self):
        if not self.oauth_token or self._is_token_expired():
            await self._refresh_token()
        return {
            "Authorization": f"Bearer {self.oauth_token}",
            "Accept": "application/json"
        }

    def _is_token_expired(self):
        if not self.token_expiry:
            return True
        return datetime.now() + timedelta(seconds=60) >= self.token_expiry

    async def _refresh_token(self):
        logger.info(f"Requesting new access token for {self.base_url}")
        auth = (self.client_id, self.client_secret)
        data = {"grant_type": "client_credentials"}
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, auth=auth, data=data)
            response.raise_for_status()
            token_data = response.json()
            self.oauth_token = token_data["access_token"]
            expires_in = int(token_data["expires_in"])
            self.token_expiry = datetime.now() + timedelta(seconds=expires_in)
            logger.info("Successfully obtained access token")

    async def fetch_iflow_artifact(self, iflow_id, version):
        # Download iFlow artifact from source tenant
        endpoint = f"/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')/$value"
        url = self.base_url + endpoint
        headers = await self._get_auth_headers()
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.content  # Return binary artifact

    async def package_exists(self, package_id):
        endpoint = f"/api/v1/IntegrationPackages('{package_id}')"
        url = self.base_url + endpoint
        headers = await self._get_auth_headers()
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            return response.status_code == 200

    async def get_package_details(self, package_id):
        endpoint = f"/api/v1/IntegrationPackages('{package_id}')"
        url = self.base_url + endpoint
        headers = await self._get_auth_headers()
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()

    async def create_package_from_source(self, source_package_data):
        # Only include allowed fields for creation
        allowed_fields = [
            "Id", "Name", "ShortText", "Description", "Vendor", "SupportedPlatform",
            "Version", "Products", "Keywords", "Countries", "Industries", "LineOfBusiness"
        ]
        payload = {k: v for k, v in source_package_data.items() if k in allowed_fields and v}
        endpoint = "/api/v1/IntegrationPackages"
        url = self.base_url + endpoint
        headers = await self._get_auth_headers()
        headers["Content-Type"] = "application/json"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.status_code == 201

    async def iflow_exists(self, iflow_id, version):
        endpoint = f"/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')"
        url = self.base_url + endpoint
        headers = await self._get_auth_headers()
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            return response.status_code == 200

    async def upload_iflow(self, iflow_id, version, package_id, artifact_content, iflow_name=None):
        # Create iFlow artifact in target tenant (POST with base64-encoded content in JSON body)
        endpoint = f"/api/v1/IntegrationDesigntimeArtifacts"
        url = self.base_url + endpoint
        headers = await self._get_auth_headers()
        headers["Content-Type"] = "application/json"
        artifact_b64 = base64.b64encode(artifact_content).decode("utf-8")
        payload = {
            "Name": iflow_name or iflow_id,
            "Id": iflow_id,
            "PackageId": package_id,
            "ArtifactContent": artifact_b64
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code not in [200, 201, 202]:
                raise Exception(f"Failed to upload iFlow: {response.status_code} {response.text}")
            return True

    async def update_iflow(self, iflow_id, version, package_id, artifact_content, iflow_name=None):
        # Update iFlow artifact in target tenant (PUT with JSON body and base64-encoded content)
        endpoint = f"/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')"
        url = self.base_url + endpoint
        headers = await self._get_auth_headers()
        headers["Content-Type"] = "application/json"
        headers["Accept"] = "application/json"
        artifact_b64 = base64.b64encode(artifact_content).decode("utf-8")
        payload = {
            "Name": iflow_name or iflow_id,
            "ArtifactContent": artifact_b64
        }
        async with httpx.AsyncClient() as client:
            response = await client.put(url, headers=headers, json=payload)
            if response.status_code not in [200, 201, 202]:
                raise Exception(f"Failed to update iFlow: {response.status_code} {response.text}")
            return True

    async def update_iflow_config_param(self, iflow_id, version, param_key, param_value, param_type, csrf_token=None):
        # Update a single configuration parameter
        endpoint = f"/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')/$links/Configurations('{param_key}')"
        url = self.base_url + endpoint
        headers = await self._get_auth_headers()
        headers["Content-Type"] = "application/json"
        headers["Accept"] = "application/json"
        if csrf_token:
            headers["x-csrf-token"] = csrf_token
        payload = {
            "ParameterKey": param_key,
            "ParameterValue": param_value,
            "DataType": param_type
        }
        async with httpx.AsyncClient() as client:
            response = await client.put(url, headers=headers, json=payload)
            if response.status_code not in [200, 201, 202]:
                raise Exception(f"Failed to update parameter '{param_key}': {response.status_code} {response.text}")
            return True

    async def batch_update_iflow_config(self, iflow_id, version, parameters, csrf_token=None):
        # Update each parameter individually and report failures
        logger.info(f"Starting single-parameter configuration update for iFlow: {iflow_id}, version: {version}")
        logger.info(f"Processing {len(parameters)} configuration parameters")
        failures = []
        for i, param in enumerate(parameters):
            param_key = param["Parameter_Key"]
            param_value = param["Parameter_Value"]
            param_type = param["Parameter_Type"]
            logger.info(f"Updating parameter {i+1}/{len(parameters)}: Key='{param_key}', Value='{param_value}', Type='{param_type}'")
            try:
                await self.update_iflow_config_param(iflow_id, version, param_key, param_value, param_type, csrf_token)
                logger.info(f"Successfully updated parameter '{param_key}'")
            except Exception as e:
                logger.error(str(e))
                failures.append({
                    "ParameterKey": param_key,
                    "Error": str(e)
                })
        if failures:
            logger.error(f"Failed to update {len(failures)} parameters: {failures}")
            raise Exception(f"Some parameters failed to update: {failures}")
        logger.info(f"All configuration parameters updated successfully for iFlow: {iflow_id}")
        return True

    async def deploy_iflow(self, iflow_id, version, target_environment=None):
        # Deploy integration flow to runtime (activate it) using correct SAP endpoint and query params
        logger.info(f"Deploying iFlow: {iflow_id}, version: {version} to {target_environment or self.base_url}")
        # Both Id and Version must be in single quotes in the query string
        url = f"{self.base_url}/api/v1/DeployIntegrationDesigntimeArtifact?Id='" + iflow_id + "'&Version='" + version + "'"
        headers = await self._get_auth_headers()
        headers["x-csrf-token"] = "fetch"  # Let SAP handle token fetch if not present
        headers["Accept"] = "application/json"
        # No JSON body required
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers)
            if response.status_code in [200, 202]:
                logger.info(f"Successfully triggered deployment for {iflow_id}")
                return {
                    "status": "deployed",
                    "message": f"Deployment started for {iflow_id}",
                    "target_environment": target_environment or self.base_url,
                    "deployment_id": response.headers.get("Location", "")
                }
            else:
                logger.warning(f"Failed to deploy {iflow_id}: {response.status_code}")
                return {
                    "status": "failed",
                    "message": f"Deployment failed: {response.status_code} {response.text}",
                    "target_environment": target_environment or self.base_url
                }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )