// File Path: frontend/lib/backend-client.ts
// Filename: backend-client.ts
/**
 * Backend API Client
 * Handles communication with the Python FastAPI backend
 */

import {
  BaseTenantData,
  IntegrationPackage,
  IntegrationFlow,
  ConnectionTestResult,
  TenantFormData,
} from "./types";

// Backend configuration - supports multiple environments
const getBackendBaseUrl = (): string => {
  // Check for environment variable first
  if (typeof window !== "undefined") {
    // @ts-ignore - for injected environment variables
    if (window.BACKEND_URL) {
      // @ts-ignore
      return window.BACKEND_URL;
    }
  }

  // Check for saved backend URL in localStorage (for cloud environments)
  if (typeof window !== "undefined") {
    const savedUrl = localStorage.getItem("backend_ngrok_url");
    if (savedUrl && savedUrl.trim() !== "") {
      return savedUrl.trim();
    }
  }

  // Check for environment-specific URLs
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "localhost";

  // If running in Builder.io environment
  if (hostname.includes("builder.codes") || hostname.includes("builder.io")) {
    // For cloud environment, try common backend URLs
    // You can set a specific backend URL here if you have one deployed
    return ""; // Leave empty for now, will use simulation mode
  }

  // Default to localhost for local development
  return "http://localhost:8000";
};

const BACKEND_BASE_URL = getBackendBaseUrl();
const API_PREFIX = "/api";

interface BackendResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
  error?: string;
}

interface BackendHealth {
  status: string;
  timestamp: string;
  services: {
    api: string;
    sap_connection: string;
  };
  sap_error?: string;
}

interface IFlowConfigurationResponse {
  name: string;
  version: string;
  parameters: Array<{
    ParameterKey: string;
    ParameterValue: string;
    DataType: string;
    Description?: string;
    Mandatory?: boolean;
  }>;
}

interface SaveConfigurationData {
  environment: string;
  timestamp: string;
  iflows: Array<{
    iflowId: string;
    iflowName: string;
    version: string;
    configurations: Record<string, string>;
  }>;
}

interface SaveConfigurationResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    latest_filename: string;
    filepath: string;
    latest_filepath: string;
    total_parameters: number;
    total_iflows: number;
    environment: string;
  };
  timestamp: string;
}

interface ConfigurationFile {
  filename: string;
  filepath: string;
  size: number;
  created: string;
  modified: string;
}

interface ConfigurationFilesResponse {
  success: boolean;
  message: string;
  data: {
    files: ConfigurationFile[];
    total_files: number;
    configurations_directory: string;
  };
  timestamp: string;
}

interface ConfigurationRecord {
  Environment: string;
  Timestamp: string;
  iFlow_ID: string;
  iFlow_Name: string;
  iFlow_Version: string;
  Parameter_Key: string;
  Parameter_Value: string;
  Saved_At: string;
}

interface DownloadConfigurationResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    filepath: string;
    configurations: ConfigurationRecord[];
    total_records: number;
  };
  timestamp: string;
}

interface DesignGuidelinesResponse {
  guidelines: Array<{
    Id: string;
    Name: string;
    Description?: string;
    Status: string;
    Severity: string;
    Category?: string;
  }>;
  total_rules: number;
  compliant_rules: number;
  compliance_percentage: number;
  is_compliant: boolean;
  execution_id?: string;
  last_executed?: string;
}

interface ResourcesResponse {
  value_mappings: Array<any>;
  groovy_scripts: Array<any>;
  message_mappings: Array<any>;
  external_services: Array<any>;
  process_direct: Array<any>;
  other: Array<any>;
}

interface DeploymentResponse {
  status: string;
  message: string;
  target_environment: string;
  deployment_id?: string;
}

interface TokenStatusResponse {
  has_token: boolean;
  token_status: string;
  expires_at?: string;
  time_to_expiry_seconds?: number;
  token_type?: string;
}

export class BackendAPIClient {
  private baseUrl: string;
  private requestTimeout: number = 30000; // 30 seconds

  constructor(baseUrl: string = BACKEND_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the configured backend URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Update the backend URL dynamically
   */
  updateBaseUrl(newUrl: string): void {
    this.baseUrl = newUrl;
    // Save to localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("backend_ngrok_url", newUrl);
    }
  }

  /**
   * Refresh backend URL from latest configuration
   */
  refreshBackendUrl(): void {
    this.baseUrl = getBackendBaseUrl();
  }

