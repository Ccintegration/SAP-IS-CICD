// Simulated Backend Proxy Service
// This demonstrates how a production backend proxy would work

import {
  SAPTenant,
  IntegrationPackage,
  IntegrationFlow,
  BaseTenantData,
} from "./types";

interface ProxyRequest {
  method: "GET" | "POST";
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  credentials: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    baseUrl: string;
  };
}

interface ProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
  responseTime: number;
}

export class BackendProxyService {
  private static baseProxyUrl = "https://api.allorigins.win"; // Using public CORS proxy as backend simulation
  private static tokenCache = new Map<
    string,
    { token: string; expires: number }
  >();

  /**
   * Simulates how a production backend proxy would handle SAP API calls
   * In production, this would be your Node.js/Python/Java backend service
   */
  static async makeProxiedRequest(
    request: ProxyRequest,
  ): Promise<ProxyResponse> {
    const startTime = Date.now();

    try {
      console.log(
        `🔄 [Backend Proxy] Processing ${request.method} ${request.endpoint}`,
      );

      // Step 1: Get or refresh OAuth token (server-side)
      const token = await this.getOrRefreshToken(request.credentials);

      // Step 2: Make the actual API call through proxy
      const response = await this.executeProxiedCall(
        request.endpoint,
        token,
        request.method,
      );

      const responseTime = Date.now() - startTime;

      console.log(`✅ [Backend Proxy] Request completed in ${responseTime}ms`);

      return {
        success: true,
        data: response,
        statusCode: 200,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error(
        `❌ [Backend Proxy] Request failed after ${responseTime}ms:`,
        errorMessage,
      );

      return {
        success: false,
        error: errorMessage,
        statusCode: 500,
        responseTime,
      };
    }
  }

  /**
   * Simulates server-side OAuth token management
   * In production, this would securely store and refresh tokens
   */
  private static async getOrRefreshToken(credentials: any): Promise<string> {
    const cacheKey = `${credentials.clientId}_${credentials.tokenUrl}`;
    const cached = this.tokenCache.get(cacheKey);

    // Check if we have a valid cached token
    if (cached && cached.expires > Date.now()) {
      console.log(`🔄 [Backend Proxy] Using cached OAuth token`);
      return cached.token;
    }

    console.log(`🔑 [Backend Proxy] Requesting new OAuth token...`);

    // Simulate server-side OAuth request (no CORS issues)
    const tokenRequestBody = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      scope: [
        "it!b182722.ESBDataStore.readPayload",
        "it!b182722.NodeManager.read",
        "uaa.resource",
        "it!b182722.IntegrationOperationServer.read",
        "it!b182722.ESBDataStore.read",
        "it!b182722.WebToolingCatalog.DetailsRead",
        "it!b182722.WebToolingWorkspace.Read",
      ].join(" "),
    });

