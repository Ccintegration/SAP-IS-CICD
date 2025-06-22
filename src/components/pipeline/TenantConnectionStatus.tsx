import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Settings,
  ArrowRight,
  Loader2,
  Server,
  AlertTriangle,
} from "lucide-react";
import { PipelineSAPService } from "@/lib/pipeline-sap-service";

const TenantConnectionStatus: React.FC = () => {
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadTenantInfo();
  }, []);

  const loadTenantInfo = async () => {
    setIsLoading(true);
    try {
      // Load tenant info
      const info = await PipelineSAPService.getTenantInfo();
      setTenantInfo(info);

      // Load backend status
      const backend = await PipelineSAPService.getBackendStatus();
      setBackendStatus(backend);

      if (info.isRegistered && backend.isConfigured) {
        // Automatically test connection if both tenant and backend are configured
        await testConnection();
      }
    } catch (error) {
      console.error("Failed to load tenant info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const result = await PipelineSAPService.testConnection();
      setConnectionTest(result);
    } catch (error) {
      console.error("Connection test error:", error);
      setConnectionTest({
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            Checking SAP tenant registration and backend connection...
          </p>
        </CardContent>
      </Card>
    );
  }

  const getOverallStatus = () => {
    if (!tenantInfo?.isRegistered) return "tenant-missing";
    if (!backendStatus?.isConfigured) return "backend-missing";
    if (!backendStatus?.isHealthy) return "backend-unhealthy";
    if (connectionTest?.success) return "connected";
    if (connectionTest && !connectionTest.success) return "sap-error";
    return "ready";
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card
        className={
          overallStatus === "connected"
            ? "border-green-200 bg-green-50"
            : overallStatus === "ready"
              ? "border-blue-200 bg-blue-50"
              : overallStatus === "backend-unhealthy" ||
                  overallStatus === "sap-error"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database
                className={`w-5 h-5 ${
                  overallStatus === "connected"
                    ? "text-green-600"
                    : overallStatus === "ready"
                      ? "text-blue-600"
                      : overallStatus === "backend-unhealthy" ||
                          overallStatus === "sap-error"
                        ? "text-red-600"
                        : "text-amber-600"
                }`}
              />
              <span
                className={
                  overallStatus === "connected"
                    ? "text-green-800"
                    : overallStatus === "ready"
                      ? "text-blue-800"
                      : overallStatus === "backend-unhealthy" ||
                          overallStatus === "sap-error"
                        ? "text-red-800"
                        : "text-amber-800"
                }
              >
                Frontend → Backend → SAP Connection
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                className={
                  overallStatus === "connected"
                    ? "bg-green-100 text-green-800 border-green-300"
                    : overallStatus === "ready"
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : overallStatus === "backend-unhealthy" ||
                          overallStatus === "sap-error"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                }
              >
                {overallStatus === "connected" ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : overallStatus === "ready" ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                {overallStatus === "connected"
                  ? "Connected"
                  : overallStatus === "ready"
                    ? "Ready to Test"
                    : overallStatus === "tenant-missing"
                      ? "Tenant Missing"
                      : overallStatus === "backend-missing"
                        ? "Backend Missing"
                        : overallStatus === "backend-unhealthy"
                          ? "Backend Error"
                          : "SAP Error"}
              </Badge>
              {(overallStatus === "ready" || overallStatus === "connected") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Test Connection
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Tenant Status */}
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  tenantInfo?.isRegistered ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  1. SAP Tenant Registration
                </p>
                <p className="text-xs text-gray-600">
                  {tenantInfo?.isRegistered
                    ? `✅ ${tenantInfo.name} registered`
                    : "❌ No tenant registered"}
                </p>
              </div>
            </div>

            {/* Backend Status */}
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  backendStatus?.isConfigured && backendStatus?.isHealthy
                    ? "bg-green-500"
                    : backendStatus?.isConfigured
                      ? "bg-red-500"
                      : "bg-amber-500"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">2. Backend API Server</p>
                <p className="text-xs text-gray-600">
                  {backendStatus?.isConfigured
                    ? backendStatus?.isHealthy
                      ? `✅ Backend healthy at ${backendStatus.url}`
                      : `❌ Backend error: ${backendStatus.error}`
                    : "⚠️ Backend URL not configured"}
                </p>
              </div>
            </div>
            {/* SAP Connection Status */}
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionTest?.success
                    ? "bg-green-500"
                    : connectionTest
                      ? "bg-red-500"
                      : "bg-gray-400"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  3. SAP Integration Suite Data
                </p>
                <p className="text-xs text-gray-600">
                  {connectionTest?.success
                    ? `✅ ${connectionTest.tenantInfo?.packageCount} packages, ${connectionTest.tenantInfo?.iflowCount} iFlows`
                    : connectionTest
                      ? `❌ ${connectionTest.message}`
                      : "⏳ Ready to test"}
                </p>
              </div>
            </div>

            {/* Connection Test Result */}
            {connectionTest && (
              <div
                className={`p-3 rounded-md ${
                  connectionTest.success ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    connectionTest.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {connectionTest.success ? "🟢" : "🔴"} Connection Test Result
                </p>
                <p
                  className={`text-xs ${
                    connectionTest.success ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {connectionTest.message}
                </p>
                {connectionTest.tenantInfo && (
                  <div className="mt-2 text-xs text-green-600">
                    <p>
                      📊 Data Retrieved:{" "}
                      {connectionTest.tenantInfo.packageCount} packages,{" "}
                      {connectionTest.tenantInfo.iflowCount} iFlows
                    </p>
                    <p>
                      🔗 Connection Type:{" "}
                      {connectionTest.tenantInfo.connectionType}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {overallStatus === "tenant-missing" && (
        <Alert className="border-amber-200 bg-amber-50">
          <Settings className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-2">
              <p className="font-medium">📋 Step 1: Register SAP Tenant</p>
              <p className="text-sm">
                Please register your SAP Integration Suite tenant in the
                Administration tab first.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/administration">
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Go to Administration
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {overallStatus === "backend-missing" && (
        <Alert className="border-red-200 bg-red-50">
          <Server className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">🔧 Step 2: Configure Backend API</p>
              <p className="text-sm">
                Your Python FastAPI backend is not configured or running.
              </p>
              <div className="text-xs space-y-1">
                <p>
                  • Start your Python backend: <code>python main.py</code>
                </p>
                <p>• Configure backend URL in Administration tab</p>
                <p>
                  • For cloud access, use ngrok: <code>ngrok http 8000</code>
                </p>
                <p>• Ensure backend is accessible from this environment</p>
              </div>
              <div className="flex space-x-2 mt-3">
                <Button variant="outline" size="sm" asChild>
                  <a href="/administration">
                    <Settings className="w-4 h-4 mr-1" />
                    Configure Backend
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const hostname = window.location.hostname;
                    const isCloud =
                      hostname.includes("builder.codes") ||
                      hostname.includes("builder.io");

                    if (isCloud) {
                      window.open(
                        "https://ngrok.com/docs/getting-started",
                        "_blank",
                      );
                    } else {
                      // Show local backend instructions
                      alert(
                        "For local development:\n\n1. cd backend\n2. python main.py\n\nBackend will be available at http://localhost:8000",
                      );
                    }
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Setup Help
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {overallStatus === "backend-unhealthy" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">⚠️ Backend Connection Error</p>
              <p className="text-sm">
                Backend is configured but not responding: {backendStatus?.error}
              </p>
              <div className="text-xs space-y-1">
                <p>• Check if Python backend is running</p>
                <p>• Verify backend URL: {backendStatus?.url}</p>
                <p>• Check firewall/network connectivity</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {overallStatus === "connected" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-1">
              <p className="font-medium">🚀 Pipeline Ready!</p>
              <p className="text-sm">
                Your CI/CD Pipeline is connected to real SAP data through your
                backend API. You can now select packages and iFlows from your{" "}
                <strong>{tenantInfo.name}</strong> tenant.
              </p>
              <p className="text-xs text-green-600 mt-2">
                ✅ Architecture: Frontend → Python Backend → SAP Integration
                Suite APIs
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TenantConnectionStatus;
