// File Path: src/components/administration/BackendStatus.tsx
// Filename: BackendStatus.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Server,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Settings,
  Code,
  Database,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { BackendBaseTenantService } from "@/lib/backend-tenant-service";
import { backendClient } from "@/lib/backend-client";
import BackendURLConfig from "./BackendURLConfig";

interface BackendHealth {
  isAvailable: boolean;
  status?: any;
  error?: string;
}

interface SAPHealth {
  isHealthy: boolean;
  tokenStatus: string;
  lastChecked: string;
  responseTime?: number;
  error?: string;
}

interface PythonHealth {
  isRunning: boolean;
  version?: string;
  memory?: string;
  uptime?: string;
  error?: string;
}

interface ConsolidatedHealthReport {
  python: PythonHealth;
  sap: SAPHealth;
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

const BackendStatus: React.FC = () => {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [tokenStatus, setTokenStatus] = useState<any>(null);
  const [consolidatedHealth, setConsolidatedHealth] = useState<ConsolidatedHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHealthReportOpen, setIsHealthReportOpen] = useState(false);

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkSAPHealth = async (): Promise<SAPHealth> => {
    try {
      // Use the correct OAuth token endpoint from backend
      const response = await fetch(`${backendClient.getBaseURL()}/api/sap/token-status`);
      
      if (response.ok) {
        const tokenData = await response.json();
        
        // Check if token is valid and not expired
        const isHealthy = tokenData.success && 
                         tokenData.data?.token_status === 'valid' && 
                         (tokenData.data?.time_to_expiry_seconds || 0) > 300; // At least 5 minutes left
        
        return {
          isHealthy,
          tokenStatus: tokenData.data?.token_status || 'unknown',
          lastChecked: new Date().toISOString(),
          responseTime: tokenData.responseTime,
        };
      } else {
        return {
          isHealthy: false,
          tokenStatus: 'error',
          lastChecked: new Date().toISOString(),
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        isHealthy: false,
        tokenStatus: 'unreachable',
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const checkPythonHealth = async (): Promise<PythonHealth> => {
    try {
      const response = await fetch(`${backendClient.getBaseURL()}/health`);
      
      if (response.ok) {
        const healthData = await response.json();
        
        return {
          isRunning: true,
          version: healthData.python_version || '3.x',
          memory: healthData.memory_usage || 'N/A',
          uptime: healthData.uptime || 'N/A',
        };
      } else {
        return {
          isRunning: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        isRunning: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  };

  const checkConsolidatedHealth = async () => {
    const [pythonHealth, sapHealth] = await Promise.all([
      checkPythonHealth(),
      checkSAPHealth(),
    ]);

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
    
    if (pythonHealth.isRunning && sapHealth.isHealthy) {
      overall = 'healthy';
    } else if (pythonHealth.isRunning && !sapHealth.isHealthy) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    const consolidatedReport: ConsolidatedHealthReport = {
      python: pythonHealth,
      sap: sapHealth,
      overall,
    };

    setConsolidatedHealth(consolidatedReport);
    return consolidatedReport;
  };

  const checkBackendStatus = async () => {
    setIsLoading(true);
    try {
      // Check backend health
      const healthResult = await BackendBaseTenantService.getBackendHealth();
      setHealth(healthResult);

      if (healthResult.isAvailable) {
        // Get backend configuration
        const configResult = await BackendBaseTenantService.getBackendConfig();
        setConfig(configResult);

        // Get token status
        const tokenResult = await BackendBaseTenantService.getBackendTokenStatus();
        setTokenStatus(tokenResult);

        // Get consolidated health report
        await checkConsolidatedHealth();

        toast.success("✅ Backend server is running and healthy!");
      } else {
        toast.error("❌ Backend server is not available", {
          description: healthResult.error || "Cannot connect to backend",
        });
      }
    } catch (error) {
      console.error("Failed to check backend status:", error);
      setHealth({
        isAvailable: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    setIsRefreshing(true);
    try {
      const success = await BackendBaseTenantService.refreshBackendToken();
      if (success) {
        toast.success("✅ Backend token refreshed successfully!");
        // Refresh token status and health report
        const tokenResult = await BackendBaseTenantService.getBackendTokenStatus();
        setTokenStatus(tokenResult);
        await checkConsolidatedHealth();
      } else {
        toast.error("❌ Failed to refresh backend token");
      }
    } catch (error) {
      toast.error("❌ Token refresh failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthStatusColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusBadge = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-300';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'unhealthy': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Backend Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-600" />
              <span>Python Backend Configuration</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkBackendStatus}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {health === null ? (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-gray-500">Checking backend status...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Overview */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {health.isAvailable ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {health.isAvailable ? "Backend Connected" : "Backend Unavailable"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {health.isAvailable
                        ? "Python FastAPI server is running"
                        : health.error || "Cannot connect to backend"}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    health.isAvailable
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {health.isAvailable ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              {/* Consolidated Health Report - Collapsible */}
              {health.isAvailable && consolidatedHealth && (
                <Collapsible 
                  open={isHealthReportOpen} 
                  onOpenChange={setIsHealthReportOpen}
                  className="border rounded-lg"
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Activity className={`w-5 h-5 ${getHealthStatusColor(consolidatedHealth.overall)}`} />
                        <div className="text-left">
                          <h3 className="font-medium">System Health Report</h3>
                          <p className="text-sm text-gray-500">
                            Python Backend + SAP APIs Status
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getHealthStatusBadge(consolidatedHealth.overall)}>
                          {consolidatedHealth.overall.charAt(0).toUpperCase() + consolidatedHealth.overall.slice(1)}
                        </Badge>
                        {isHealthReportOpen ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t bg-gray-50/50 p-4 space-y-4">
                      {/* Python Backend Health */}
                      <div className="bg-white p-3 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium flex items-center">
                            <Code className="w-4 h-4 mr-2 text-blue-600" />
                            Python Backend
                          </h4>
                          <Badge className={consolidatedHealth.python.isRunning ? 
                            "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {consolidatedHealth.python.isRunning ? "Running" : "Down"}
                          </Badge>
                        </div>
                        {consolidatedHealth.python.isRunning ? (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Version:</span>
                              <div className="font-medium">{consolidatedHealth.python.version}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Memory:</span>
                              <div className="font-medium">{consolidatedHealth.python.memory}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Uptime:</span>
                              <div className="font-medium">{consolidatedHealth.python.uptime}</div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-red-600 text-sm">{consolidatedHealth.python.error}</p>
                        )}
                      </div>

                      {/* SAP API Health */}
                      <div className="bg-white p-3 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium flex items-center">
                            <Database className="w-4 h-4 mr-2 text-purple-600" />
                            SAP Integration Suite APIs
                          </h4>
                          <Badge className={consolidatedHealth.sap.isHealthy ? 
                            "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {consolidatedHealth.sap.isHealthy ? "Healthy" : "Issues"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Token Status:</span>
                            <div className="font-medium">{consolidatedHealth.sap.tokenStatus}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Checked:</span>
                            <div className="font-medium">
                              {new Date(consolidatedHealth.sap.lastChecked).toLocaleTimeString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Response Time:</span>
                            <div className="font-medium">
                              {consolidatedHealth.sap.responseTime ? `${consolidatedHealth.sap.responseTime}ms` : 'N/A'}
                            </div>
                          </div>
                        </div>
                        {consolidatedHealth.sap.error && (
                          <p className="text-red-600 text-sm mt-2">{consolidatedHealth.sap.error}</p>
                        )}
                      </div>

                      {/* Refresh Button */}
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={checkConsolidatedHealth}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Refresh Health Check
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backend Configuration Tabs */}
      {health?.isAvailable && (
        <Tabs defaultValue="status" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Server Status</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="token">Token Management</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span>Server Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {config ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Badge className="bg-green-100 text-green-800">
                        RUNNING
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">Status</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {config.environment || "development"}
                      </div>
                      <p className="text-xs text-gray-500">Environment</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {config.port || 8000}
                      </div>
                      <p className="text-xs text-gray-500">Port</p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600">
                        {config.cors_enabled ? "✅" : "❌"}
                      </div>
                      <p className="text-xs text-gray-500">CORS Enabled</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">
                    Configuration data not available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <BackendURLConfig />
          </TabsContent>

          <TabsContent value="token">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <span>OAuth Token Management</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshToken}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Refresh Token
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tokenStatus ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <Badge
                          className={
                            tokenStatus.token_status === "valid"
                              ? "bg-green-100 text-green-800"
                              : tokenStatus.token_status === "expired"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {tokenStatus.token_status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Status</p>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {tokenStatus.time_to_expiry_seconds
                            ? `${Math.floor(tokenStatus.time_to_expiry_seconds / 60)}m`
                            : "N/A"}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Time to Expiry
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {tokenStatus.token_type || "N/A"}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Token Type</p>
                      </div>
                    </div>

                    {tokenStatus.expires_at && (
                      <p className="text-xs text-gray-500">
                        Expires at:{" "}
                        {new Date(tokenStatus.expires_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">
                    Token status not available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Setup Instructions */}
      {!health?.isAvailable && (
        <Alert className="border-blue-200 bg-blue-50">
          <Code className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-medium">🚀 Start Your Python Backend</p>
              <div className="text-sm space-y-1">
                <p>
                  1. Navigate to the backend directory: <code>cd backend</code>
                </p>
                <p>
                  2. Install dependencies:{" "}
                  <code>pip install -r requirements.txt</code>
                </p>
                <p>
                  3. Start the server: <code>python main.py</code>
                </p>
                <p>
                  4. The backend will be available at{" "}
                  <code>http://localhost:8000</code>
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BackendStatus;