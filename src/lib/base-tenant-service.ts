import {
  BaseTenantData,
  IntegrationPackage,
  IntegrationFlow,
  SAPTenant,
} from "./types";
import { TenantService } from "./tenant-service";
import { BackendProxyService } from "./backend-proxy-service";

export class BaseTenantService {
  // Configuration for testing different approaches
  static useBackendProxy = false; // Set to true to test backend proxy mode

  static async getBaseTenants(): Promise<SAPTenant[]> {
    const allTenants = await TenantService.getAllTenants();
    return allTenants.filter(
      (tenant) =>
        tenant.isBaseTenant && tenant.connectionStatus === "connected",
    );
  }

  static async getBaseTenantData(tenantId: string): Promise<BaseTenantData> {
    const tenant = await TenantService.getTenantById(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    if (!tenant.isBaseTenant) {
      throw new Error("Tenant is not marked as a base tenant");
    }

    // For CCCI_SANDBOX, attempt real API calls with multiple strategies
    if (tenant.name === "CCCI_SANDBOX") {
      try {
        console.log("🔄 Attempting real SAP API connection to CCCI_SANDBOX...");

        // Check if backend proxy mode is enabled
        if (this.useBackendProxy) {
          console.log("🔄 Using Backend Proxy mode...");
          return await BackendProxyService.getBaseTenantDataViaProxy(tenant);
        }

        // Default: Direct API approach with CORS bypass strategies
        console.log("🔄 Using Direct API approach with CORS bypass...");

        // Get OAuth token first
        const token = await this.getOAuthToken(tenantId);
        console.log("✅ OAuth token obtained, proceeding with API calls...");

        // Fetch real packages and iflows from CCCI_SANDBOX tenant
        const packages = await this.fetchRealPackagesFromTenant(tenant, token);
        const iflows = await this.fetchRealIFlowsFromTenant(tenant, token);

        console.log(
          `✅ Successfully fetched ${packages.length} packages and ${iflows.length} iFlows from CCCI_SANDBOX`,
        );

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          packages,
          iflows,
          lastSynced: new Date(),
          connectionStatus: "connected",
        };
      } catch (error) {
        console.error("❌ Failed to fetch real data from CCCI_SANDBOX:", error);

        // If real API fails, throw the error to let user know
        throw new Error(
          `Failed to connect to CCCI_SANDBOX: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // For other tenants, return empty data
    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      packages: [],
      iflows: [],
      lastSynced: new Date(),
      connectionStatus: "connected",
    };
  }

  static async getAllBaseTenantData(): Promise<BaseTenantData[]> {
    const baseTenants = await this.getBaseTenants();
    const baseTenantData: BaseTenantData[] = [];

    for (const tenant of baseTenants) {
      try {
        const data = await this.getBaseTenantData(tenant.id);
        baseTenantData.push(data);
      } catch (error) {
        console.error(`Failed to get data for tenant ${tenant.name}:`, error);
        // If a base tenant fails, add it with error status
        baseTenantData.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          packages: [],
          iflows: [],
          lastSynced: new Date(),
          connectionStatus: "error",
        });
      }
    }

    return baseTenantData;
  }

  static async syncBaseTenant(tenantId: string): Promise<BaseTenantData> {
    console.log(`🔄 Syncing base tenant with real SAP APIs: ${tenantId}`);
    return this.getBaseTenantData(tenantId);
  }

  // Method to get OAuth token for CCCI_SANDBOX tenant
  private static async getOAuthToken(tenantId: string): Promise<string> {
    const tenant = await TenantService.getTenantById(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    console.log(`🔐 Getting OAuth token for CCCI_SANDBOX...`);
    console.log(`Token URL: ${tenant.oauthCredentials.tokenUrl}`);

    // Use the correct SAP Integration Suite scopes
    const sapScopes = [
      "it!b182722.ESBDataStore.readPayload",
      "it!b182722.NodeManager.read",
      "uaa.resource",
      "it!b182722.IntegrationOperationServer.read",
      "it!b182722.ESBDataStore.read",
      "it!b182722.NodeManager.readcredentials",
      "it!b182722.ExternalLoggingActivation.Read",
      "it!b182722.Default",
      "it!b182722.esbmessagestorage.read",
      "it!b182722.WebToolingCatalog.DetailsRead",
      "it!b182722.NodeManager.deploycontent",
      "it!b182722.ResourceUsageData.Read",
      "it!b182722.AccessPoliciesArtifacts.AccessAll",
      "it!b182722.DataArchiving.Read",
      "it!b182722.WebToolingCatalog.OverviewRead",
      "it!b182722.WebToolingWorkspace.Read",
      "it!b182722.Roles.Read",
      "it!b182722.WebToolingWorkspace.Write",
    ].join(" ");

    console.log(`🔑 Using SAP scopes for real API access`);

    try {
      // Try multiple strategies for CORS bypass
      const strategies = [
        () => this.fetchWithCORSProxy(tenant, sapScopes),
        () => this.fetchWithNoCORS(tenant, sapScopes),
        () => this.fetchWithCustomHeaders(tenant, sapScopes),
      ];

      for (let i = 0; i < strategies.length; i++) {
        try {
          console.log(`📡 Trying OAuth strategy ${i + 1}...`);
          const token = await strategies[i]();
          console.log(`✅ OAuth strategy ${i + 1} successful!`);
          return token;
        } catch (error) {
          console.log(`❌ OAuth strategy ${i + 1} failed:`, error);

          // Check if this is a CORS-related error
          if (this.isCORSError(error)) {
            console.log(
              `🚫 CORS policy blocking detected in strategy ${i + 1}`,
            );
          }

          if (i === strategies.length - 1) {
            throw this.createCORSFriendlyError(error); // Last strategy, provide helpful error
          }
        }
      }

      throw new Error(
        "All OAuth strategies failed due to browser security restrictions",
      );
    } catch (error) {
      console.error(`❌ Failed to get OAuth token:`, error);
      throw error; // Re-throw the enhanced error
    }
  }

  // Strategy 1: Use CORS proxy service
  private static async fetchWithCORSProxy(
    tenant: any,
    sapScopes: string,
  ): Promise<string> {
    console.log("🌐 Trying CORS proxy approach...");

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(tenant.oauthCredentials.tokenUrl)}`;

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: tenant.oauthCredentials.grantType,
        client_id: tenant.oauthCredentials.clientId,
        client_secret: tenant.oauthCredentials.clientSecret,
        scope: sapScopes,
      }),
    });