  /**
   * Make HTTP request to backend with error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    // Check if backend URL is available
    if (!this.baseUrl || this.baseUrl === "") {
      throw new BackendConnectionError(
        "No backend server configured. Running in cloud environment without local backend access.",
      );
    }

    const url = `${this.baseUrl}${API_PREFIX}${endpoint}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.requestTimeout),
    };

    try {
      console.log(`🔄 [Backend] ${config.method || "GET"} ${url}`);

      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.detail || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = `${errorMessage}. Response: ${errorText.substring(0, 200)}`;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = `${errorMessage}. Could not parse error response.`;
        }

        throw new Error(errorMessage);
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        throw new Error(
          `Expected JSON response but got: ${contentType}. Response: ${responseText.substring(0, 100)}`,
        );
      }

      const data = await response.json();
      console.log(`✅ [Backend] Request successful`);

      return data;
    } catch (error) {
      console.error(`❌ [Backend] Request failed:`, error);

      // Handle specific network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new BackendConnectionError(
          `Cannot connect to backend server at ${this.baseUrl}. ` +
            `${
              this.baseUrl.includes("localhost")
                ? "Backend may not be running locally. " +
                  "Start your Python backend or use ngrok for cloud access."
                : "Backend server may be down or inaccessible."
            }`,
        );
      }

      // Handle timeout errors
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        throw new BackendError("Request timeout. Backend server may be overloaded.");
      }

      throw error;
    }
  }

  /**
   * Health and Status Methods
   */

  async getHealth(): Promise<BackendHealth> {
    if (!this.baseUrl || this.baseUrl === "") {
      throw new BackendConnectionError("No backend URL configured");
    }

    const response = await fetch(`${this.baseUrl}/health`, {
      signal: AbortSignal.timeout(5000), // Shorter timeout for health check
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Backend health check failed: ${response.status} - ${errorText}`,
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      throw new Error(
        `Expected JSON response but got: ${contentType}. Response: ${responseText.substring(0, 100)}`,
      );
    }

    return response.json();
  }

  async getStatus(): Promise<{ message: string; status: string }> {
    if (!this.baseUrl || this.baseUrl === "") {
      throw new BackendConnectionError("No backend URL configured");
    }

    const response = await fetch(`${this.baseUrl}/`, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Backend status check failed: ${response.status} - ${errorText}`,
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      throw new Error(
        `Expected JSON response but got: ${contentType}. Response: ${responseText.substring(0, 100)}`,
      );
    }

    return response.json();
  }

  async getConfig(): Promise<BackendResponse> {
    return this.makeRequest("/config");
  }

  /**
   * SAP Integration Suite Methods
   */

  async getIntegrationPackages(): Promise<IntegrationPackage[]> {
    const response: BackendResponse<IntegrationPackage[]> =
      await this.makeRequest("/sap/packages");

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch packages");
    }

    return response.data || [];
  }

  async getIntegrationFlows(packageIds?: string[]): Promise<IntegrationFlow[]> {
    let endpoint = "/sap/iflows";

    // Add package IDs as query parameter if provided
    if (packageIds && packageIds.length > 0) {
      const packageIdsParam = packageIds.join(",");
      endpoint = `/sap/iflows?package_ids=${encodeURIComponent(packageIdsParam)}`;
    }

    const response: BackendResponse<IntegrationFlow[]> =
      await this.makeRequest(endpoint);

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch iFlows");
    }

