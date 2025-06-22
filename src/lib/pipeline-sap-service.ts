import { TenantService } from "./tenant-service";
import { backendClient } from "./backend-client";
import { SAPTenant, IntegrationPackage, IntegrationFlow } from "./types";

interface SAPPackage {
  id: string;
  name: string;
  description: string;
  version: string;
  lastModified: string;
  author: string;
  iflowCount: number;
  status: "active" | "draft" | "deprecated";
}

interface SAPIFlow {
  id: string;
  name: string;
  packageId: string;
  description: string;
  version: string;
  status: "active" | "draft" | "error";
  lastModified: string;
  author: string;
  type: "http" | "mail" | "sftp" | "database";
}

// Define the SAP API response structure for integration flows
interface SAPIntegrationFlowResponse {
  Id?: string;
  id?: string;
  Name?: string;
  name?: string;
  Description?: string;
  description?: string;
  Version?: string;
  version?: string;
  PackageId?: string;
  packageId?: string;
  ModifiedBy?: string;
  modifiedBy?: string;
  CreatedBy?: string;
  createdBy?: string;
  ModifiedAt?: string;
  modifiedDate?: string;
  CreatedAt?: string;
  createdDate?: string;
}

export class PipelineSAPService {
  /**
   * Get the base tenant (registered SAP Integration Suite tenant)
   */
  private static async getBaseTenant(): Promise<SAPTenant | null> {
    const tenants = await TenantService.getAllTenants();
    return tenants.find((tenant) => tenant.isBaseTenant) || null;
  }