    const responseText = await response.text();
    console.log(`📡 CORS Proxy response: ${response.status} - ${responseText}`);

    if (!response.ok) {
      throw new Error(
        `CORS proxy failed: ${response.status} - ${responseText}`,
      );
    }

    const tokenData = JSON.parse(responseText);
    return tokenData.access_token;
  }

  // Strategy 2: Direct fetch with no-cors mode
  private static async fetchWithNoCORS(
    tenant: any,
    sapScopes: string,
  ): Promise<string> {
    console.log("🚫 Trying no-cors mode...");

    const response = await fetch(tenant.oauthCredentials.tokenUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: tenant.oauthCredentials.grantType,
        client_id: tenant.oauthCredentials.clientId,
        client_secret: tenant.oauthCredentials.clientSecret,
        scope: sapScopes,
      }),
    });

    // no-cors mode doesn't allow reading response, so this is limited
    throw new Error(
      "no-cors mode doesn't allow reading response - need alternative",
    );
  }

  // Strategy 3: Standard fetch with custom headers
  private static async fetchWithCustomHeaders(
    tenant: any,
    sapScopes: string,
  ): Promise<string> {
    console.log("🔧 Trying standard fetch with custom headers...");

    const response = await fetch(tenant.oauthCredentials.tokenUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: new URLSearchParams({
        grant_type: tenant.oauthCredentials.grantType,
        client_id: tenant.oauthCredentials.clientId,
        client_secret: tenant.oauthCredentials.clientSecret,
        scope: sapScopes,
      }),
    });

    const responseText = await response.text();
    console.log(
      `📡 Custom headers response: ${response.status} - ${responseText}`,
    );

    if (!response.ok) {
      throw new Error(
        `Custom headers failed: ${response.status} - ${responseText}`,
      );
    }

    const tokenData = JSON.parse(responseText);
    return tokenData.access_token;
  }

  // Method to fetch real packages from CCCI_SANDBOX tenant
  private static async fetchRealPackagesFromTenant(
    tenant: SAPTenant,
    token: string,
  ): Promise<IntegrationPackage[]> {
    console.log(`📦 Fetching real Integration Packages from CCCI_SANDBOX...`);

    const packagesUrl = `${tenant.baseUrl}/api/v1/IntegrationPackages`;
    console.log(`API URL: ${packagesUrl}`);

    try {
      // Try multiple strategies for API calls
      const strategies = [
        () => this.fetchAPIWithCORSProxy(packagesUrl, token),
        () => this.fetchAPIDirectly(packagesUrl, token),
      ];

      for (let i = 0; i < strategies.length; i++) {
        try {
          console.log(`📡 Trying packages API strategy ${i + 1}...`);
          const data = await strategies[i]();

          // Transform SAP API response to our format
          const packages: IntegrationPackage[] = (
            data.d?.results ||
            data.results ||
            []
          ).map((pkg: any) => ({
            id: pkg.Id || pkg.id || pkg.PackageId,
            name: pkg.Name || pkg.name || pkg.DisplayName,
            description: pkg.Description || pkg.description || "",
            version: pkg.Version || pkg.version || "1.0.0",
            vendor: pkg.Vendor || pkg.vendor || pkg.CreatedBy || "SAP",
            status:
              (pkg.Status || pkg.status || "ACTIVE").toLowerCase() === "active"
                ? "active"
                : "inactive",
            lastModified: new Date(
              pkg.ModifiedAt || pkg.modifiedAt || pkg.CreatedAt || Date.now(),
            ),
            iflowCount: pkg.IntegrationFlowCount || pkg.iflowCount || 0,
          }));

          console.log(
            `✅ Successfully fetched ${packages.length} real packages from CCCI_SANDBOX`,
          );
          return packages;
        } catch (error) {
          console.log(`❌ Packages API strategy ${i + 1} failed:`, error);
          if (i === strategies.length - 1) {
            throw error;
          }
        }
      }

      throw new Error("All packages API strategies failed");
    } catch (error) {
      console.error(`❌ Error fetching real packages:`, error);
      throw error;
    }
  }

  // Method to fetch real iFlows from CCCI_SANDBOX tenant
  private static async fetchRealIFlowsFromTenant(
    tenant: SAPTenant,
    token: string,
  ): Promise<IntegrationFlow[]> {
    console.log(`🔄 Fetching real Integration Flows from CCCI_SANDBOX...`);

    const iflowsUrl = `${tenant.baseUrl}/api/v1/IntegrationDesigntimeArtifacts?$filter=Type%20eq%20'IntegrationFlow'`;
    console.log(`API URL: ${iflowsUrl}`);

    try {
      // Try multiple strategies for API calls
      const strategies = [
        () => this.fetchAPIWithCORSProxy(iflowsUrl, token),
        () => this.fetchAPIDirectly(iflowsUrl, token),
      ];

      for (let i = 0; i < strategies.length; i++) {
        try {
          console.log(`📡 Trying iFlows API strategy ${i + 1}...`);
          const data = await strategies[i]();

          // Transform SAP API response to our format
          const iflows: IntegrationFlow[] = (
            data.d?.results ||
            data.results ||
            []
          ).map((iflow: any) => ({
            id: iflow.Id || iflow.id || iflow.Name,
            name: iflow.Name || iflow.name || iflow.DisplayName,
            description: iflow.Description || iflow.description || "",
            packageId: iflow.PackageId || iflow.packageId || "unknown",
            packageName:
              iflow.PackageName || iflow.packageName || "Unknown Package",
            version: iflow.Version || iflow.version || "1.0.0",
            status: this.mapIFlowStatus(
              iflow.Status || iflow.status || iflow.DeploymentStatus,
            ),
            lastDeployed: iflow.DeployedOn
              ? new Date(iflow.DeployedOn)
              : undefined,
            runtime:
              iflow.Type === "MessageMapping" ? "mapping" : "integration",
            artifacts: (iflow.Artifacts || []).map((art: any) => ({
              id: art.Id || art.id,
              name: art.Name || art.name,
              type: art.Type || art.type || "unknown",
            })),
          }));

          console.log(
            `✅ Successfully fetched ${iflows.length} real iFlows from CCCI_SANDBOX`,
          );
          return iflows;
        } catch (error) {
          console.log(`❌ iFlows API strategy ${i + 1} failed:`, error);
          if (i === strategies.length - 1) {
            throw error;
          }
        }
      }

      throw new Error("All iFlows API strategies failed");
    } catch (error) {
      console.error(`❌ Error fetching real iFlows:`, error);
      throw error;
    }
  }

  // API call with CORS proxy
  private static async fetchAPIWithCORSProxy(
    url: string,
    token: string,
  ): Promise<any> {
    console.log("🌐 Using CORS proxy for API call...");

    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CORS proxy API failed: ${response.status}`);
    }

    const proxyResponse = await response.json();
    return JSON.parse(proxyResponse.contents);
  }

  // Direct API call
  private static async fetchAPIDirectly(
    url: string,
    token: string,
  ): Promise<any> {
    console.log("🎯 Direct API call...");

    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Direct API failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // Helper method to map SAP iFlow status to our status format
  private static mapIFlowStatus(sapStatus: string): IntegrationFlow["status"] {
    const status = (sapStatus || "").toLowerCase();
    switch (status) {
      case "started":
      case "deployed":
      case "running":
        return "started";
      case "stopped":
      case "undeployed":
        return "stopped";
      case "error":
      case "failed":
        return "error";
      case "starting":
        return "starting";
      case "stopping":
        return "stopping";
      default:
        return "stopped";
    }
  }

  // Helper method to detect CORS-related errors
  private static isCORSError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message || error.toString() || "";
    const corsIndicators = [
      "NetworkError when attempting to fetch resource",
      "CORS",
      "Cross-Origin Request Blocked",
      "Access-Control-Allow-Origin",
      "Failed to fetch",
      "No 'Access-Control-Allow-Origin' header",
      "blocked by CORS policy",
      "Cross-origin",
    ];

    return corsIndicators.some((indicator) =>
      errorMessage.toLowerCase().includes(indicator.toLowerCase()),
    );
  }

  // Helper method to create user-friendly CORS error messages
  private static createCORSFriendlyError(originalError: any): Error {
    if (this.isCORSError(originalError)) {
      return new Error(
        "Browser security policy is blocking direct access to SAP APIs. " +
          "This is normal behavior for web applications. " +
          "For production use, you'll need either: " +
          "1) A backend proxy server, " +
          "2) SAP BTP connectivity setup, or " +
          "3) Use a CORS browser extension for testing.",
      );
    }

    // Check for network-related errors
    const errorMessage = originalError?.message || "";
    if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
      return new Error(
        "Network connectivity issue detected. " +
          "Please check your internet connection and verify the SAP tenant is accessible. " +
          "Original error: " +
          errorMessage,
      );
    }

    // Return enhanced version of original error
    return new Error(
      `SAP API connection failed: ${errorMessage}. ` +
        "This may be due to browser security restrictions, network issues, or SAP service availability.",
    );
  }

  // Utility methods
  static getPackagesByStatus(packages: IntegrationPackage[], status?: string) {
    if (!status) return packages;
    return packages.filter((pkg) => pkg.status === status);
  }

  static getIFlowsByStatus(iflows: IntegrationFlow[], status?: string) {
    if (!status) return iflows;
    return iflows.filter((iflow) => iflow.status === status);
  }

  static getIFlowsByPackage(iflows: IntegrationFlow[], packageId: string) {
    return iflows.filter((iflow) => iflow.packageId === packageId);
  }

  static getPackageStats(baseTenantData: BaseTenantData[]) {
    const allPackages = baseTenantData.flatMap((data) => data.packages);
    const allIFlows = baseTenantData.flatMap((data) => data.iflows);

    return {
      totalPackages: allPackages.length,
      activePackages: allPackages.filter((pkg) => pkg.status === "active")
        .length,
      totalIFlows: allIFlows.length,
      runningIFlows: allIFlows.filter((iflow) => iflow.status === "started")
        .length,
      stoppedIFlows: allIFlows.filter((iflow) => iflow.status === "stopped")
        .length,
      errorIFlows: allIFlows.filter((iflow) => iflow.status === "error").length,
      baseTenants: baseTenantData.length,
      connectedBaseTenants: baseTenantData.filter(
        (data) => data.connectionStatus === "connected",
      ).length,
    };
  }
}
