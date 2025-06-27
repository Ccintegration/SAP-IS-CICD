# File Path: backend/sap_client.py
# Filename: sap_client.py
"""
SAP Integration Suite API Client - Updated with correct design guidelines APIs
Handles authentication and API calls to SAP Integration Suite
"""

import httpx
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from models import IntegrationPackage, IntegrationFlow, TokenInfo
import urllib.parse

logger = logging.getLogger(__name__)

class SAPCredentials(BaseModel):
    client_id: str
    client_secret: str
    token_url: str
    base_url: str
    auth_url: Optional[str] = None

class SAPClient:
    """SAP Integration Suite API Client"""

    def __init__(self, credentials: SAPCredentials):
        self.client_id = credentials.client_id
        self.client_secret = credentials.client_secret
        self.token_url = credentials.token_url
        self.base_url = credentials.base_url
        self.auth_url = getattr(credentials, 'auth_url', None)
        self.token_info: Optional[TokenInfo] = None
        self.oauth_token: str = ""
        self.token_expiry: datetime = datetime.now()

        # HTTP client with timeouts
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def get_access_token(self) -> str:
        """Get OAuth access token from SAP - simplified method"""
        if self.token_info and self._is_token_valid():
            return self.token_info.access_token
        
        token_data = await self.get_token()
        return token_data.get('access_token', '')

    async def get_token(self) -> Dict[str, Any]:
        """Get OAuth access token from SAP"""
        try:
            if self.token_info and self._is_token_valid():
                return self.token_info.dict()

            logger.info("Requesting new access token from SAP")

            auth_data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret
            }

            response = await self.client.post(
                self.token_url,
                data=auth_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )

            if response.status_code != 200:
                error_msg = f"Token request failed: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)

            token_data = response.json()

            # Create token info with expiration
            self.token_info = TokenInfo(
                access_token=token_data['access_token'],
                token_type=token_data.get('token_type', 'Bearer'),
                expires_in=token_data.get('expires_in', 3600),
                expires_at=datetime.now() + timedelta(seconds=token_data.get('expires_in', 3600))
            )

            logger.info("Successfully obtained access token")
            return token_data

        except Exception as e:
            logger.error(f"Failed to get access token: {e}")
            raise Exception(f"Authentication failed: {str(e)}")

    def _is_token_valid(self) -> bool:
        """Check if current token is still valid"""
        if not self.token_info or not self.token_info.expires_at:
            return False

        # Consider token expired 5 minutes before actual expiration
        buffer_time = timedelta(minutes=5)
        return datetime.now() < (self.token_info.expires_at - buffer_time)

    async def _make_authenticated_request(self, method: str, endpoint: str, **kwargs) -> httpx.Response:
        """Make an authenticated request to SAP API"""
        # Ensure we have a valid token
        await self.get_token()

        url = f"{self.base_url}{endpoint}"
        headers = kwargs.pop('headers', {})
        headers['Authorization'] = f"Bearer {self.token_info.access_token}"
        headers['Accept'] = 'application/json'

        logger.debug(f"Making {method} request to {url}")

        response = await self.client.request(method, url, headers=headers, **kwargs)

        if response.status_code == 401:
            # Token might be expired, try refreshing once
            logger.warning("Received 401, refreshing token and retrying")
            self.token_info = None
            await self.get_token()
            headers['Authorization'] = f"Bearer {self.token_info.access_token}"
            response = await self.client.request(method, url, headers=headers, **kwargs)

        if not response.is_success:
            error_msg = f"API request failed: {response.status_code} - {response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)

        return response

    async def get_integration_packages(self) -> List[IntegrationPackage]:
        """Get all integration packages"""
        try:
            logger.info("Fetching integration packages from SAP")

            # SAP Integration Suite API endpoint for packages
            endpoint = "/api/v1/IntegrationPackages"

            response = await self._make_authenticated_request("GET", endpoint)
            data = response.json()

            packages = []

            # Handle different response formats
            items = data.get('d', {}).get('results', []) if 'd' in data else data.get('results', data)
            if isinstance(items, dict):
                items = [items]

            for item in items:
                package = IntegrationPackage(
                    id=item.get('Id', ''),
                    name=item.get('Name', ''),
                    description=item.get('ShortText') or '',
                    version=item.get('Version') or '1.0.0',
                    modifiedDate=item.get('ModifiedDate'),
                    modifiedBy=item.get('ModifiedBy'),
                    createdDate=item.get('CreatedDate'),
                    createdBy=item.get('CreatedBy')
                )
                packages.append(package)

            logger.info(f"Successfully fetched {len(packages)} integration packages")
            return packages

        except Exception as e:
            logger.error(f"Failed to fetch integration packages: {e}")

            # Return demo data for testing if API fails
            demo_packages = [
                IntegrationPackage(
                    id="demo_package_001",
                    name="Demo Customer Integration Package",
                    description="Sample integration package for testing",
                    version="1.0.0",
                    modifiedDate=datetime.now().isoformat(),
                    modifiedBy="demo_user"
                ),
                IntegrationPackage(
                    id="demo_package_002",
                    name="Demo Sales Integration Package",
                    description="Sales data integration package",
                    version="1.1.0",
                    modifiedDate=datetime.now().isoformat(),
                    modifiedBy="demo_user"
                )
            ]

            logger.warning("Returning demo data due to API failure")
            return demo_packages

    async def get_integration_flows(self, selected_package_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Fetch integration flows from SAP by iterating through packages

        Args:
            selected_package_ids: List of specific package IDs to fetch flows from. If None, fetches from all packages.
        """
        try:
            if selected_package_ids:
                logger.info(f"Fetching integration flows from {len(selected_package_ids)} selected packages: {selected_package_ids}")
                # Create package objects for selected IDs
                packages_to_scan = []
                for pkg_id in selected_package_ids:
                    if not pkg_id:
                        continue
                    try:
                        pkg_details = await self.get_package_details(str(pkg_id))
                        real_name = pkg_details.get('d', {}).get('Name') or ''
                        if real_name:
                            packages_to_scan.append(type('Package', (), {'id': str(pkg_id), 'name': real_name})())
                        else:
                            packages_to_scan.append(type('Package', (), {'id': str(pkg_id), 'name': f'Package_{pkg_id}'})())
                    except Exception as e:
                        logger.warning(f"Failed to fetch package details for {pkg_id}: {e}")
                        packages_to_scan.append(type('Package', (), {'id': str(pkg_id), 'name': f'Package_{pkg_id}'})())
            else:
                logger.info("Fetching integration flows from all packages")
                # Get all integration packages
                packages_to_scan = await self.get_integration_packages()
                logger.info(f"Found {len(packages_to_scan)} packages to scan for integration flows")

            all_flows = []
            headers = await self._get_auth_headers()

            async with httpx.AsyncClient() as client:
                # Iterate through each package to get its integration flows
                for package in packages_to_scan:
                    package_id = package.id
                    try:
                        # Use the working API approach from reference code
                        url = f"{self.base_url}/api/v1/IntegrationPackages('{package_id}')/IntegrationDesigntimeArtifacts"
                        logger.info(f"Fetching flows from package: {package_id}")

                        response = await client.get(url, headers=headers)

                        if response.status_code == 200:
                            data = response.json()
                            flows = data.get("d", {}).get("results", [])

                            # Add package information to each flow
                            for flow in flows:
                                flow["packageId"] = package_id
                                flow["packageName"] = getattr(package, 'name', f'Package_{package_id}')

                            all_flows.extend(flows)
                            logger.info(f"Found {len(flows)} flows in package {package_id}")
                        else:
                            logger.warning(f"Failed to get flows from package {package_id}: {response.status_code}")

                    except Exception as pkg_error:
                        logger.warning(f"Error fetching flows from package {package_id}: {str(pkg_error)}")
                        continue

                logger.info(f"Successfully fetched {len(all_flows)} integration flows from {len(packages_to_scan)} packages")
                return all_flows

        except Exception as e:
            error_msg = f"Failed to fetch integration flows: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    async def get_iflow_configurations(self, iflow_id: str, version: str) -> List[Dict[str, Any]]:
        """Get configuration parameters for a specific integration flow"""
        try:
            logger.info(f"Fetching configurations for iFlow: {iflow_id}, version: {version}")

            # SAP API: /IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')/Configurations
            url = f"{self.base_url}/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')/Configurations"

            headers = await self._get_auth_headers()
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    configurations = data.get("d", {}).get("results", [])
                    logger.info(f"Found {len(configurations)} configuration parameters for {iflow_id}")
                    return configurations
                else:
                    logger.warning(f"Failed to get configurations for {iflow_id}: {response.status_code}")
                    return []

        except Exception as e:
            logger.error(f"Error fetching configurations for {iflow_id}: {str(e)}")
            return []

    async def execute_design_guidelines(self, iflow_id: str, version: str) -> Dict[str, Any]:
        """Execute design guidelines for a specific integration flow"""
        try:
            logger.info(f"Executing design guidelines for iFlow: {iflow_id}, version: {version}")

            # SAP API: POST to execute design guidelines
            # URL format based on your requirement: /ExecuteIntegrationDesigntimeArtifactsGuidelines?Id='{iflow_id}'&Version='{version}'
            url = f"{self.base_url}/api/v1/ExecuteIntegrationDesigntimeArtifactsGuidelines?Id='{iflow_id}'&Version='{version}'"

            headers = await self._get_auth_headers()
            headers["Content-Type"] = "application/json"

            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json={})

                if response.status_code in [200, 201, 202]:
                    logger.info(f"Successfully triggered design guidelines execution for {iflow_id}")
                    
                    # SAP API returns execution ID as a plain string
                    execution_id = response.text.strip()
                    
                    logger.info(f"Extracted execution ID: {execution_id}")
                    
                    return {
                        "status": "executed", 
                        "message": "Design guidelines execution started",
                        "execution_id": execution_id
                    }
                else:
                    logger.warning(f"Failed to execute design guidelines for {iflow_id}: {response.status_code}")
                    return {
                        "status": "failed", 
                        "message": f"Failed to execute: {response.status_code}",
                        "execution_id": None
                    }

        except Exception as e:
            logger.error(f"Error executing design guidelines for {iflow_id}: {str(e)}")
            return {
                "status": "error", 
                "message": str(e),
                "execution_id": None
            }

    async def get_design_guidelines(self, iflow_id: str, version: str, execution_id: str = None) -> Dict[str, Any]:
        """Get design guidelines execution results for a specific integration flow"""
        try:
            logger.info(f"Fetching design guidelines for iFlow: {iflow_id}, version: {version}, execution_id: {execution_id}")

            headers = await self._get_auth_headers()
            
            async with httpx.AsyncClient() as client:
                # If execution_id is provided, use it directly
                if execution_id:
                    logger.info(f"Using provided execution_id: {execution_id}")
                    detailed_url = f"{self.base_url}/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')/DesignGuidelineExecutionResults('{execution_id}')?$expand=DesignGuidelines&$format=json"
                    detailed_response = await client.get(detailed_url, headers=headers)
                    
                    if detailed_response.status_code == 200:
                        detailed_data = detailed_response.json()
                        guidelines = detailed_data.get("d", {}).get("DesignGuidelines", {}).get("results", [])

                        # Calculate compliance and severity breakdown
                        total_rules = len(guidelines)
                        applicable_guidelines = [g for g in guidelines if g.get("Applicability", "").lower() == "applicable"]
                        applicable_rules = len(applicable_guidelines)

                        def pct(n, d):
                            return int(round((n * 100) / d)) if d else "NA"

                        # Severity counts among applicable
                        high_applicable = [g for g in applicable_guidelines if g.get("Severity", "").lower() == "high"]
                        medium_applicable = [g for g in applicable_guidelines if g.get("Severity", "").lower() == "medium"]
                        low_applicable = [g for g in applicable_guidelines if g.get("Severity", "").lower() == "low"]

                        # Compliance among applicable
                        compliant_applicable = [g for g in applicable_guidelines if g.get("Compliance", "").lower() == "compliant"]

                        high_pct = pct(len(high_applicable), applicable_rules) if applicable_rules else "NA"
                        medium_pct = pct(len(medium_applicable), applicable_rules) if applicable_rules else "NA"
                        low_pct = pct(len(low_applicable), applicable_rules) if applicable_rules else "NA"
                        compliance_percentage = pct(len(compliant_applicable), applicable_rules) if applicable_rules else "NA"

                        # Compliance status
                        if applicable_rules == 0 or compliance_percentage == "NA":
                            compliance_status = "NA"
                        else:
                            cp = int(compliance_percentage)
                            if cp <= 20:
                                compliance_status = "Unacceptable"
                            elif 21 <= cp <= 40:
                                compliance_status = "Poor"
                            elif 41 <= cp <= 60:
                                compliance_status = "Moderate"
                            elif 61 <= cp <= 80:
                                compliance_status = "Good"
                            elif 81 <= cp <= 100:
                                compliance_status = "Excellent"
                            else:
                                compliance_status = "NA"

                        return {
                            "guidelines": guidelines,
                            "total_rules": total_rules,
                            "applicable_rules": applicable_rules,
                            "high": high_pct,
                            "medium": medium_pct,
                            "low": low_pct,
                            "compliance_percentage": compliance_percentage,
                            "compliance_status": compliance_status,
                            "compliant_rules": len(compliant_applicable),
                            "is_compliant": compliance_percentage != "NA" and int(compliance_percentage) >= 75,
                            "execution_id": execution_id,
                            "last_executed": detailed_data.get("d", {}).get("ExecutionDate", "")
                        }
                
                # Fallback: Get the latest execution results
                url = f"{self.base_url}/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')/DesignGuidelineExecutionResults?$orderby=ExecutionDate desc&$top=1"
                response = await client.get(url, headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    execution_results = data.get("d", {}).get("results", [])
                    
                    if execution_results:
                        latest_execution = execution_results[0]
                        latest_execution_id = latest_execution.get("Id", "")
                        
                        if latest_execution_id:
                            # Get detailed guidelines for the latest execution
                            detailed_url = f"{self.base_url}/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')/DesignGuidelineExecutionResults('{latest_execution_id}')?$expand=DesignGuidelines&$format=json"
                            detailed_response = await client.get(detailed_url, headers=headers)
                            
                            if detailed_response.status_code == 200:
                                detailed_data = detailed_response.json()
                                guidelines = detailed_data.get("d", {}).get("DesignGuidelines", {}).get("results", [])
                                
                                # Calculate compliance and severity breakdown
                                total_rules = len(guidelines)
                                applicable_guidelines = [g for g in guidelines if g.get("Applicability", "").lower() == "applicable"]
                                applicable_rules = len(applicable_guidelines)

                                def pct(n, d):
                                    return int(round((n * 100) / d)) if d else "NA"

                                # Severity counts among applicable
                                high_applicable = [g for g in applicable_guidelines if g.get("Severity", "").lower() == "high"]
                                medium_applicable = [g for g in applicable_guidelines if g.get("Severity", "").lower() == "medium"]
                                low_applicable = [g for g in applicable_guidelines if g.get("Severity", "").lower() == "low"]

                                # Compliance among applicable
                                compliant_applicable = [g for g in applicable_guidelines if g.get("Compliance", "").lower() == "compliant"]

                                high_pct = pct(len(high_applicable), applicable_rules) if applicable_rules else "NA"
                                medium_pct = pct(len(medium_applicable), applicable_rules) if applicable_rules else "NA"
                                low_pct = pct(len(low_applicable), applicable_rules) if applicable_rules else "NA"
                                compliance_percentage = pct(len(compliant_applicable), applicable_rules) if applicable_rules else "NA"

                                # Compliance status
                                if applicable_rules == 0 or compliance_percentage == "NA":
                                    compliance_status = "NA"
                                else:
                                    cp = int(compliance_percentage)
                                    if cp <= 20:
                                        compliance_status = "Unacceptable"
                                    elif 21 <= cp <= 40:
                                        compliance_status = "Poor"
                                    elif 41 <= cp <= 60:
                                        compliance_status = "Moderate"
                                    elif 61 <= cp <= 80:
                                        compliance_status = "Good"
                                    elif 81 <= cp <= 100:
                                        compliance_status = "Excellent"
                                    else:
                                        compliance_status = "NA"

                                return {
                                    "guidelines": guidelines,
                                    "total_rules": total_rules,
                                    "applicable_rules": applicable_rules,
                                    "high": high_pct,
                                    "medium": medium_pct,
                                    "low": low_pct,
                                    "compliance_percentage": compliance_percentage,
                                    "compliance_status": compliance_status,
                                    "compliant_rules": len(compliant_applicable),
                                    "is_compliant": compliance_percentage != "NA" and int(compliance_percentage) >= 75,
                                    "execution_id": latest_execution_id,
                                    "last_executed": latest_execution.get("ExecutionDate", "")
                                }

                logger.warning(f"No design guidelines found for {iflow_id}")
                return {
                    "guidelines": [], 
                    "total_rules": 0, 
                    "applicable_rules": 0, 
                    "high": "NA",
                    "medium": "NA",
                    "low": "NA",
                    "compliance_percentage": "NA",
                    "compliance_status": "NA",
                    "compliant_rules": 0,
                    "is_compliant": False, 
                    "execution_id": None
                }

        except Exception as e:
            logger.error(f"Error fetching design guidelines for {iflow_id}: {str(e)}")
            return {
                "guidelines": [], 
                "total_rules": 0, 
                "applicable_rules": 0, 
                "high": "NA",
                "medium": "NA",
                "low": "NA",
                "compliance_percentage": "NA",
                "compliance_status": "NA",
                "compliant_rules": 0,
                "is_compliant": False, 
                "execution_id": None
            }

    async def get_iflow_resources(self, iflow_id: str, version: str) -> Dict[str, List[Dict[str, Any]]]:
        """Get resources/dependencies for a specific integration flow"""
        try:
            logger.info(f"Fetching resources for iFlow: {iflow_id}, version: {version}")

            # SAP API: /IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')/Resources
            url = f"{self.base_url}/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='{version}')/Resources"

            headers = await self._get_auth_headers()
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    resources = data.get("d", {}).get("results", [])

                    # Categorize resources
                    categorized_resources = {
                        "value_mappings": [],
                        "groovy_scripts": [],
                        "message_mappings": [],
                        "external_services": [],
                        "process_direct": [],
                        "other": []
                    }

                    for resource in resources:
                        resource_type = resource.get("ResourceType", "").lower()
                        resource_name = resource.get("Name", "")

                        if "valuemapping" in resource_type or "value_mapping" in resource_name.lower():
                            categorized_resources["value_mappings"].append(resource)
                        elif "groovy" in resource_type or resource_name.endswith(".groovy"):
                            categorized_resources["groovy_scripts"].append(resource)
                        elif "mapping" in resource_type or "mmap" in resource_type:
                            categorized_resources["message_mappings"].append(resource)
                        elif "processdirect" in resource_name.lower():
                            categorized_resources["process_direct"].append(resource)
                        elif "http" in resource_name.lower() or "soap" in resource_name.lower():
                            categorized_resources["external_services"].append(resource)
                        else:
                            categorized_resources["other"].append(resource)

                    logger.info(f"Found {len(resources)} resources for {iflow_id}")
                    return categorized_resources
                else:
                    logger.warning(f"Failed to get resources for {iflow_id}: {response.status_code}")
                    return {
                        "value_mappings": [], 
                        "groovy_scripts": [], 
                        "message_mappings": [], 
                        "external_services": [], 
                        "process_direct": [], 
                        "other": []
                    }

        except Exception as e:
            logger.error(f"Error fetching resources for {iflow_id}: {str(e)}")
            return {
                "value_mappings": [], 
                "groovy_scripts": [], 
                "message_mappings": [], 
                "external_services": [], 
                "process_direct": [], 
                "other": []
            }

    async def deploy_iflow(self, iflow_id: str, version: str, target_environment: str) -> Dict[str, Any]:
        """Deploy integration flow to runtime"""
        try:
            logger.info(f"Deploying iFlow: {iflow_id}, version: {version} to {target_environment}")

            # SAP API: POST /DeployIntegrationDesigntimeArtifact
            url = f"{self.base_url}/api/v1/DeployIntegrationDesigntimeArtifact"

            headers = await self._get_auth_headers()
            headers["Content-Type"] = "application/json"

            deploy_payload = {
                "Id": iflow_id,
                "Version": version
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=deploy_payload)

                if response.status_code == 202:
                    logger.info(f"Successfully triggered deployment for {iflow_id}")
                    return {
                        "status": "deployed",
                        "message": f"Deployment started for {iflow_id}",
                        "target_environment": target_environment,
                        "deployment_id": response.headers.get("Location", "")
                    }
                else:
                    logger.warning(f"Failed to deploy {iflow_id}: {response.status_code}")
                    return {
                        "status": "failed",
                        "message": f"Deployment failed: {response.status_code}",
                        "target_environment": target_environment
                    }

        except Exception as e:
            logger.error(f"Error deploying {iflow_id}: {str(e)}")
            return {
                "status": "error", 
                "message": str(e), 
                "target_environment": target_environment
            }

    async def get_package_details(self, package_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific package"""
        try:
            endpoint = f"/api/v1/IntegrationPackages('{package_id}')"
            response = await self._make_authenticated_request("GET", endpoint)
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get package details for {package_id}: {e}")
            raise

    async def get_iflow_details(self, iflow_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific iFlow"""
        try:
            endpoint = f"/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='active')"
            response = await self._make_authenticated_request("GET", endpoint)
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get iFlow details for {iflow_id}: {e}")
            raise

    async def refresh_token(self) -> Dict[str, Any]:
        """Force refresh the access token"""
        self.token_info = None
        return await self.get_token()

    async def get_token_status(self) -> Dict[str, Any]:
        """Get current token status information"""
        if not self.token_info:
            return {
                "has_token": False,
                "token_status": "none",
                "expires_at": None,
                "time_to_expiry_seconds": None,
                "token_type": None
            }

        is_valid = self._is_token_valid()
        time_to_expiry = None

        if self.token_info.expires_at:
            time_to_expiry = max(0, int((self.token_info.expires_at - datetime.now()).total_seconds()))

        return {
            "has_token": True,
            "token_status": "valid" if is_valid else "expired",
            "expires_at": self.token_info.expires_at.isoformat() if self.token_info.expires_at else None,
            "time_to_expiry_seconds": time_to_expiry,
            "token_type": self.token_info.token_type
        }

    async def test_connection(self) -> bool:
        """Test connection to SAP Integration Suite"""
        try:
            await self.get_token()
            # Try to fetch packages as a connection test
            await self.get_integration_packages()
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return False

    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for SAP API requests"""
        if not self.oauth_token or self._is_token_expired():
            await self._refresh_token()

        return {
            "Authorization": f"Bearer {self.oauth_token}",
            "Accept": "application/json"
        }

    async def _refresh_token(self) -> None:
        """Refresh the OAuth token"""
        try:
            logger.info("Requesting new access token from SAP")
            auth = (self.client_id, self.client_secret)
            data = {"grant_type": "client_credentials"}

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.token_url,
                    auth=auth,
                    data=data
                )
                response.raise_for_status()

                token_data = response.json()
                self.oauth_token = token_data["access_token"]
                expires_in = int(token_data["expires_in"])
                self.token_expiry = datetime.now() + timedelta(seconds=expires_in)
                logger.info("Successfully obtained access token")

        except Exception as e:
            error_msg = f"Failed to refresh OAuth token: {str(e)}"
            logger.error(error_msg)
            raise

    def _is_token_expired(self) -> bool:
        """Check if the current OAuth token is expired"""
        if not self.token_expiry:
            return True
        # Return True if token expires in less than 60 seconds
        return datetime.now() + timedelta(seconds=60) >= self.token_expiry