  /**
   * Transform backend IntegrationPackage to pipeline format
   */
  private static transformPackage(pkg: IntegrationPackage): SAPPackage {
    // Handle different possible field names from SAP API
    const modifiedDate = (pkg as any).modifiedDate || (pkg as any).lastModified || (pkg as any).ModifiedDate || new Date().toISOString();
    const modifiedBy = (pkg as any).modifiedBy || (pkg as any).author || (pkg as any).ModifiedBy || (pkg as any).createdBy || (pkg as any).CreatedBy || "SAP User";
    
    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description || "No description available",
      version: pkg.version || "1.0.0",
      lastModified: modifiedDate,
      author: modifiedBy,
      iflowCount: 0, // This will be updated by the calling function
      status: "active" as const,
    };
  }

  /**
   * Transform backend IntegrationFlow to pipeline format
   */
  private static transformIFlow(iflow: SAPIntegrationFlowResponse): SAPIFlow {
    // SAP API returns fields with uppercase names (Id, Name, Description, etc.)
    const id = iflow.Id || iflow.id || "";
    const name = iflow.Name || iflow.name || "Unnamed Integration Flow";
    const description =
      iflow.Description || iflow.description || "No description available";
    const version = iflow.Version || iflow.version || "1.0.0";
    const packageId = iflow.PackageId || iflow.packageId || "";
    const modifiedBy =
      iflow.ModifiedBy ||
      iflow.modifiedBy ||
      iflow.CreatedBy ||
      iflow.createdBy ||
      "SAP User";
    const modifiedAt =
      iflow.ModifiedAt ||
      iflow.modifiedDate ||
      iflow.CreatedAt ||
      iflow.createdDate ||
      new Date().toISOString();

    // Convert timestamp to readable date if it's a timestamp
    let lastModified = modifiedAt;
    if (typeof modifiedAt === "string" && /^\d+$/.test(modifiedAt)) {
      // It's a timestamp like "1746621043166"
      lastModified = new Date(parseInt(modifiedAt)).toISOString();
    }

    const transformed: SAPIFlow = {
      id,
      name,
      packageId,
      description,
      version,
      status: "active" as const, // SAP doesn't provide status in design-time artifacts
      lastModified,
      author: modifiedBy,
      type: PipelineSAPService.determineFlowType(name, description),
    };

    return transformed;
  }

  /**
   * Helper method to determine flow type from name/description and SAP data
   */
  private static determineFlowType(
    name: string,
    description: string,
  ): "http" | "mail" | "sftp" | "database" {
    const text = (name + " " + description).toLowerCase();

    // Check for specific patterns in SAP integration flows
    if (
      text.includes("mail") ||
      text.includes("email") ||
      text.includes("smtp")
    )
      return "mail";
    if (
      text.includes("sftp") ||
      text.includes("ftp") ||
      text.includes("file") ||
      text.includes("csv")
    )
      return "sftp";
    if (
      text.includes("database") ||
      text.includes("db") ||
      text.includes("sql") ||
      text.includes("hana") ||
      text.includes("s4") ||
      text.includes("erp")
    )
      return "database";
    if (
      text.includes("soap") ||
      text.includes("rest") ||
      text.includes("api") ||
      text.includes("http") ||
      text.includes("odata")
    )
      return "http";

    // Default to http for most SAP integrations
    return "http";
  }

  /**
   * Get all integration packages from backend API with iflow counts
   */
  static async getIntegrationPackages(): Promise<SAPPackage[]> {
    try {
      console.log(
        "🔄 Fetching integration packages from backend API → SAP Systems...",
      );

      // First verify we have a registered tenant
      const baseTenant = await this.getBaseTenant();
      if (!baseTenant) {
        throw new Error(
          "No base tenant registered. Please register your SAP Integration Suite tenant in Administration first.",
        );
      }

      console.log(`📡 Using registered tenant: ${baseTenant.name}`);

      // Refresh backend URL to get latest configuration
      backendClient.refreshBackendUrl();
      const currentBackendUrl = backendClient.getBaseUrl();

      if (!currentBackendUrl || currentBackendUrl === "") {
        throw new Error(
          "Backend URL not configured. Please configure your Python FastAPI backend URL in the Administration tab.",
        );
      }

      console.log(`🔗 Using backend URL: ${currentBackendUrl}`);

      // Fetch packages through backend API
      const packages = await backendClient.getIntegrationPackages();

      console.log(
        `✅ Successfully fetched ${packages.length} packages from SAP`,
      );

      // Get all iflows once and count them per package
      console.log("📊 Calculating iflow counts for packages...");
      const iflowCounts: Record<string, number> = {};

      try {
        // Fetch all iflows in one call (more efficient)
        const allIFlows = await backendClient.getIntegrationFlows();

        // Count iflows per package
        allIFlows.forEach((iflow: SAPIntegrationFlowResponse) => {
          const packageId = iflow.PackageId || iflow.packageId || "";
          if (packageId) {
            iflowCounts[packageId] = (iflowCounts[packageId] || 0) + 1;
          }
        });

        console.log(`📊 Found iflows in packages:`, iflowCounts);
      } catch (error) {
        console.warn("Failed to fetch iflows for counting:", error);
        // Will use default count of 0 for all packages
      }

      // Transform packages and add calculated iflow counts
      const transformedPackages = packages.map((pkg) => {
        const transformed = PipelineSAPService.transformPackage(pkg);
        transformed.iflowCount = iflowCounts[pkg.id] || 0;
        return transformed;
      });

      console.log(
        `📊 Successfully calculated iflow counts for ${transformedPackages.length} packages`,
      );

      return transformedPackages;
    } catch (error) {
      console.error("❌ Failed to fetch packages from backend:", error);

      // Check if it's a backend connection error
      if (
        error instanceof Error &&
        (error.message.includes("Cannot connect to backend") ||
          error.message.includes("Backend may not be running") ||
          error.message.includes("No backend URL configured"))
      ) {
        throw new Error(
          `Backend connection failed: ${error.message}. Please ensure your Python FastAPI backend is running and accessible.`,
        );
      }

      // Re-throw the original error for other types of failures
      throw error;
    }
  }

  /**
   * Get integration flows from backend API
   */
  static async getIntegrationFlows(packageIds?: string[]): Promise<SAPIFlow[]> {
    try {
      console.log(
        "🔍 [DEBUG] getIntegrationFlows called with packageIds:",
        packageIds,
      );

      if (packageIds && packageIds.length > 0) {
        console.log(
          `🔄 Fetching integration flows from ${packageIds.length} selected packages: ${packageIds.join(", ")}`,
        );
      } else {
        console.log("🔄 Fetching integration flows from all packages...");
      }

      // First verify we have a registered tenant
      const baseTenant = await this.getBaseTenant();
      if (!baseTenant) {
        throw new Error(
          "No base tenant registered. Please register your SAP Integration Suite tenant in Administration first.",
        );
      }

      console.log(`📡 Using registered tenant: ${baseTenant.name}`);

      // Refresh backend URL to get latest configuration
      backendClient.refreshBackendUrl();
      const currentBackendUrl = backendClient.getBaseUrl();

      if (!currentBackendUrl || currentBackendUrl === "") {
        throw new Error(
          "Backend URL not configured. Please configure your Python FastAPI backend URL in the Administration tab.",
        );
      }

      console.log(`🔗 Using backend URL: ${currentBackendUrl}`);

      // Fetch iFlows through backend API with package filter
      const iflows = await backendClient.getIntegrationFlows(packageIds);

      console.log(
        `✅ Successfully fetched ${iflows.length} iFlows from SAP${packageIds ? ` (from ${packageIds.length} selected packages)` : ""}`,
      );

      // Transform to pipeline format
      const transformedIFlows = iflows.map((iflow: SAPIntegrationFlowResponse) => 
        this.transformIFlow(iflow)
      );

      return transformedIFlows;
    } catch (error) {
      console.error("❌ Failed to fetch iFlows from backend:", error);

      // Check if it's a backend connection error
      if (
        error instanceof Error &&
        (error.message.includes("Cannot connect to backend") ||
          error.message.includes("Backend may not be running") ||
          error.message.includes("No backend URL configured"))
      ) {
        throw new Error(
          `Backend connection failed: ${error.message}. Please ensure your Python FastAPI backend is running and accessible.`,
        );
      }

      // Re-throw the original error for other types of failures
      throw error;
    }
  }

  /**
   * Test connection through backend API
   */
  static async testConnection(): Promise<{
    success: boolean;
    message: string;
    tenantInfo?: {
      name: string;
      baseUrl: string;
      packageCount: number;
      iflowCount: number;
      connectionType: string;
    };
  }> {
    try {
      // First verify we have a registered tenant
      const baseTenant = await this.getBaseTenant();
      if (!baseTenant) {
        return {
          success: false,
          message:
            "No SAP tenant registered. Please register your tenant in the Administration tab first.",
        };
      }

      console.log(
        `🧪 Testing connection: Frontend → Backend → ${baseTenant.name}`,
      );

      // Refresh backend URL to get latest configuration
      backendClient.refreshBackendUrl();
      const currentBackendUrl = backendClient.getBaseUrl();

      if (!currentBackendUrl || currentBackendUrl === "") {
        throw new Error(
          "Backend URL not configured. Please configure your Python FastAPI backend URL in the Administration tab.",
        );
      }

      console.log(`🔗 Testing backend at: ${currentBackendUrl}`);

      // Test backend health first
      try {
        const health = await backendClient.getHealth();
        console.log("✅ Backend health check passed");
      } catch (healthError) {
        console.error("❌ Backend health check failed:", healthError);
        throw new Error(
          `Backend server is not accessible at ${currentBackendUrl}: ${healthError instanceof Error ? healthError.message : "Unknown error"}`,
        );
      }

      // Test actual data retrieval
      const packages = await backendClient.getIntegrationPackages();
      const iflows = await backendClient.getIntegrationFlows();

      console.log(
        `✅ Successfully connected! Got ${packages.length} packages and ${iflows.length} iFlows`,
      );

      return {
        success: true,
        message: `Successfully connected to ${baseTenant.name} through backend API!`,
        tenantInfo: {
          name: baseTenant.name,
          baseUrl: baseTenant.baseUrl,
          packageCount: packages.length,
          iflowCount: iflows.length,
          connectionType: "Backend API → SAP",
        },
      };
    } catch (error) {
      console.error("❌ Connection test failed:", error);

      let message = `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`;

      // Provide specific guidance based on error type
      if (
        error instanceof Error &&
        error.message.includes("Cannot connect to backend")
      ) {
        message = `Backend connection failed. Please ensure your Python FastAPI backend is running. ${error.message}`;
      } else if (
        error instanceof Error &&
        error.message.includes("No backend URL configured")
      ) {
        message = `Backend URL not configured. Please configure your backend URL in the Administration tab.`;
      }

      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Get tenant information for display
   */
  static async getTenantInfo(): Promise<{
    name: string;
    baseUrl: string;
    isRegistered: boolean;
  }> {
    const baseTenant = await this.getBaseTenant();

    if (!baseTenant) {
      return {
        name: "No tenant registered",
        baseUrl: "",
        isRegistered: false,
      };
    }

    return {
      name: baseTenant.name,
      baseUrl: baseTenant.baseUrl,
      isRegistered: true,
    };
  }

  /**
   * Get backend status for debugging
   */
  static async getBackendStatus(): Promise<{
    isConfigured: boolean;
    isHealthy: boolean;
    url: string;
    error?: string;
  }> {
    try {
      // Refresh backend URL to get latest configuration
      backendClient.refreshBackendUrl();
      const backendUrl = backendClient.getBaseUrl();

      if (!backendUrl || backendUrl === "") {
        return {
          isConfigured: false,
          isHealthy: false,
          url: "",
          error:
            "No backend URL configured. Please set backend URL in Administration tab.",
        };
      }

      const health = await backendClient.getHealth();

      return {
        isConfigured: true,
        isHealthy: true,
        url: backendUrl,
      };
    } catch (error) {
      return {
        isConfigured: true,
        isHealthy: false,
        url: backendClient.getBaseUrl(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}