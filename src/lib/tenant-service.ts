import {
  SAPTenant,
  TenantFormData,
  ConnectionTestResult,
  OAuthCredentials,
} from "./types";

// Real tenant storage - using your CCCI_SANDBOX tenant
let tenants: SAPTenant[] = [
  {
    id: "ccci-sandbox-001",
    name: "CCCI_SANDBOX",
    description: "SAP Integration Suite production sandbox tenant for CCCI",
    baseUrl:
      "https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com",
    oauthCredentials: {
      clientId: "sb-4d88ec4d-cf00-4e40-b9a3-bf20640f4941!b236015|it!b182722",
      clientSecret:
        "68998671-12de-4a2c-ab02-8968d571b4cd$1hejXEfNv1qrX8raaVfuD_x-6PtP1xub7uRFmr55gaI=",
      tokenUrl:
        "https://ccci-integration-suite-fuom1yo5.authentication.eu10.hana.ondemand.com/oauth/token",
      scope: "", // Will use SAP-specific scopes automatically
      grantType: "client_credentials",
    },
    status: "active",
    connectionStatus: "connected",
    isBaseTenant: true, // Mark as base tenant by default
    lastTested: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago (when registered)
    updatedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: "ccci-production-001",
    name: "CCCI_PROD",
    description: "SAP Integration Suite production Production tenant for CCCI",
    baseUrl:
      "https://a14a85e9trial.it-cpitrial06.cfapps.us10-001.hana.ondemand.com",
    oauthCredentials: {
      clientId: "sb-24806f7d-784e-4d5e-a6b6-8a968dab1180!b468172|it!b55215",
      clientSecret:
        "c1e126ea-f38c-4e7f-8ade-ea495e2b1672$-6syu_4NZaWRIrW8Zd3CuCBbunB6zM6DhvpJC9mvOBE=",
      tokenUrl:
        "https://a14a85e9trial.authentication.us10.hana.ondemand.com/oauth/token",
      scope: "", // Will use SAP-specific scopes automatically
      grantType: "client_credentials",
    },
    status: "active",
    connectionStatus: "connected",
    isBaseTenant: false, // Mark as base tenant by default
    lastTested: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago (when registered)
    updatedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  }
];

export class TenantService {
  // Debug mode for testing
  static debugMode = true; // Set to false in production

