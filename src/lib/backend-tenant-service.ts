/**
 * Backend-enabled Base Tenant Service
 * Uses Python FastAPI backend for SAP Integration Suite calls
 */

import {
  BaseTenantData,
  IntegrationPackage,
  IntegrationFlow,
  SAPTenant,
} from "./types";
import { TenantService } from "./tenant-service";
import {
  backendClient,
  BackendConnectionError,
  BackendSAPError,
  isBackendConnectionError,
} from "./backend-client";
import { toast } from "sonner";

export class BackendBaseTenantService {
  // Configuration
  static useBackend = true; // Set to true to use backend proxy
  static fallbackToSimulation = false; // NO FALLBACK - backend only

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

    // For CCCI_SANDBOX, try backend first, then fallback
    if (tenant.name === "CCCI_SANDBOX") {
      if (this.useBackend) {
        try {
          console.log("🔄 Using Python FastAPI backend for SAP API calls...");
          return await this.getDataFromBackend(tenant);
        } catch (error) {
          console.error("❌ Backend call failed:", error);

          // NO FALLBACK - Provide clear error message for backend setup
          let enhancedError = error;
          if (isBackendConnectionError(error)) {
            const hostname =
              typeof window !== "undefined" ? window.location.hostname : "";
            if (
              hostname.includes("builder.codes") ||
              hostname.includes("builder.io")
            ) {
              enhancedError = new Error(
                "Backend not accessible from Builder.io cloud environment. " +
                  "You must set up ngrok or deploy your Python backend to a cloud service. " +
                  "No mock data available - real backend connection required.",
              );
            } else {
              enhancedError = new Error(
                "Python FastAPI backend not running. " +
                  "Start your backend with: cd backend && python main.py " +
                  "No mock data available - real backend connection required.",
              );
            }
          }

          // Re-throw enhanced error - NO FALLBACK
          throw enhancedError;
        }
      } else {
        throw new Error(
          "Backend mode is disabled. This application requires a Python FastAPI backend. " +
            "No mock data is available. Please start your backend and enable backend mode.",
        );
      }
    }

    // For other tenants, throw error - no mock data allowed
    throw new Error(
      `Tenant '${tenant.name}' is not CCCI_SANDBOX. ` +
        "This application only supports real backend connections to CCCI_SANDBOX. " +
        "No mock or empty data is provided.",
    );
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
    console.log(
      `🔄 Syncing base tenant with ${this.useBackend ? "backend" : "simulation"}: ${tenantId}`,
    );
    return this.getBaseTenantData(tenantId);
  }

  /**
   * Get data from Python FastAPI backend
   */
  private static async getDataFromBackend(
    tenant: SAPTenant,
  ): Promise<BaseTenantData> {
    try {
      // Check if backend is available
      const isAvailable = await backendClient.isBackendAvailable();
      if (!isAvailable) {
        throw new BackendConnectionError(
          "Python backend server is not running on http://localhost:8000",
        );
      }

      console.log("✅ Backend server is available, fetching data...");

      // Get complete base tenant data from backend
      const data = await backendClient.getBaseTenantData();

      console.log(
        `✅ Successfully fetched ${data.packages.length} packages and ${data.iflows.length} iFlows from backend`,
      );

      return data;
    } catch (error) {
      if (error instanceof BackendConnectionError) {
        throw error;
      }

      // Convert other errors to BackendSAPError
      const errorMessage =
        error instanceof Error ? error.message : "Unknown backend error";
      throw new BackendSAPError(
        `Backend SAP API call failed: ${errorMessage}`,
        error,
      );
    }
  }

  // NO SIMULATION DATA - Backend only

  /**
   * Backend Health and Status Methods
   */
  static async getBackendHealth(): Promise<{
    isAvailable: boolean;
    status?: any;
    error?: string;
  }> {
    try {
      const health = await backendClient.getHealth();
      return {
        isAvailable: true,
        status: health,
      };
    } catch (error) {
      return {
        isAvailable: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getBackendConfig(): Promise<any> {
    try {
      const response = await backendClient.getConfig();
      return response.data;
    } catch (error) {
      console.error("Failed to get backend config:", error);
      return null;
    }
  }

  static async refreshBackendToken(): Promise<boolean> {
    try {
      await backendClient.refreshToken();
      return true;
    } catch (error) {
      console.error("Failed to refresh backend token:", error);
      return false;
    }
  }

  static async getBackendTokenStatus(): Promise<any> {
    try {
      return await backendClient.getTokenStatus();
    } catch (error) {
      console.error("Failed to get backend token status:", error);
      return null;
    }
  }

  /**
   * Configuration Methods
   */
  static enableBackend(enable: boolean = true): void {
    this.useBackend = enable;
    console.log(
      `🔄 Backend mode ${enable ? "enabled" : "disabled"}. ${
        enable
          ? "Will use Python FastAPI backend for SAP calls."
          : "Will use simulation mode."
      }`,
    );
  }

  // Fallback removed - backend only mode

  static getConfiguration(): {
    useBackend: boolean;
    backendUrl: string;
  } {
    return {
      useBackend: this.useBackend,
      backendUrl: backendClient.getBackendUrl(),
    };
  }

  // ALL MOCK DATA REMOVED - Backend only mode

  /**
   * Utility methods from original service
   */
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