    // Use CORS proxy to simulate backend behavior
    const proxyUrl = `${this.baseProxyUrl}/raw?url=${encodeURIComponent(credentials.tokenUrl)}`;

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: tokenRequestBody,
    });

    if (!response.ok) {
      throw new Error(
        `OAuth failed: ${response.status} ${response.statusText}`,
      );
    }

    const tokenData = await response.json();
    const token = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 3600; // Default 1 hour

    // Cache the token (server-side would use Redis/database)
    this.tokenCache.set(cacheKey, {
      token,
      expires: Date.now() + expiresIn * 1000 - 60000, // Refresh 1 minute early
    });

    console.log(`��� [Backend Proxy] OAuth token obtained and cached`);
    return token;
  }

  /**
   * Simulates server-side API call execution
   * In production, this would make direct HTTP calls without CORS restrictions
   */
  private static async executeProxiedCall(
    endpoint: string,
    token: string,
    method: string,
  ): Promise<any> {
    console.log(`📡 [Backend Proxy] Making ${method} call to ${endpoint}`);

    // Use CORS proxy to simulate server-side call
    const proxyUrl = `${this.baseProxyUrl}/get?url=${encodeURIComponent(endpoint)}`;

    const response = await fetch(proxyUrl, {
      method: "GET", // CORS proxy limitation - would be actual method in backend
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`,
      );
    }

    const proxyData = await response.json();
    return JSON.parse(proxyData.contents);
  }

  /**
   * High-level method to get SAP Integration Packages through backend proxy
   */
  static async getIntegrationPackages(
    credentials: any,
  ): Promise<IntegrationPackage[]> {
    const endpoint = `${credentials.baseUrl}/api/v1/IntegrationPackages`;

    const response = await this.makeProxiedRequest({
      method: "GET",
      endpoint,
      credentials,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch packages");
    }

    const packages = response.data.d?.results || response.data.results || [];

    return packages.map((pkg: any) => ({
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
  }

  /**
   * High-level method to get SAP Integration Flows through backend proxy
   */
  static async getIntegrationFlows(
    credentials: any,
  ): Promise<IntegrationFlow[]> {
    const endpoint = `${credentials.baseUrl}/api/v1/IntegrationDesigntimeArtifacts?$filter=Type%20eq%20'IntegrationFlow'`;

    const response = await this.makeProxiedRequest({
      method: "GET",
      endpoint,
      credentials,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch iFlows");
    }

    const iflows = response.data.d?.results || response.data.results || [];

    return iflows.map((iflow: any) => ({
      id: iflow.Id || iflow.id || iflow.Name,
      name: iflow.Name || iflow.name || iflow.DisplayName,
      description: iflow.Description || iflow.description || "",
      packageId: iflow.PackageId || iflow.packageId || "unknown",
      packageName: iflow.PackageName || iflow.packageName || "Unknown Package",
      version: iflow.Version || iflow.version || "1.0.0",
      status: this.mapIFlowStatus(
        iflow.Status || iflow.status || iflow.DeploymentStatus,
      ),
      lastDeployed: iflow.DeployedOn ? new Date(iflow.DeployedOn) : undefined,
      runtime: iflow.Type === "MessageMapping" ? "mapping" : "integration",
      artifacts: (iflow.Artifacts || []).map((art: any) => ({
        id: art.Id || art.id,
        name: art.Name || art.name,
        type: art.Type || art.type || "unknown",
      })),
    }));
  }

  /**
   * Complete backend proxy simulation for base tenant data
   */
  static async getBaseTenantDataViaProxy(
    tenant: SAPTenant,
  ): Promise<BaseTenantData> {
    console.log(
      `🔄 [Backend Proxy] Fetching complete base tenant data for ${tenant.name}`,
    );

    try {
      const credentials = {
        clientId: tenant.oauthCredentials.clientId,
        clientSecret: tenant.oauthCredentials.clientSecret,
        tokenUrl: tenant.oauthCredentials.tokenUrl,
        baseUrl: tenant.baseUrl,
      };

      // Fetch both packages and iflows in parallel (like a real backend would)
      const [packages, iflows] = await Promise.all([
        this.getIntegrationPackages(credentials),
        this.getIntegrationFlows(credentials),
      ]);

      console.log(
        `✅ [Backend Proxy] Successfully fetched ${packages.length} packages and ${iflows.length} iFlows`,
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
      console.error(
        `❌ [Backend Proxy] Failed to fetch base tenant data:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Utility methods
   */
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

  /**
   * Get proxy service health and performance stats
   */
  static async getProxyHealth(): Promise<{
    status: "healthy" | "degraded" | "down";
    responseTime: number;
    tokensInCache: number;
    lastRequest: Date | null;
  }> {
    const startTime = Date.now();

    try {
      // Test proxy health with a simple request
      const response = await fetch(
        `${this.baseProxyUrl}/get?url=https://httpbin.org/json`,
      );
      const responseTime = Date.now() - startTime;

      return {
        status: response.ok ? "healthy" : "degraded",
        responseTime,
        tokensInCache: this.tokenCache.size,
        lastRequest: new Date(),
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - startTime,
        tokensInCache: this.tokenCache.size,
        lastRequest: null,
      };
    }
  }

  /**
   * Clear token cache (for testing/admin purposes)
   */
  static clearTokenCache(): void {
    this.tokenCache.clear();
    console.log(`🧹 [Backend Proxy] Token cache cleared`);
  }
}
