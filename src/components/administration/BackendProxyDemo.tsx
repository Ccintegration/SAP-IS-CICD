import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Server,
  Activity,
  Database,
  Zap,
  CheckCircle,
  Clock,
  RefreshCw,
  Code,
  Shield,
  Globe,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { BackendProxyService } from "@/lib/backend-proxy-service";
import { TenantService } from "@/lib/tenant-service";

interface ProxyHealth {
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  tokensInCache: number;
  lastRequest: Date | null;
}

const BackendProxyDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [proxyHealth, setProxyHealth] = useState<ProxyHealth | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [architectureView, setArchitectureView] = useState<
    "current" | "production"
  >("current");

  useEffect(() => {
    checkProxyHealth();
  }, []);

  const checkProxyHealth = async () => {
    try {
      const health = await BackendProxyService.getProxyHealth();
      setProxyHealth(health);
    } catch (error) {
      console.error("Failed to check proxy health:", error);
    }
  };

  const testBackendProxy = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      toast.info("🔄 Testing Backend Proxy Simulation...", {
        description: "Demonstrating how a production backend would work",
      });

      // Get CCCI_SANDBOX tenant
      const tenant = await TenantService.getTenantById("ccci-sandbox-001");
      if (!tenant) {
        throw new Error("CCCI_SANDBOX tenant not found");
      }

      console.log("🎯 [Demo] Testing Backend Proxy with CCCI_SANDBOX...");

      // Test the backend proxy service
      const result =
        await BackendProxyService.getBaseTenantDataViaProxy(tenant);

      setTestResults(result);

      toast.success("✅ Backend Proxy Test Successful!", {
        description: `Fetched ${result.packages.length} packages and ${result.iflows.length} iFlows via simulated backend`,
      });

      // Update proxy health
      await checkProxyHealth();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("❌ Backend Proxy Test Failed", {
        description: errorMessage,
      });
      console.error("Backend proxy test failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTokenCache = () => {
    BackendProxyService.clearTokenCache();
    toast.success("🧹 Token cache cleared");
    checkProxyHealth();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Alert className="border-blue-200 bg-blue-50">
        <Server className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <p className="font-medium">
              🏗️ Backend Proxy Architecture Demonstration
            </p>
            <p className="text-sm">
              This demonstrates how Option 3 (Backend Proxy) would work in
              production. We're simulating a backend service that handles SAP
              API calls without CORS restrictions.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Architecture Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-purple-600" />
            <span>Architecture Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={architectureView}
            onValueChange={(value) =>
              setArchitectureView(value as "current" | "production")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current (Demo Mode)</TabsTrigger>
              <TabsTrigger value="production">Production Backend</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 text-blue-800">
                  Current Demo Implementation:
                </h4>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Browser</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-purple-600" />
                    <span>CORS Proxy</span>
                    <Badge variant="outline" className="text-xs">
                      Simulation
                    </Badge>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>SAP APIs</span>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Uses CORS proxy to simulate backend behavior for demonstration
                  purposes
                </p>
              </div>
            </TabsContent>

            <TabsContent value="production" className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 text-green-800">
                  Production Backend Implementation:
                </h4>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Browser</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-green-600" />
                    <span>Your Backend</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Production
                    </Badge>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>SAP APIs</span>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-green-700">
                    <strong>Backend Technologies:</strong> Node.js, Python,
                    Java, .NET, etc.
                  </p>
                  <p className="text-xs text-green-700">
                    <strong>Deployment:</strong> AWS, Azure, Google Cloud, SAP
                    BTP, etc.
                  </p>
                  <p className="text-xs text-green-700">
                    <strong>Features:</strong> Token caching, rate limiting,
                    error handling, logging
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Proxy Health Status */}
      {proxyHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Backend Proxy Health</span>
              </div>
              <Button variant="outline" size="sm" onClick={checkProxyHealth}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge className={getStatusColor(proxyHealth.status)}>
                  {proxyHealth.status.toUpperCase()}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">Service Status</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {proxyHealth.responseTime}ms
                </div>
                <p className="text-xs text-gray-500">Response Time</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {proxyHealth.tokensInCache}
                </div>
                <p className="text-xs text-gray-500">Cached Tokens</p>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600">
                  {proxyHealth.lastRequest
                    ? proxyHealth.lastRequest.toLocaleTimeString()
                    : "Never"}
                </div>
                <p className="text-xs text-gray-500">Last Request</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Backend Proxy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-green-600" />
            <span>Test Backend Proxy with Your SAP Credentials</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Test the simulated backend proxy using your CCCI_SANDBOX
              credentials. This demonstrates how a production backend would
              handle SAP API calls.
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearTokenCache}
                disabled={isLoading}
              >
                Clear Cache
              </Button>
              <Button onClick={testBackendProxy} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Test Backend Proxy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-medium">
                      ✅ Backend Proxy Test Successful!
                    </p>
                    <p className="text-sm">
                      Successfully fetched {testResults.packages.length}{" "}
                      packages and {testResults.iflows.length} iFlows from{" "}
                      {testResults.tenantName} via simulated backend proxy.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-blue-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {testResults.packages.length}
                      </div>
                      <p className="text-sm text-blue-700">
                        Integration Packages
                      </p>
                      {testResults.packages.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Sample: {testResults.packages[0].name}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {testResults.iflows.length}
                      </div>
                      <p className="text-sm text-green-700">
                        Integration Flows
                      </p>
                      {testResults.iflows.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Sample: {testResults.iflows[0].name}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Production Implementation Guide */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <Code className="w-5 h-5" />
            <span>Production Implementation Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-orange-800">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Create Backend Service</p>
                <p className="text-sm">
                  Set up Node.js, Python, or Java backend service to handle SAP
                  API calls
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Implement Proxy Endpoints</p>
                <p className="text-sm">
                  Create API endpoints that mirror the SAP APIs (e.g.,
                  /api/packages, /api/iflows)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Handle Authentication</p>
                <p className="text-sm">
                  Store SAP credentials securely and manage OAuth token
                  lifecycle
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Update Frontend</p>
                <p className="text-sm">
                  Point your app to call your backend endpoints instead of SAP
                  APIs directly
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-100 p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">
              💡 What you've tested here works exactly like this!
            </p>
            <p className="text-xs">
              The simulation above demonstrates the exact flow your production
              backend would implement, just replace the CORS proxy with your
              server.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackendProxyDemo;
