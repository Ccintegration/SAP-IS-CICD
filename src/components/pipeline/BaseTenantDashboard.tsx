import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Package,
  Workflow,
  Database,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Server,
  Zap,
  Wifi,
  Globe,
  HelpCircle,
  Settings,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import {
  BaseTenantData,
  IntegrationPackage,
  IntegrationFlow,
} from "@/lib/types";
import { BackendBaseTenantService } from "@/lib/backend-tenant-service";
import CORSSolutionGuide from "@/components/administration/CORSSolutionGuide";
import BackendStatus from "@/components/administration/BackendStatus";

const BaseTenantDashboard: React.FC = () => {
  const [baseTenantData, setBaseTenantData] = useState<BaseTenantData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [connectionError, setConnectionError] = useState<string>("");
  const [showSolutionGuide, setShowSolutionGuide] = useState(false);
  const [showBackendStatus, setShowBackendStatus] = useState(false);

  useEffect(() => {
    loadBaseTenantData();
  }, []);

  const loadBaseTenantData = async () => {
    try {
      setIsLoading(true);
      setConnectionError("");

      console.log("🔄 Loading base tenant data...");
      const data = await BackendBaseTenantService.getAllBaseTenantData();
      setBaseTenantData(data);

      if (data.length > 0 && !selectedTenant) {
        setSelectedTenant(data[0].tenantId);
      }

      if (data.length > 0) {
        const connectedData = data.find(
          (d) => d.connectionStatus === "connected",
        );
        if (connectedData && connectedData.packages.length > 0) {
          const config = BackendBaseTenantService.getConfiguration();
          toast.success(
            `✅ ${config.useBackend ? "Backend" : "Simulation"} data loaded successfully!`,
            {
              description: `Fetched ${connectedData.packages.length} packages and ${connectedData.iflows.length} iFlows from CCCI_SANDBOX`,
            },
          );
        } else {
          toast.info("Connected to CCCI_SANDBOX", {
            description: "Ready to fetch SAP Integration Suite data",
          });
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setConnectionError(errorMessage);

      // Check if this is a backend connection error
      if (
        errorMessage.includes("backend") ||
        errorMessage.includes("localhost:8000")
      ) {
        toast.error("❌ Backend server not available", {
          description: "Python FastAPI backend is not running",
        });
        setShowBackendStatus(true);
      } else {
        toast.error("❌ Failed to connect to CCCI_SANDBOX", {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (tenantId: string) => {
    try {
      setIsSyncing(true);
      setConnectionError("");

      const config = BackendBaseTenantService.getConfiguration();
      toast.info(
        `🔄 ${config.useBackend ? "Backend" : "Simulation"} sync starting...`,
        {
          description: config.useBackend
            ? "Fetching data from Python FastAPI backend"
            : "Using simulated data",
        },
      );

      const updatedData =
        await BackendBaseTenantService.syncBaseTenant(tenantId);

      setBaseTenantData((prev) =>
        prev.map((data) => (data.tenantId === tenantId ? updatedData : data)),
      );

      toast.success(
        `✅ ${config.useBackend ? "Backend" : "Simulation"} sync successful!`,
        {
          description: `Updated ${updatedData.packages.length} packages and ${updatedData.iflows.length} iFlows from CCCI_SANDBOX`,
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setConnectionError(errorMessage);

      if (
        errorMessage.includes("backend") ||
        errorMessage.includes("localhost:8000")
      ) {
        toast.error("❌ Backend server not available", {
          description: "Python FastAPI backend is not running",
        });
        setShowBackendStatus(true);
      } else {
        toast.error("❌ Failed to sync with CCCI_SANDBOX", {
          description: errorMessage,
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleBackendMode = () => {
    const config = BackendBaseTenantService.getConfiguration();
    const newMode = !config.useBackend;

    BackendBaseTenantService.enableBackend(newMode);

    toast.info(
      newMode ? "🔄 Backend mode enabled" : "🔄 Simulation mode enabled",
      {
        description: newMode
          ? "Will use Python FastAPI backend for real SAP calls"
          : "Will use simulated data for demonstration",
      },
    );

    // Automatically refresh data with new mode
    setTimeout(loadBaseTenantData, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const selectedTenantData = baseTenantData.find(
    (data) => data.tenantId === selectedTenant,
  );

  const stats = BackendBaseTenantService.getPackageStats(baseTenantData);
  const config = BackendBaseTenantService.getConfiguration();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Wifi className="w-8 h-8 text-blue-600 animate-pulse mx-auto" />
            <p className="text-gray-600">🔄 Loading CCCI_SANDBOX data...</p>
            <p className="text-sm text-gray-500">
              {config.useBackend
                ? "Connecting to Python FastAPI backend"
                : "Loading simulated data"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (baseTenantData.length === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          No base tenants configured. Please ensure CCCI_SANDBOX tenant is
          marked as "Base Tenant" in the Administration section.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  {config.useBackend ? "Backend Proxy Mode" : "Simulation Mode"}
                </h3>
                <p className="text-sm text-blue-700">
                  {selectedTenantData
                    ? `Data source: ${selectedTenantData.tenantName}`
                    : "No base tenant connected"}
                  {config.useBackend && " via Python FastAPI"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedTenantData &&
                getStatusIcon(selectedTenantData.connectionStatus)}
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                <Zap className="w-3 h-3 mr-1" />
                {config.useBackend ? "Backend" : "Simulation"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Error Display */}
      {connectionError && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">Connection Error:</p>
              <p className="text-sm">{connectionError}</p>

              {connectionError.includes("backend") ||
              connectionError.includes("localhost:8000") ? (
                <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-red-800 mb-1">
                      🐍 Python Backend Not Running
                    </p>
                    <p className="text-red-700">
                      The FastAPI backend server needs to be started first.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBackendStatus(!showBackendStatus)}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    {showBackendStatus ? "Hide" : "Setup"} Backend
                  </Button>
                </div>
              ) : connectionError.includes("Browser security policy") ||
                connectionError.includes("CORS") ||
                connectionError.includes("NetworkError") ? (
                <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-red-800 mb-1">
                      🛡️ This is a CORS/Browser Security Issue
                    </p>
                    <p className="text-red-700">
                      This error is expected in browser environments. We have
                      solutions for you!
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSolutionGuide(!showSolutionGuide)}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <HelpCircle className="w-4 h-4 mr-1" />
                    {showSolutionGuide ? "Hide" : "Show"} Solutions
                  </Button>
                </div>
              ) : (
                <div className="text-xs">
                  <p>Possible solutions:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Check your internet connection</li>
                    <li>Verify SAP tenant credentials</li>
                    <li>Check if SAP services are accessible</li>
                    <li>Review browser console for detailed errors</li>
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Backend Status */}
      {showBackendStatus && (
        <Card className="border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-purple-600" />
                <span>Python FastAPI Backend Setup</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBackendStatus(false)}
              >
                ✕
              </Button>
            </div>
            <CardDescription>
              Setup and monitor your Python backend proxy server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BackendStatus />
          </CardContent>
        </Card>
      )}

      {/* CORS Solution Guide */}
      {showSolutionGuide && (
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>CORS Solutions & Setup Guide</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSolutionGuide(false)}
              >
                ✕
              </Button>
            </div>
            <CardDescription>
              Comprehensive guide to fix browser security restrictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CORSSolutionGuide />
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {stats.totalPackages}
            </div>
            <div className="text-sm text-blue-600">
              {config.useBackend ? "Real" : "Demo"} Packages
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {stats.runningIFlows}
            </div>
            <div className="text-sm text-green-600">
              {config.useBackend ? "Live" : "Demo"} iFlows
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {stats.baseTenants}
            </div>
            <div className="text-sm text-purple-600">SAP Tenants</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">
              {stats.connectedBaseTenants}
            </div>
            <div className="text-sm text-orange-600">Connected</div>
          </CardContent>
        </Card>
      </div>

      {/* Base Tenant Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <CardTitle>
                {config.useBackend ? "Live" : "Demo"} CCCI_SANDBOX Data
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={config.useBackend ? "default" : "outline"}
                size="sm"
                onClick={toggleBackendMode}
              >
                <Server className="w-4 h-4 mr-1" />
                {config.useBackend ? "Backend Mode" : "Enable Backend"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBackendStatus(!showBackendStatus)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Backend Setup
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadBaseTenantData}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh All
              </Button>
            </div>
          </div>
          <CardDescription>
            {config.useBackend
              ? "Real-time data from Python FastAPI backend proxy"
              : "Simulated data for demonstration purposes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {baseTenantData.map((data) => (
            <div key={data.tenantId} className="space-y-6">
              {/* Tenant Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Server className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium">{data.tenantName}</h3>
                    <p className="text-sm text-gray-500">
                      Last synced: {data.lastSynced.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(data.connectionStatus)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(data.tenantId)}
                    disabled={isSyncing}
                  >
                    <Zap
                      className={`w-4 h-4 mr-2 ${isSyncing ? "animate-pulse" : ""}`}
                    />
                    {isSyncing
                      ? config.useBackend
                        ? "Syncing Backend..."
                        : "Syncing Demo..."
                      : config.useBackend
                        ? "Sync Backend"
                        : "Refresh Demo"}
                  </Button>
                </div>
              </div>

              {/* Data Source Status */}
              <Alert
                className={
                  config.useBackend
                    ? "border-green-200 bg-green-50"
                    : "border-blue-200 bg-blue-50"
                }
              >
                <Globe
                  className={`w-4 h-4 ${
                    config.useBackend ? "text-green-600" : "text-blue-600"
                  }`}
                />
                <AlertDescription
                  className={
                    config.useBackend ? "text-green-800" : "text-blue-800"
                  }
                >
                  <p className="font-medium mb-1">
                    {config.useBackend
                      ? "🐍 Python FastAPI Backend Active"
                      : "📋 Simulation Mode Active"}
                  </p>
                  <p className="text-sm">
                    {config.useBackend
                      ? "All data is fetched from your Python backend proxy server. The backend handles OAuth authentication and makes real SAP API calls."
                      : "Using simulated data for demonstration. Enable backend mode to connect to real SAP APIs via Python FastAPI."}
                  </p>
                </AlertDescription>
              </Alert>

              {/* Packages and iFlows */}
              <Tabs defaultValue="packages">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="packages"
                    className="flex items-center space-x-2"
                  >
                    <Package className="w-4 h-4" />
                    <span>
                      {config.useBackend ? "Real" : "Demo"} Packages (
                      {data.packages.length})
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="iflows"
                    className="flex items-center space-x-2"
                  >
                    <Workflow className="w-4 h-4" />
                    <span>
                      {config.useBackend ? "Live" : "Demo"} iFlows (
                      {data.iflows.length})
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="packages" className="space-y-4">
                  {data.packages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="font-medium">No packages found</p>
                      <p className="text-sm">
                        {config.useBackend
                          ? "Check backend connection and SAP credentials"
                          : "Enable backend mode for real data"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {data.packages.map((pkg) => (
                        <Card
                          key={pkg.id}
                          className="border-l-4 border-l-blue-500"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">{pkg.name}</h4>
                                  <Badge
                                    variant={
                                      pkg.status === "active"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={
                                      pkg.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }
                                  >
                                    {pkg.status.charAt(0).toUpperCase() +
                                      pkg.status.slice(1)}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      config.useBackend
                                        ? "bg-green-50 text-green-700"
                                        : "bg-blue-50 text-blue-700"
                                    }`}
                                  >
                                    {config.useBackend
                                      ? "Backend Data"
                                      : "Demo Data"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {pkg.description}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Version: {pkg.version}</span>
                                  <span>Vendor: {pkg.vendor}</span>
                                  <span>iFlows: {pkg.iflowCount}</span>
                                  <span>
                                    Modified:{" "}
                                    {pkg.lastModified.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="iflows" className="space-y-4">
                  {data.iflows.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Workflow className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="font-medium">No integration flows found</p>
                      <p className="text-sm">
                        {config.useBackend
                          ? "Check backend connection and SAP credentials"
                          : "Enable backend mode for real data"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {data.iflows.map((iflow) => (
                        <Card
                          key={iflow.id}
                          className="border-l-4 border-l-green-500"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">{iflow.name}</h4>
                                  <Badge
                                    variant={
                                      iflow.status === "started"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={
                                      iflow.status === "started"
                                        ? "bg-green-100 text-green-800"
                                        : iflow.status === "stopped"
                                          ? "bg-red-100 text-red-800"
                                          : iflow.status === "error"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                    }
                                  >
                                    {iflow.status.charAt(0).toUpperCase() +
                                      iflow.status.slice(1)}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      config.useBackend
                                        ? "bg-green-50 text-green-700"
                                        : "bg-blue-50 text-blue-700"
                                    }`}
                                  >
                                    {config.useBackend
                                      ? "Live Status"
                                      : "Demo Status"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {iflow.description}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Package: {iflow.packageName}</span>
                                  <span>Version: {iflow.version}</span>
                                  <span>Runtime: {iflow.runtime}</span>
                                  <span>
                                    Artifacts: {iflow.artifacts.length}
                                  </span>
                                  {iflow.lastDeployed && (
                                    <span>
                                      Deployed:{" "}
                                      {iflow.lastDeployed.toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Activity
                                  className={`w-4 h-4 ${
                                    iflow.status === "started"
                                      ? "text-green-600 animate-pulse"
                                      : "text-gray-400"
                                  }`}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default BaseTenantDashboard;