  static async getAllTenants(): Promise<SAPTenant[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...tenants];
  }

  static async getTenantById(id: string): Promise<SAPTenant | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return tenants.find((tenant) => tenant.id === id) || null;
  }

  static async createTenant(data: TenantFormData): Promise<SAPTenant> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newTenant: SAPTenant = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      baseUrl: data.baseUrl,
      oauthCredentials: data.oauthCredentials,
      status: "active",
      connectionStatus: "disconnected",
      isBaseTenant: data.isBaseTenant || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tenants.push(newTenant);
    return newTenant;
  }

  static async updateTenant(
    id: string,
    data: Partial<TenantFormData>,
  ): Promise<SAPTenant> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const tenantIndex = tenants.findIndex((tenant) => tenant.id === id);
    if (tenantIndex === -1) {
      throw new Error("Tenant not found");
    }

    tenants[tenantIndex] = {
      ...tenants[tenantIndex],
      ...data,
      updatedAt: new Date(),
    };

    return tenants[tenantIndex];
  }

  static async deleteTenant(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const tenantIndex = tenants.findIndex((tenant) => tenant.id === id);
    if (tenantIndex === -1) {
      throw new Error("Tenant not found");
    }

    tenants.splice(tenantIndex, 1);
  }

  static async testConnection(
    credentials: OAuthCredentials,
    baseUrl: string,
  ): Promise<ConnectionTestResult> {
    // Simulate connection testing with realistic delay
    await new Promise((resolve) =>
      setTimeout(resolve, 2000 + Math.random() * 1000),
    );

    if (this.debugMode) {
      console.log("Testing connection with:", {
        baseUrl,
        clientIdLength: credentials.clientId?.length,
        clientIdStart: credentials.clientId?.substring(0, 10) + "...",
        tokenUrl: credentials.tokenUrl,
      });
    }

    // Enhanced validation logic for SAP Integration Suite
    const isValidUrl = this.validateSAPUrl(baseUrl);
    const hasValidCredentials = this.validateSAPCredentials(credentials);
    const hasValidTokenUrl = this.validateSAPTokenUrl(credentials.tokenUrl);

    if (this.debugMode) {
      console.log("Validation results:", {
        urlValid: isValidUrl,
        credentialsValid: hasValidCredentials,
        tokenUrlValid: hasValidTokenUrl,
      });
    }

    // Simulate different scenarios
    const scenarios = [
      {
        condition: !isValidUrl,
        result: {
          success: false,
          message:
            "Invalid base URL format. Please ensure it starts with https:// and is a valid SAP Integration Suite endpoint.",
          details: {
            tokenObtained: false,
            apiAccessible: false,
            errorCode: "INVALID_URL",
            errorDescription: `Base URL validation failed. Expected SAP Integration Suite URL format, got: ${baseUrl}`,
          },
        },
      },
      {
        condition: !hasValidCredentials,
        result: {
          success: false,
          message:
            "Invalid OAuth credentials. Please check client ID and secret format.",
          details: {
            tokenObtained: false,
            apiAccessible: false,
            errorCode: "INVALID_CREDENTIALS",
            errorDescription:
              "OAuth credentials validation failed - ensure proper SAP client format",
          },
        },
      },
      {
        condition: !hasValidTokenUrl,
        result: {
          success: false,
          message:
            "Invalid token URL. Please ensure it points to a valid SAP OAuth token endpoint.",
          details: {
            tokenObtained: false,
            apiAccessible: false,
            errorCode: "INVALID_TOKEN_URL",
            errorDescription: `Token URL validation failed. Expected SAP authentication URL, got: ${credentials.tokenUrl}`,
          },
        },
      },
    ];

    // Check for failure scenarios
    for (const scenario of scenarios) {
      if (scenario.condition) {
        if (this.debugMode) {
          console.log("Connection test failed:", scenario.result);
        }
        return scenario.result;
      }
    }

    // For demo purposes, let's make it succeed more often with valid SAP credentials
    const successRate = 0.9; // 90% success rate for valid SAP credentials
    const isSuccess = Math.random() < successRate;

    if (isSuccess) {
      if (this.debugMode) {
        console.log("Connection test successful");
      }
      return {
        success: true,
        message:
          "Connection successful! SAP Integration Suite is accessible and OAuth authentication works.",
        responseTime: Math.round(1000 + Math.random() * 2000), // 1-3 seconds
        details: {
          tokenObtained: true,
          apiAccessible: true,
        },
      };
    } else {
      const errorMessages = [
        "Connection timeout. Please check network connectivity to SAP cloud.",
        "Authentication failed. Please verify your SAP OAuth credentials.",
        "SAP Integration Suite service temporarily unavailable.",
        "Rate limit exceeded. Please try again later.",
      ];

      const errorMessage =
        errorMessages[Math.floor(Math.random() * errorMessages.length)];
      if (this.debugMode) {
        console.log("Connection test failed with:", errorMessage);
      }

      return {
        success: false,
        message: errorMessage,
        responseTime: Math.round(5000 + Math.random() * 5000), // 5-10 seconds for failures
        details: {
          tokenObtained: false,
          apiAccessible: false,
          errorCode: "CONNECTION_FAILED",
          errorDescription:
            "Unable to establish connection to SAP Integration Suite",
        },
      };
    }
  }

  static async updateTenantConnectionStatus(
    id: string,
    status: SAPTenant["connectionStatus"],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const tenant = tenants.find((t) => t.id === id);
    if (tenant) {
      tenant.connectionStatus = status;
      tenant.lastTested = new Date();
      tenant.updatedAt = new Date();
    }
  }

  static validateJsonUpload(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if it's the new SAP OAuth config format
    if (data.oauth) {
      return this.validateSAPOAuthConfig(data);
    }

    // Legacy format validation
    if (!data.clientId || typeof data.clientId !== "string") {
      errors.push("Client ID is required and must be a string");
    }

    if (!data.clientSecret || typeof data.clientSecret !== "string") {
      errors.push("Client Secret is required and must be a string");
    }

    if (!data.tokenUrl || typeof data.tokenUrl !== "string") {
      errors.push("Token URL is required and must be a string");
    }

    if (data.tokenUrl && !data.tokenUrl.startsWith("https://")) {
      errors.push("Token URL must start with https://");
    }

    if (
      data.grantType &&
      !["client_credentials", "authorization_code"].includes(data.grantType)
    ) {
      errors.push(
        'Grant type must be either "client_credentials" or "authorization_code"',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateSAPOAuthConfig(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.oauth || typeof data.oauth !== "object") {
      errors.push("OAuth configuration object is required");
      return { isValid: false, errors };
    }

    const oauth = data.oauth;

    if (!oauth.clientid || typeof oauth.clientid !== "string") {
      errors.push("OAuth clientid is required and must be a string");
    }

    if (!oauth.clientsecret || typeof oauth.clientsecret !== "string") {
      errors.push("OAuth clientsecret is required and must be a string");
    }

    if (!oauth.tokenurl || typeof oauth.tokenurl !== "string") {
      errors.push("OAuth tokenurl is required and must be a string");
    }

    if (oauth.tokenurl && !oauth.tokenurl.startsWith("https://")) {
      errors.push("OAuth tokenurl must start with https://");
    }

    if (!oauth.url || typeof oauth.url !== "string") {
      errors.push("OAuth url (base URL) is required and must be a string");
    }

    if (oauth.url && !oauth.url.startsWith("https://")) {
      errors.push("OAuth url (base URL) must start with https://");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static convertSAPOAuthConfigToJsonUpload(data: any): any {
    if (data.oauth) {
      // Convert SAP OAuth config format to internal format
      return {
        clientId: data.oauth.clientid,
        clientSecret: data.oauth.clientsecret,
        tokenUrl: data.oauth.tokenurl,
        baseUrl: data.oauth.url,
        grantType: "client_credentials", // Default for SAP IS
      };
    }

    // Legacy format, return as-is
    return data;
  }

  // Enhanced validation methods for SAP Integration Suite
  private static validateSAPUrl(url: string): boolean {
    if (!url || !url.startsWith("https://")) {
      return false;
    }

    // Check for common SAP Integration Suite URL patterns
    const sapPatterns = [
      /\.hana\.ondemand\.com/,
      /\.cfapps\./,
      /\.it-cpi/,
      /integration-suite/,
      /sap\.com/,
      /\.sap\./,
    ];

    return sapPatterns.some((pattern) => pattern.test(url));
  }

  private static validateSAPCredentials(
    credentials: OAuthCredentials,
  ): boolean {
    if (!credentials.clientId || !credentials.clientSecret) {
      return false;
    }

    // SAP client IDs often have specific patterns
    const clientIdPatterns = [
      /^sb-/, // Service broker pattern
      /!b\d+/, // SAP binding pattern
      /\|it!/, // Integration tenant pattern
    ];

    // Check if client ID matches SAP patterns or is at least reasonable length
    const hasValidClientId =
      clientIdPatterns.some((pattern) => pattern.test(credentials.clientId)) ||
      credentials.clientId.length > 10;

    // SAP client secrets often contain specific characters
    const hasValidClientSecret =
      credentials.clientSecret.length > 20 &&
      (credentials.clientSecret.includes("$") ||
        credentials.clientSecret.includes("-") ||
        credentials.clientSecret.includes("_"));

    return hasValidClientId && hasValidClientSecret;
  }

  private static validateSAPTokenUrl(tokenUrl: string): boolean {
    if (!tokenUrl || !tokenUrl.startsWith("https://")) {
      return false;
    }

    // Check for SAP authentication URL patterns
    const authPatterns = [
      /\.authentication\./,
      /\/oauth\/token$/,
      /\.hana\.ondemand\.com/,
      /\.sap\./,
    ];

    return authPatterns.some((pattern) => pattern.test(tokenUrl));
  }

  // Testing method to validate credentials without full connection test
  static validateCredentialsOnly(
    credentials: OAuthCredentials,
    baseUrl: string,
  ): {
    isValid: boolean;
    details: {
      urlValid: boolean;
      credentialsValid: boolean;
      tokenUrlValid: boolean;
      urlPattern?: string;
      clientIdPattern?: string;
    };
  } {
    const urlValid = this.validateSAPUrl(baseUrl);
    const credentialsValid = this.validateSAPCredentials(credentials);
    const tokenUrlValid = this.validateSAPTokenUrl(credentials.tokenUrl);

    // Debug info
    let urlPattern = "";
    let clientIdPattern = "";

    if (this.debugMode) {
      const sapUrlPatterns = [
        { pattern: /\.hana\.ondemand\.com/, name: "SAP HANA Cloud" },
        { pattern: /\.cfapps\./, name: "Cloud Foundry Apps" },
        { pattern: /\.it-cpi/, name: "Integration CPI" },
        { pattern: /integration-suite/, name: "Integration Suite" },
        { pattern: /sap\.com/, name: "SAP Domain" },
      ];

      const matchedUrlPattern = sapUrlPatterns.find((p) =>
        p.pattern.test(baseUrl),
      );
      urlPattern = matchedUrlPattern
        ? matchedUrlPattern.name
        : "No SAP pattern detected";

      const clientIdPatterns = [
        { pattern: /^sb-/, name: "Service Broker" },
        { pattern: /!b\d+/, name: "SAP Binding" },
        { pattern: /\|it!/, name: "Integration Tenant" },
      ];

      const matchedClientPattern = clientIdPatterns.find((p) =>
        p.pattern.test(credentials.clientId),
      );
      clientIdPattern = matchedClientPattern
        ? matchedClientPattern.name
        : "Generic format";
    }

    return {
      isValid: urlValid && credentialsValid && tokenUrlValid,
      details: {
        urlValid,
        credentialsValid,
        tokenUrlValid,
        urlPattern,
        clientIdPattern,
      },
    };
  }

  // Force success for testing
  static async testConnectionForceSuccess(
    credentials: OAuthCredentials,
    baseUrl: string,
  ): Promise<ConnectionTestResult> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: "Connection successful! (Forced success for testing)",
      responseTime: 1234,
      details: {
        tokenObtained: true,
        apiAccessible: true,
      },
    };
  }
}
