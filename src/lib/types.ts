// File Path: src/lib/types.ts
// Filename: types.ts
export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope?: string;
  grantType: "client_credentials" | "authorization_code";
  audience?: string;
  redirectUri?: string;
}

export interface SAPTenant {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  environment?: "dev" | "qa" | "production"; // Added environment field
  oauthCredentials: OAuthCredentials;
  status: "active" | "inactive" | "error";
  connectionStatus: "connected" | "disconnected" | "testing" | "error";
  isBaseTenant: boolean;
  lastTested?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  details?: {
    tokenObtained: boolean;
    apiAccessible: boolean;
    errorCode?: string;
    errorDescription?: string;
  };
}

export interface TenantFormData {
  name: string;
  description?: string;
  baseUrl: string;
  environment?: "dev" | "qa" | "production"; // Added environment field
  oauthCredentials: OAuthCredentials;
  isBaseTenant?: boolean;
}

export interface JsonUploadData {
  name?: string;
  description?: string;
  baseUrl?: string;
  environment?: "dev" | "qa" | "production"; // Added environment field for consistency
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope?: string;
  grantType?: string;
  audience?: string;
  redirectUri?: string;
  isBaseTenant?: boolean;
}

export interface IntegrationPackage {
  id: string;
  name: string;
  description: string;
  version: string;
  vendor: string;
  status: "active" | "inactive" | "error";
  lastModified: Date;
  iflowCount: number;
}

export interface IntegrationFlow {
  id: string;
  name: string;
  description: string;
  packageId: string;
  packageName: string;
  version: string;
  status: "started" | "stopped" | "error" | "starting" | "stopping";
  lastDeployed?: Date;
  runtime: "integration" | "mapping";
  artifacts: {
    id: string;
    name: string;
    type: string;
  }[];
}

export interface BaseTenantData {
  tenantId: string;
  tenantName: string;
  packages: IntegrationPackage[];
  iflows: IntegrationFlow[];
  lastSynced: Date;
  connectionStatus: "connected" | "disconnected" | "syncing" | "error";
}

export interface SAPOAuthConfigFile {
  oauth: {
    createdate: string;
    clientid: string;
    clientsecret: string;
    tokenurl: string;
    url: string;
  };
}