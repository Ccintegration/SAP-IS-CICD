# File Path: backend/models.py
# Filename: models.py
"""
Pydantic models for SAP CI/CD Automation Platform
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Tenant Models
class ConnectionTestResult(BaseModel):
    success: bool = Field(..., description="Whether the connection test was successful")
    message: str = Field(..., description="Connection test result message")
    response_time: int = Field(0, description="Response time in milliseconds")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional connection details")

# SAP Integration Models
class IntegrationPackage(BaseModel):
    id: str = Field(..., description="Package ID")
    name: str = Field(..., description="Package name")
    description: Optional[str] = Field(None, description="Package description")
    version: Optional[str] = Field("1.0.0", description="Package version")
    modifiedDate: Optional[str] = Field(None, description="Last modified date")
    modifiedBy: Optional[str] = Field(None, description="Modified by user")
    createdDate: Optional[str] = Field(None, description="Creation date") # ✅ NEW
    createdBy: Optional[str] = Field(None, description="Created by user")   # ✅ NEW
    status: Optional[str] = Field("active", description="Package status")  # ✅ NEW

class IntegrationFlow(BaseModel):
    id: str = Field(..., description="iFlow ID")
    name: str = Field(..., description="iFlow name")
    packageId: Optional[str] = Field(None, description="Parent package ID")
    packageName: Optional[str] = Field(None, description="Parent package name")
    description: Optional[str] = Field(None, description="iFlow description")
    version: Optional[str] = Field("1.0.0", description="iFlow version")
    modifiedDate: Optional[str] = Field(None, description="Last modified date")
    modifiedBy: Optional[str] = Field(None, description="Modified by user")
    status: Optional[str] = Field("Active", description="iFlow status")
    lastDeployed: Optional[datetime] = Field(None, description="Last deployment date")

class BaseTenantData(BaseModel):
    tenant_id: str = Field(..., description="Tenant identifier")
    tenant_name: str = Field(..., description="Tenant name")
    lastSynced: datetime = Field(..., description="Last synchronization timestamp")
    packages: List[IntegrationPackage] = Field(default_factory=list, description="Integration packages")
    iflows: List[IntegrationFlow] = Field(default_factory=list, description="Integration flows")
    connection_status: str = Field("unknown", description="Connection status")

# Token Models
class TokenInfo(BaseModel):
    access_token: str = Field(..., description="OAuth access token")
    token_type: str = Field("Bearer", description="Token type")
    expires_in: int = Field(3600, description="Token expiration time in seconds")
    expires_at: Optional[datetime] = Field(None, description="Token expiration timestamp")

# API Response Models
class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    timestamp: Optional[str] = None

class TenantConfig(BaseModel):
    name: str
    description: Optional[str] = None
    client_id: str
    client_secret: str
    token_url: str
    base_url: str
    auth_url: Optional[str] = None

# Configuration Models
class ConfigurationParameter(BaseModel):
    ParameterKey: str = Field(..., description="Parameter key/name")
    ParameterValue: str = Field("", description="Parameter value")
    DataType: str = Field("string", description="Parameter data type")
    Description: Optional[str] = Field(None, description="Parameter description")
    Mandatory: bool = Field(False, description="Whether parameter is mandatory")

class IFlowConfiguration(BaseModel):
    iflowId: str = Field(..., description="Integration flow ID")
    iflowName: str = Field(..., description="Integration flow name")
    version: str = Field("active", description="Integration flow version")
    parameters: List[ConfigurationParameter] = Field(default_factory=list, description="Configuration parameters")

# Design Guidelines Models
class DesignGuideline(BaseModel):
    Id: str = Field(..., description="Guideline ID")
    Name: str = Field(..., description="Guideline name")
    Description: Optional[str] = Field(None, description="Guideline description")
    Status: str = Field(..., description="Guideline status (PASSED/FAILED)")
    Severity: str = Field("INFO", description="Guideline severity")
    Category: Optional[str] = Field(None, description="Guideline category")

class DesignGuidelinesResult(BaseModel):
    guidelines: List[DesignGuideline] = Field(default_factory=list, description="Design guidelines")
    total_rules: int = Field(0, description="Total number of rules")
    compliant_rules: int = Field(0, description="Number of compliant rules")
    compliance_percentage: float = Field(0.0, description="Compliance percentage")
    is_compliant: bool = Field(False, description="Whether iFlow is compliant")
    execution_id: Optional[str] = Field(None, description="Execution ID")
    last_executed: Optional[str] = Field(None, description="Last execution timestamp")

# Resource Models
class IFlowResource(BaseModel):
    Name: str = Field(..., description="Resource name")
    ResourceType: str = Field(..., description="Resource type")
    Description: Optional[str] = Field(None, description="Resource description")
    Size: Optional[int] = Field(None, description="Resource size in bytes")
    LastModified: Optional[str] = Field(None, description="Last modified timestamp")

class CategorizedResources(BaseModel):
    value_mappings: List[IFlowResource] = Field(default_factory=list, description="Value mapping resources")
    groovy_scripts: List[IFlowResource] = Field(default_factory=list, description="Groovy script resources")
    message_mappings: List[IFlowResource] = Field(default_factory=list, description="Message mapping resources")
    external_services: List[IFlowResource] = Field(default_factory=list, description="External service resources")
    process_direct: List[IFlowResource] = Field(default_factory=list, description="ProcessDirect resources")
    other: List[IFlowResource] = Field(default_factory=list, description="Other resources")

# Deployment Models
class DeploymentResult(BaseModel):
    status: str = Field(..., description="Deployment status")
    message: str = Field(..., description="Deployment message")
    target_environment: str = Field(..., description="Target environment")
    deployment_id: Optional[str] = Field(None, description="Deployment ID")
    timestamp: Optional[str] = Field(None, description="Deployment timestamp")

# Error Models
class ErrorDetail(BaseModel):
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

class APIError(BaseModel):
    success: bool = Field(False, description="Always false for errors")
    error: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")
    timestamp: str = Field(..., description="Error timestamp")

# Health Check Models
class ServiceHealth(BaseModel):
    api: str = Field(..., description="API service health status")
    sap_connection: str = Field(..., description="SAP connection health status")

class HealthCheck(BaseModel):
    status: str = Field(..., description="Overall health status")
    timestamp: str = Field(..., description="Health check timestamp")
    services: ServiceHealth = Field(..., description="Individual service health")
    sap_error: Optional[str] = Field(None, description="SAP connection error if any")

# Configuration File Models
class ConfigurationFileInfo(BaseModel):
    filename: str = Field(..., description="Configuration file name")
    filepath: str = Field(..., description="Configuration file path")
    size: int = Field(..., description="File size in bytes")
    created: str = Field(..., description="File creation timestamp")
    modified: str = Field(..., description="File modification timestamp")

class ConfigurationFilesList(BaseModel):
    files: List[ConfigurationFileInfo] = Field(default_factory=list, description="List of configuration files")
    total_files: int = Field(0, description="Total number of files")
    configurations_directory: str = Field(..., description="Configurations directory path")

class SavedConfigurationRecord(BaseModel):
    Environment: str = Field(..., description="Target environment")
    Timestamp: str = Field(..., description="Configuration timestamp")
    iFlow_ID: str = Field(..., description="Integration flow ID")
    iFlow_Name: str = Field(..., description="Integration flow name")
    iFlow_Version: str = Field(..., description="Integration flow version")
    Parameter_Key: str = Field(..., description="Configuration parameter key")
    Parameter_Value: str = Field(..., description="Configuration parameter value")
    Saved_At: str = Field(..., description="Save timestamp")

class ConfigurationFileContent(BaseModel):
    filename: str = Field(..., description="Configuration file name")
    filepath: str = Field(..., description="Configuration file path")
    configurations: List[SavedConfigurationRecord] = Field(default_factory=list, description="Configuration records")
    total_records: int = Field(0, description="Total number of records")

# Validation Models
class ValidationRule(BaseModel):
    id: str = Field(..., description="Validation rule ID")
    name: str = Field(..., description="Validation rule name")
    description: str = Field(..., description="Validation rule description")
    severity: str = Field("ERROR", description="Validation severity")
    category: str = Field("GENERAL", description="Validation category")

class ValidationResult(BaseModel):
    rule_id: str = Field(..., description="Validation rule ID")
    status: str = Field(..., description="Validation status (PASSED/FAILED)")
    message: str = Field(..., description="Validation message")
    details: Optional[Dict[str, Any]] = Field(None, description="Validation details")

class IFlowValidation(BaseModel):
    iflow_id: str = Field(..., description="Integration flow ID")
    iflow_name: str = Field(..., description="Integration flow name")
    validation_results: List[ValidationResult] = Field(default_factory=list, description="Validation results")
    overall_status: str = Field(..., description="Overall validation status")
    compliance_score: float = Field(0.0, description="Compliance score percentage")

# Pipeline Models
class PipelineStage(BaseModel):
    id: str = Field(..., description="Stage ID")
    name: str = Field(..., description="Stage name")
    status: str = Field("pending", description="Stage status")
    started_at: Optional[datetime] = Field(None, description="Stage start time")
    completed_at: Optional[datetime] = Field(None, description="Stage completion time")
    duration: Optional[int] = Field(None, description="Stage duration in seconds")
    error: Optional[str] = Field(None, description="Stage error message")

class PipelineExecution(BaseModel):
    id: str = Field(..., description="Pipeline execution ID")
    name: str = Field(..., description="Pipeline name")
    status: str = Field("running", description="Pipeline status")
    stages: List[PipelineStage] = Field(default_factory=list, description="Pipeline stages")
    started_at: datetime = Field(..., description="Pipeline start time")
    completed_at: Optional[datetime] = Field(None, description="Pipeline completion time")
    duration: Optional[int] = Field(None, description="Pipeline duration in seconds")
    triggered_by: str = Field(..., description="User who triggered the pipeline")

# Statistics Models
class PackageStatistics(BaseModel):
    total_packages: int = Field(0, description="Total number of packages")
    packages_with_iflows: int = Field(0, description="Packages containing iFlows")
    average_iflows_per_package: float = Field(0.0, description="Average iFlows per package")

class IFlowStatistics(BaseModel):
    total_iflows: int = Field(0, description="Total number of iFlows")
    configured_iflows: int = Field(0, description="Number of configured iFlows")
    deployed_iflows: int = Field(0, description="Number of deployed iFlows")
    compliant_iflows: int = Field(0, description="Number of compliant iFlows")

class TenantStatistics(BaseModel):
    package_stats: PackageStatistics = Field(..., description="Package statistics")
    iflow_stats: IFlowStatistics = Field(..., description="iFlow statistics")
    last_updated: datetime = Field(..., description="Statistics last updated timestamp")

# Export/Import Models
class ExportRequest(BaseModel):
    iflow_ids: List[str] = Field(..., description="List of iFlow IDs to export")
    include_configurations: bool = Field(True, description="Include configurations in export")
    include_resources: bool = Field(False, description="Include resources in export")
    export_format: str = Field("json", description="Export format (json/csv/xml)")

class ImportRequest(BaseModel):
    file_content: str = Field(..., description="Import file content")
    file_format: str = Field("json", description="Import file format")
    target_environment: str = Field(..., description="Target environment for import")
    overwrite_existing: bool = Field(False, description="Overwrite existing configurations")

class ExportResult(BaseModel):
    export_id: str = Field(..., description="Export ID")
    filename: str = Field(..., description="Export filename")
    file_path: str = Field(..., description="Export file path")
    exported_items: int = Field(0, description="Number of exported items")
    export_size: int = Field(0, description="Export file size in bytes")
    created_at: datetime = Field(..., description="Export creation timestamp")

class ImportResult(BaseModel):
    import_id: str = Field(..., description="Import ID")
    imported_items: int = Field(0, description="Number of imported items")
    skipped_items: int = Field(0, description="Number of skipped items")
    failed_items: int = Field(0, description="Number of failed items")
    warnings: List[str] = Field(default_factory=list, description="Import warnings")
    errors: List[str] = Field(default_factory=list, description="Import errors")
    completed_at: datetime = Field(..., description="Import completion timestamp")

# Environment Models
class EnvironmentConfig(BaseModel):
    name: str = Field(..., description="Environment name")
    display_name: str = Field(..., description="Environment display name")
    description: Optional[str] = Field(None, description="Environment description")
    environment_type: str = Field(..., description="Environment type (dev/test/prod)")
    is_active: bool = Field(True, description="Whether environment is active")
    created_at: datetime = Field(..., description="Environment creation timestamp")

class EnvironmentComparison(BaseModel):
    source_environment: str = Field(..., description="Source environment name")
    target_environment: str = Field(..., description="Target environment name")
    added_configurations: List[SavedConfigurationRecord] = Field(default_factory=list, description="Added configurations")
    modified_configurations: List[SavedConfigurationRecord] = Field(default_factory=list, description="Modified configurations")
    removed_configurations: List[SavedConfigurationRecord] = Field(default_factory=list, description="Removed configurations")
    unchanged_configurations: List[SavedConfigurationRecord] = Field(default_factory=list, description="Unchanged configurations")
    comparison_timestamp: datetime = Field(..., description="Comparison timestamp")

# Monitoring Models
class MonitoringMetric(BaseModel):
    metric_name: str = Field(..., description="Metric name")
    metric_value: float = Field(..., description="Metric value")
    metric_unit: str = Field(..., description="Metric unit")
    timestamp: datetime = Field(..., description="Metric timestamp")
    tags: Dict[str, str] = Field(default_factory=dict, description="Metric tags")

class SystemStatus(BaseModel):
    component: str = Field(..., description="System component")
    status: str = Field(..., description="Component status")
    last_check: datetime = Field(..., description="Last health check timestamp")
    response_time: Optional[float] = Field(None, description="Response time in milliseconds")
    error_message: Optional[str] = Field(None, description="Error message if unhealthy")

class MonitoringDashboard(BaseModel):
    system_status: List[SystemStatus] = Field(default_factory=list, description="System component statuses")
    metrics: List[MonitoringMetric] = Field(default_factory=list, description="System metrics")
    alerts: List[str] = Field(default_factory=list, description="Active alerts")
    last_updated: datetime = Field(..., description="Dashboard last updated timestamp")

# Audit Models
class AuditEvent(BaseModel):
    event_id: str = Field(..., description="Unique event ID")
    event_type: str = Field(..., description="Event type")
    user_id: str = Field(..., description="User who performed the action")
    resource_type: str = Field(..., description="Resource type affected")
    resource_id: str = Field(..., description="Resource ID affected")
    action: str = Field(..., description="Action performed")
    details: Dict[str, Any] = Field(default_factory=dict, description="Event details")
    timestamp: datetime = Field(..., description="Event timestamp")
    ip_address: Optional[str] = Field(None, description="User IP address")
    user_agent: Optional[str] = Field(None, description="User agent")

class AuditLog(BaseModel):
    events: List[AuditEvent] = Field(default_factory=list, description="Audit events")
    total_events: int = Field(0, description="Total number of events")
    start_date: datetime = Field(..., description="Audit log start date")
    end_date: datetime = Field(..., description="Audit log end date")

# Notification Models
class NotificationChannel(BaseModel):
    channel_id: str = Field(..., description="Channel ID")
    channel_type: str = Field(..., description="Channel type (email/slack/teams)")
    name: str = Field(..., description="Channel name")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Channel configuration")
    is_active: bool = Field(True, description="Whether channel is active")

class NotificationRule(BaseModel):
    rule_id: str = Field(..., description="Rule ID")
    name: str = Field(..., description="Rule name")
    event_types: List[str] = Field(default_factory=list, description="Event types to trigger notification")
    channels: List[str] = Field(default_factory=list, description="Channel IDs to send notifications")
    conditions: Dict[str, Any] = Field(default_factory=dict, description="Rule conditions")
    is_active: bool = Field(True, description="Whether rule is active")

class Notification(BaseModel):
    notification_id: str = Field(..., description="Notification ID")
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message")
    severity: str = Field("INFO", description="Notification severity")
    channel: str = Field(..., description="Channel ID")
    status: str = Field("pending", description="Notification status")
    created_at: datetime = Field(..., description="Notification creation timestamp")
    sent_at: Optional[datetime] = Field(None, description="Notification sent timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")

# Backup Models
class BackupConfiguration(BaseModel):
    backup_id: str = Field(..., description="Backup ID")
    name: str = Field(..., description="Backup name")
    description: Optional[str] = Field(None, description="Backup description")
    included_iflows: List[str] = Field(default_factory=list, description="iFlow IDs included in backup")
    included_packages: List[str] = Field(default_factory=list, description="Package IDs included in backup")
    include_configurations: bool = Field(True, description="Include configurations in backup")
    include_resources: bool = Field(False, description="Include resources in backup")
    schedule: Optional[str] = Field(None, description="Backup schedule (cron expression)")
    retention_days: int = Field(30, description="Backup retention period in days")
    is_active: bool = Field(True, description="Whether backup is active")
    created_at: datetime = Field(..., description="Backup configuration creation timestamp")

class BackupExecution(BaseModel):
    execution_id: str = Field(..., description="Backup execution ID")
    backup_id: str = Field(..., description="Backup configuration ID")
    status: str = Field("running", description="Backup execution status")
    started_at: datetime = Field(..., description="Backup start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Backup completion timestamp")
    duration: Optional[int] = Field(None, description="Backup duration in seconds")
    backup_size: Optional[int] = Field(None, description="Backup size in bytes")
    file_path: Optional[str] = Field(None, description="Backup file path")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    items_backed_up: int = Field(0, description="Number of items backed up")

# Security Models
class UserRole(BaseModel):
    role_id: str = Field(..., description="Role ID")
    role_name: str = Field(..., description="Role name")
    description: Optional[str] = Field(None, description="Role description")
    permissions: List[str] = Field(default_factory=list, description="Role permissions")
    is_system_role: bool = Field(False, description="Whether this is a system role")
    created_at: datetime = Field(..., description="Role creation timestamp")

class User(BaseModel):
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="User email")
    full_name: str = Field(..., description="User full name")
    roles: List[str] = Field(default_factory=list, description="User role IDs")
    is_active: bool = Field(True, description="Whether user is active")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    created_at: datetime = Field(..., description="User creation timestamp")

class AccessToken(BaseModel):
    token_id: str = Field(..., description="Token ID")
    user_id: str = Field(..., description="User ID")
    token_name: str = Field(..., description="Token name")
    permissions: List[str] = Field(default_factory=list, description="Token permissions")
    expires_at: Optional[datetime] = Field(None, description="Token expiration timestamp")
    last_used: Optional[datetime] = Field(None, description="Last used timestamp")
    is_active: bool = Field(True, description="Whether token is active")
    created_at: datetime = Field(..., description="Token creation timestamp")