    return response.data || [];
  }

  async getPaginatedIntegrationPackages(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    sortField: string = 'modifiedDate',
    sortDirection: string = 'desc'
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      sort_field: sortField,
      sort_direction: sortDirection,
    });
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await this.request(`/api/sap/packages/paginated?${params}`);
    return response.data;
  }
  async getBaseTenantData(): Promise<BaseTenantData> {
    const response: BackendResponse<BaseTenantData> = await this.makeRequest(
      "/sap/base-tenant-data",
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch base tenant data");
    }

    if (!response.data) {
      throw new Error("No data received from backend");
    }

    // Ensure dates are properly parsed
    const data = response.data;
    return {
      ...data,
      lastSynced: new Date(data.lastSynced),
      packages: data.packages.map((pkg) => ({
        ...pkg,
        lastModified: pkg.lastModified ? new Date(pkg.lastModified) : undefined,
      })),
      iflows: data.iflows.map((iflow) => ({
        ...iflow,
        lastDeployed: iflow.lastDeployed
          ? new Date(iflow.lastDeployed)
          : undefined,
      })),
    };
  }

  async getPackageDetails(packageId: string): Promise<any> {
    const response: BackendResponse = await this.makeRequest(
      `/sap/packages/${packageId}`,
    );

    if (!response.success) {
      throw new Error(
        response.error || `Failed to fetch package details: ${packageId}`,
      );
    }

    return response.data;
  }

  async getIFlowDetails(iflowId: string): Promise<any> {
    const response: BackendResponse = await this.makeRequest(
      `/sap/iflows/${iflowId}`,
    );

    if (!response.success) {
      throw new Error(
        response.error || `Failed to fetch iFlow details: ${iflowId}`,
      );
    }

    return response.data;
  }

  /**
   * Configuration Management Methods
   */

  async getIFlowConfiguration(iflowId: string, version: string = "active"): Promise<IFlowConfigurationResponse> {
    console.log(`🔄 Fetching configuration for iFlow: ${iflowId}, version: ${version}`);

    const response = await this.makeRequest<BackendResponse<IFlowConfigurationResponse>>(
      `/sap/iflows/${iflowId}/configuration?version=${version}`,
      {
        method: "GET",
      }
    );

    if (!response.success) {
      throw new Error(response.error || `Failed to fetch configuration for ${iflowId}`);
    }

    console.log(`✅ Configuration fetched for iFlow ${iflowId}:`, response.data);
    return response.data!;
  }

  async getIFlowConfigurations(iflowId: string, version: string = "active"): Promise<any[]> {
    const response: BackendResponse = await this.makeRequest(
      `/sap/iflows/${iflowId}/configurations?version=${version}`,
    );

    if (!response.success) {
      throw new Error(response.error || `Failed to fetch configurations for ${iflowId}`);
    }

    return response.data || [];
  }

  async saveIFlowConfigurations(configData: SaveConfigurationData): Promise<SaveConfigurationResponse> {
    console.log("🔄 Saving iFlow configurations to backend...", configData);

    const response = await this.makeRequest<SaveConfigurationResponse>(
      "/save-iflow-configurations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configData),
      }
    );

    console.log("✅ Configurations saved successfully:", response);
    return response;
  }

  async listConfigurationFiles(): Promise<ConfigurationFilesResponse> {
    console.log("🔄 Fetching configuration files list...");

    const response = await this.makeRequest<ConfigurationFilesResponse>(
      "/list-configuration-files",
      {
        method: "GET",
      }
    );

    console.log("✅ Configuration files list fetched:", response);
    return response;
  }

  async downloadConfigurationFile(filename: string): Promise<DownloadConfigurationResponse> {
    console.log(`🔄 Downloading configuration file: ${filename}`);

    const response = await this.makeRequest<DownloadConfigurationResponse>(
      `/download-configuration-file/${filename}`,
      {
        method: "GET",
      }
    );

    console.log("✅ Configuration file downloaded:", response);
    return response;
  }

  async getEnvironmentConfigurations(environment: string): Promise<ConfigurationRecord[]> {
    try {
      const filesResponse = await this.listConfigurationFiles();
      const environmentFiles = filesResponse.data.files.filter(file => 
        file.filename.includes(`_${environment}_`) || file.filename.includes(`_${environment}.csv`)
      );

      if (environmentFiles.length === 0) {
        return [];
      }

      // Get the latest file for the environment
      const latestFile = environmentFiles.sort((a, b) => 
        new Date(b.modified).getTime() - new Date(a.modified).getTime()
      )[0];

      const fileResponse = await this.downloadConfigurationFile(latestFile.filename);
      return fileResponse.data.configurations;
    } catch (error) {
      console.error(`Failed to get configurations for environment ${environment}:`, error);
      return [];
    }
  }

  async compareConfigurations(sourceEnv: string, targetEnv: string): Promise<{
    added: ConfigurationRecord[];
    modified: ConfigurationRecord[];
    removed: ConfigurationRecord[];
    unchanged: ConfigurationRecord[];
  }> {
    const [sourceConfigs, targetConfigs] = await Promise.all([
      this.getEnvironmentConfigurations(sourceEnv),
      this.getEnvironmentConfigurations(targetEnv)
    ]);

    const sourceMap = new Map<string, ConfigurationRecord>();
    const targetMap = new Map<string, ConfigurationRecord>();

    sourceConfigs.forEach(config => {
      const key = `${config.iFlow_ID}:${config.Parameter_Key}`;
      sourceMap.set(key, config);
    });

    targetConfigs.forEach(config => {
      const key = `${config.iFlow_ID}:${config.Parameter_Key}`;
      targetMap.set(key, config);
    });

    const added: ConfigurationRecord[] = [];
    const modified: ConfigurationRecord[] = [];
    const unchanged: ConfigurationRecord[] = [];
    const removed: ConfigurationRecord[] = [];

    // Check for added and modified configurations
    sourceMap.forEach((sourceConfig, key) => {
      const targetConfig = targetMap.get(key);
      if (!targetConfig) {
        added.push(sourceConfig);
      } else if (sourceConfig.Parameter_Value !== targetConfig.Parameter_Value) {
        modified.push(sourceConfig);
      } else {
        unchanged.push(sourceConfig);
      }
    });

    // Check for removed configurations
    targetMap.forEach((targetConfig, key) => {
      if (!sourceMap.has(key)) {
        removed.push(targetConfig);
      }
    });

    return { added, modified, removed, unchanged };
  }

  /**
   * Design Guidelines Methods
   */

  async getDesignGuidelines(iflowId: string, version: string = "active", executionId?: string): Promise<DesignGuidelinesResponse> {
    let endpoint = `/sap/iflows/${iflowId}/design-guidelines?version=${version}`;
    if (executionId) {
      endpoint += `&execution_id=${executionId}`;
    }

    const response: BackendResponse<DesignGuidelinesResponse> = await this.makeRequest(endpoint);

    if (!response.success) {
      throw new Error(response.error || `Failed to fetch design guidelines for ${iflowId}`);
    }

    return response.data!;
  }

  async executeDesignGuidelines(iflowId: string, version: string = "active"): Promise<any> {
    const response: BackendResponse = await this.makeRequest(
      `/sap/iflows/${iflowId}/execute-guidelines?version=${version}`,
      {
        method: "POST",
      }
    );

    if (!response.success) {
      throw new Error(response.error || `Failed to execute design guidelines for ${iflowId}`);
    }

    return response.data;
  }

  async getDesignGuidelinesByExecution(iflowId: string, version: string, executionId: string): Promise<DesignGuidelinesResponse> {
    const response: BackendResponse<DesignGuidelinesResponse> = await this.makeRequest(
      `/sap/iflows/${iflowId}/design-guidelines-with-execution/${executionId}?version=${version}`
    );

    if (!response.success) {
      throw new Error(response.error || `Failed to fetch design guidelines for execution ${executionId}`);
    }

    return response.data!;
  }

  /**
   * iFlow Resources Methods
   */

  async getIFlowResources(iflowId: string, version: string = "active"): Promise<ResourcesResponse> {
    const response: BackendResponse<ResourcesResponse> = await this.makeRequest(
      `/sap/iflows/${iflowId}/resources?version=${version}`,
    );

    if (!response.success) {
      throw new Error(response.error || `Failed to fetch resources for ${iflowId}`);
    }

    return response.data!;
  }

  /**
   * Deployment Methods
   */

  async deployIFlow(iflowId: string, version: string, targetEnvironment: string): Promise<DeploymentResponse> {
    const response: BackendResponse<DeploymentResponse> = await this.makeRequest(
      `/sap/iflows/${iflowId}/deploy?version=${version}&target_environment=${targetEnvironment}`,
      {
        method: "POST",
      }
    );

    if (!response.success) {
      throw new Error(response.error || `Failed to deploy ${iflowId}`);
    }

    return response.data!;
  }

  /**
   * Token Management Methods
   */

  async refreshToken(): Promise<void> {
    const response: BackendResponse = await this.makeRequest(
      "/sap/refresh-token",
      {
        method: "POST",
      },
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to refresh token");
    }
  }

  async getTokenStatus(): Promise<TokenStatusResponse> {
    const response: BackendResponse<TokenStatusResponse> =
      await this.makeRequest("/sap/token-status");

    if (!response.success) {
      throw new Error(response.error || "Failed to get token status");
    }

    return response.data!;
  }

  /**
   * Tenant Testing Methods
   */

  async testConnection(
    tenantData: TenantFormData,
  ): Promise<ConnectionTestResult> {
    const payload = {
      name: tenantData.name,
      description: tenantData.description || "",
      client_id: tenantData.oauthCredentials.clientId,
      client_secret: tenantData.oauthCredentials.clientSecret,
      token_url: tenantData.oauthCredentials.tokenUrl,
      base_url: tenantData.baseUrl,
    };

    const response: ConnectionTestResult = await this.makeRequest(
      "/tenants/test-connection",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    return response;
  }

  /**
   * Bulk Operations
   */

  async bulkUpdateConfigurations(updates: Array<{
    iflowId: string;
    version: string;
    configurations: Record<string, string>;
  }>, environment: string): Promise<SaveConfigurationResponse> {
    const configData: SaveConfigurationData = {
      environment,
      timestamp: new Date().toISOString(),
      iflows: updates.map(update => ({
        iflowId: update.iflowId,
        iflowName: `iFlow ${update.iflowId}`, // This should be fetched from iFlow details
        version: update.version,
        configurations: update.configurations
      }))
    };

    return await this.saveIFlowConfigurations(configData);
  }

  async validateConfigurations(configurations: ConfigurationRecord[]): Promise<{
    valid: ConfigurationRecord[];
    invalid: Array<ConfigurationRecord & { errors: string[] }>;
  }> {
    const valid: ConfigurationRecord[] = [];
    const invalid: Array<ConfigurationRecord & { errors: string[] }> = [];

    configurations.forEach(config => {
      const errors: string[] = [];

      // Basic validation rules
      if (!config.iFlow_ID || config.iFlow_ID.trim() === '') {
        errors.push('iFlow ID is required');
      }

      if (!config.Parameter_Key || config.Parameter_Key.trim() === '') {
        errors.push('Parameter key is required');
      }

      if (!config.Environment || config.Environment.trim() === '') {
        errors.push('Environment is required');
      }

      // Add more validation rules as needed
      if (config.Parameter_Key && config.Parameter_Key.includes(' ')) {
        errors.push('Parameter key should not contain spaces');
      }

      if (errors.length > 0) {
        invalid.push({ ...config, errors });
      } else {
        valid.push(config);
      }
    });

    return { valid, invalid };
  }

  /**
   * Export/Import Methods
   */

  async exportConfigurations(environment: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const configurations = await this.getEnvironmentConfigurations(environment);
    
    if (format === 'json') {
      const dataStr = JSON.stringify(configurations, null, 2);
      return new Blob([dataStr], { type: 'application/json' });
    } else {
      // Convert to CSV
      const csvHeaders = Object.keys(configurations[0] || {});
      const csvRows = configurations.map(config => 
        csvHeaders.map(header => `"${config[header] || ''}"`).join(',')
      );
      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
      return new Blob([csvContent], { type: 'text/csv' });
    }
  }

  async importConfigurations(file: File, environment: string, overwrite: boolean = false): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const fileContent = await file.text();
    let configurations: ConfigurationRecord[];

    try {
      if (file.name.endsWith('.json')) {
        configurations = JSON.parse(fileContent);
      } else if (file.name.endsWith('.csv')) {
          const lines = fileContent.split('\n');
          const headers = lines[0].split('|').map(h => h.trim().replace(/"/g, ''));
          configurations = lines.slice(1).filter(line => line.trim()).map(line => {
              const values = line.split('|').map(v => v.trim().replace(/"/g, ''));
              const config: any = {};
              headers.forEach((header, index) => {
                  config[header] = values[index] || '';
              });
              return config;
          });
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }
    } catch (error) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }

    // Validate configurations
    const { valid, invalid } = await this.validateConfigurations(configurations);
    
    if (invalid.length > 0) {
      console.warn('Invalid configurations found:', invalid);
    }

    // Apply valid configurations
    if (valid.length > 0) {
      const configData: SaveConfigurationData = {
        environment,
        timestamp: new Date().toISOString(),
        iflows: this._groupConfigurationsByIFlow(valid)
      };

      await this.saveIFlowConfigurations(configData);
    }

    return {
      imported: valid.length,
      skipped: invalid.length,
      errors: invalid.flatMap(config => config.errors)
    };
  }

  private _groupConfigurationsByIFlow(configurations: ConfigurationRecord[]) {
    const grouped = new Map<string, {
      iflowId: string;
      iflowName: string;
      version: string;
      configurations: Record<string, string>;
    }>();

    configurations.forEach(config => {
      const key = config.iFlow_ID;
      if (!grouped.has(key)) {
        grouped.set(key, {
          iflowId: config.iFlow_ID,
          iflowName: config.iFlow_Name,
          version: config.iFlow_Version,
          configurations: {}
        });
      }
      grouped.get(key)!.configurations[config.Parameter_Key] = config.Parameter_Value;
    });

    return Array.from(grouped.values());
  }

  /**
   * Utility Methods
   */

  async isBackendAvailable(): Promise<boolean> {
    try {
      // If no backend URL is configured, return false immediately
      if (!this.baseUrl || this.baseUrl === "") {
        console.info(
          "No backend URL configured - running in cloud environment",
        );
        return false;
      }

      await this.getStatus();
      return true;
    } catch (error) {
      console.warn("Backend not available:", error);
      return false;
    }
  }

  async waitForBackend(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const isAvailable = await this.isBackendAvailable();
        if (isAvailable) {
          return true;
        }
      } catch (error) {
        // Continue trying
      }

      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return false;
  }

  getBackendUrl(): string {
    return this.baseUrl;
  }

  setRequestTimeout(timeoutMs: number): void {
    this.requestTimeout = timeoutMs;
  }
}

// Export the default client instance
const backendAPIClient = new BackendAPIClient();
export default backendAPIClient;

// Default client instance
export const backendClient = new BackendAPIClient();

// Backend-specific error types
export class BackendError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

export class BackendConnectionError extends BackendError {
  constructor(message: string = "Cannot connect to backend server") {
    super(message, 0);
    this.name = "BackendConnectionError";
  }
}

export class BackendSAPError extends BackendError {
  constructor(message: string, details?: any) {
    super(message, 500, details);
    this.name = "BackendSAPError";
  }
}

// Helper functions for error handling
export function isBackendError(error: any): error is BackendError {
  return error instanceof BackendError;
}

export function isBackendConnectionError(
  error: any,
): error is BackendConnectionError {
  return error instanceof BackendConnectionError;
}

export function isBackendSAPError(error: any): error is BackendSAPError {
  return error instanceof BackendSAPError;
}

// Configuration utilities
export const ConfigurationUtils = {
  /**
   * Group configurations by iFlow
   */
  groupByIFlow: (configurations: ConfigurationRecord[]) => {
    const grouped = new Map<string, ConfigurationRecord[]>();
    
    configurations.forEach(config => {
      const key = config.iFlow_ID;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(config);
    });

    return grouped;
  },

  /**
   * Group configurations by environment
   */
  groupByEnvironment: (configurations: ConfigurationRecord[]) => {
    const grouped = new Map<string, ConfigurationRecord[]>();
    
    configurations.forEach(config => {
      const key = config.Environment;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(config);
    });

    return grouped;
  },

  /**
   * Convert configurations to key-value object
   */
  toKeyValueObject: (configurations: ConfigurationRecord[]) => {
    const result: Record<string, string> = {};
    configurations.forEach(config => {
      result[config.Parameter_Key] = config.Parameter_Value;
    });
    return result;
  },

  /**
   * Filter configurations by parameter pattern
   */
  filterByParameterPattern: (configurations: ConfigurationRecord[], pattern: RegExp) => {
    return configurations.filter(config => pattern.test(config.Parameter_Key));
  },

  /**
   * Find missing configurations between two environments
   */
  findMissingConfigurations: (
    sourceConfigs: ConfigurationRecord[], 
    targetConfigs: ConfigurationRecord[]
  ) => {
    const targetKeys = new Set(targetConfigs.map(c => `${c.iFlow_ID}:${c.Parameter_Key}`));
    return sourceConfigs.filter(config => 
      !targetKeys.has(`${config.iFlow_ID}:${config.Parameter_Key}`)
    );
  },

  /**
   * Generate configuration summary statistics
   */
  generateSummary: (configurations: ConfigurationRecord[]) => {
    const iflows = new Set(configurations.map(c => c.iFlow_ID));
    const environments = new Set(configurations.map(c => c.Environment));
    const parameters = new Set(configurations.map(c => c.Parameter_Key));

    return {
      totalConfigurations: configurations.length,
      uniqueIFlows: iflows.size,
      uniqueEnvironments: environments.size,
      uniqueParameters: parameters.size,
      iflowList: Array.from(iflows),
      environmentList: Array.from(environments),
      parameterList: Array.from(parameters)
    };
  },

  /**
   * Validate configuration data integrity
   */
  validateIntegrity: (configurations: ConfigurationRecord[]) => {
    const issues: string[] = [];
    const duplicates = new Set<string>();
    const seen = new Set<string>();

    configurations.forEach((config, index) => {
      const key = `${config.iFlow_ID}:${config.Parameter_Key}:${config.Environment}`;
      
      if (seen.has(key)) {
        duplicates.add(key);
        issues.push(`Duplicate configuration at index ${index}: ${key}`);
      } else {
        seen.add(key);
      }

      // Check for empty values
      if (!config.Parameter_Value || config.Parameter_Value.trim() === '') {
        issues.push(`Empty parameter value at index ${index}: ${config.iFlow_ID}.${config.Parameter_Key}`);
      }

      // Check for invalid characters in keys
      if (config.Parameter_Key.includes(' ') || config.Parameter_Key.includes('\t')) {
        issues.push(`Invalid characters in parameter key at index ${index}: ${config.Parameter_Key}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      duplicateCount: duplicates.size,
      totalRecords: configurations.length
    };
  },

  /**
   * Convert configurations to different formats
   */
  convertFormat: (configurations: ConfigurationRecord[], format: 'csv' | 'json' | 'yaml' | 'env') => {
    switch (format) {
      case 'csv':
        const headers = Object.keys(configurations[0] || {});
        const rows = configurations.map(config => 
            headers.map(header => `"${config[header] || ''}"`).join('|')
        );
        return [headers.join('|'), ...rows].join('\n');

      case 'json':
        return JSON.stringify(configurations, null, 2);

      case 'yaml':
        // Simple YAML conversion (you might want to use a proper YAML library)
        return configurations.map(config => 
          Object.entries(config).map(([key, value]) => `${key}: "${value}"`).join('\n')
        ).join('\n---\n');

      case 'env':
        // Convert to environment variables format
        return configurations.map(config => 
          `${config.iFlow_ID}_${config.Parameter_Key}="${config.Parameter_Value}"`
        ).join('\n');

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  },

  /**
   * Search configurations by various criteria
   */
  search: (configurations: ConfigurationRecord[], query: {
    iflowId?: string;
    parameterKey?: string;
    parameterValue?: string;
    environment?: string;
    searchText?: string;
  }) => {
    return configurations.filter(config => {
      if (query.iflowId && !config.iFlow_ID.toLowerCase().includes(query.iflowId.toLowerCase())) {
        return false;
      }
      if (query.parameterKey && !config.Parameter_Key.toLowerCase().includes(query.parameterKey.toLowerCase())) {
        return false;
      }
      if (query.parameterValue && !config.Parameter_Value.toLowerCase().includes(query.parameterValue.toLowerCase())) {
        return false;
      }
      if (query.environment && config.Environment !== query.environment) {
        return false;
      }
      if (query.searchText) {
        const searchLower = query.searchText.toLowerCase();
        const searchableText = [
          config.iFlow_ID,
          config.iFlow_Name,
          config.Parameter_Key,
          config.Parameter_Value,
          config.Environment
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }
};

// API Response Cache
class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Export cache instance
export const apiCache = new ResponseCache();

// Retry utility for network requests
export const RetryUtils = {
  /**
   * Retry a function with exponential backoff
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 10000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }

        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  },

  /**
   * Check if an error is retryable
   */
  isRetryableError(error: any): boolean {
    if (error instanceof BackendConnectionError) return true;
    if (error.name === 'AbortError' || error.name === 'TimeoutError') return true;
    if (error.message?.includes('fetch')) return true;
    if (error.status >= 500 && error.status < 600) return true;
    if (error.status === 429) return true; // Rate limited
    return false;
  }
};

// Performance monitoring
export const PerformanceMonitor = {
  measurements: new Map<string, number[]>(),

  start(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.record(operation, duration);
    };
  },

  record(operation: string, duration: number): void {
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }
    
    const measurements = this.measurements.get(operation)!;
    measurements.push(duration);
    
    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }
  },

  getStats(operation: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    median: number;
  } | null {
    const measurements = this.measurements.get(operation);
    if (!measurements || measurements.length === 0) return null;

    const sorted = [...measurements].sort((a, b) => a - b);
    const count = measurements.length;
    const sum = measurements.reduce((a, b) => a + b, 0);

    return {
      count,
      average: sum / count,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)]
    };
  },

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const operation of this.measurements.keys()) {
      stats[operation] = this.getStats(operation);
    }
    return stats;
  },

  clear(): void {
    this.measurements.clear();
  }
};