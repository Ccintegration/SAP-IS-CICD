import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Settings,
  Link,
  ExternalLink,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Cloud,
  Monitor,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { backendClient } from "@/lib/backend-client";

const BackendURLConfig: React.FC = () => {
  const [backendUrl, setBackendUrl] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    status: "unknown" | "connected" | "failed";
    message: string;
    details?: {
      responseTime?: number;
      serverVersion?: string;
      backendUrl?: string;
    };
  }>({ status: "unknown", message: "" });

  useEffect(() => {
    // Load saved backend URL from localStorage
    const savedUrl = localStorage.getItem("backend_ngrok_url");
    if (savedUrl) {
      setBackendUrl(savedUrl);
    }

    // Check current environment
    checkCurrentEnvironment();
  }, []);

  const checkCurrentEnvironment = () => {
    const hostname = window.location.hostname;
    const isBuilderEnvironment =
      hostname.includes("builder.codes") || hostname.includes("builder.io");

    if (isBuilderEnvironment) {
      setConnectionStatus({
        status: "failed",
        message: "Running in Builder.io cloud - localhost not accessible",
      });
    }
  };

  const testConnection = async (url?: string) => {
    const testUrl = url || backendUrl;
    if (!testUrl) {
      toast.error("Please enter a backend URL");
      return;
    }

    setIsTestingConnection(true);
    const startTime = Date.now();

    try {
      // Create a temporary client with the test URL
      const testClient = new (backendClient.constructor as any)(testUrl);
      const isAvailable = await testClient.isBackendAvailable();

      const responseTime = Date.now() - startTime;

      if (isAvailable) {
        // Try to get additional server info
        let serverVersion = "Unknown";
        try {
          const health = await testClient.getHealth();
          serverVersion = health?.version || "FastAPI Backend";
        } catch (e) {
          // Health endpoint might not exist, but connection works
        }

        setConnectionStatus({
          status: "connected",
          message: "🎉 Test Connection Successful!",
          details: {
            responseTime,
            serverVersion,
            backendUrl: testUrl,
          },
        });

        // Show simple success toast (brief)
        toast.success("Connection test successful!", {
          duration: 3000,
        });
      } else {
        setConnectionStatus({
          status: "failed",
          message: "❌ Backend server not responding",
          details: {
            responseTime,
            backendUrl: testUrl,
          },
        });
        toast.error("❌ Backend connection test failed", {
          description: "Server is not responding or not accessible",
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      
      setConnectionStatus({
        status: "failed",
        message: `❌ Connection Failed: ${errorMessage}`,
        details: {
          responseTime,
          backendUrl: testUrl,
        },
      });
      
      toast.error("❌ Connection test failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveBackendUrl = () => {
    if (backendUrl) {
      localStorage.setItem("backend_ngrok_url", backendUrl);

      // Update the backend client immediately
      backendClient.updateBaseUrl(backendUrl);

      toast.success("✅ Backend URL saved and applied successfully!");

      // Test the connection automatically after saving
      setTimeout(() => {
        testConnection(backendUrl);
      }, 500);
    } else {
      localStorage.removeItem("backend_ngrok_url");
      backendClient.updateBaseUrl("");
      toast.info("Backend URL cleared");
      setConnectionStatus({
        status: "unknown",
        message: "Backend URL cleared",
      });
    }
  };

  const getCurrentEnvironment = () => {
    const hostname = window.location.hostname;
    if (hostname.includes("builder.codes") || hostname.includes("builder.io")) {
      return "Builder.io Cloud";
    } else if (hostname === "localhost" || hostname.startsWith("127.")) {
      return "Local Development";
    }
    return "Unknown Environment";
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case "connected":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Wifi className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case "connected":
        return "border-green-200 bg-green-50";
      case "failed":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="space-y-4">
      {/* Environment Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Current Environment</p>
                <p className="text-sm text-gray-600">{getCurrentEnvironment()}</p>
              </div>
            </div>
            <div className="text-right">
              {getCurrentEnvironment() === "Builder.io Cloud" ? (
                <p className="text-sm">
                  You're running in Builder.io's cloud environment. Local
                  backend access requires ngrok or similar tunneling service.
                </p>
              ) : (
                <p className="text-sm">
                  You're running locally. Backend should be accessible at{" "}
                  <code>http://localhost:8000</code>.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Connection Status with Success Details */}
      <Card className={getStatusColor()}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {getStatusIcon()}
            <div className="flex-1">
              <p className="font-medium">Backend Connection Status</p>
              <p className="text-sm">{connectionStatus.message}</p>
              
              {/* Success Details */}
              {connectionStatus.status === "connected" && connectionStatus.details && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-green-800">Response Time:</span>
                      <p className="text-green-700">{connectionStatus.details.responseTime}ms</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Server Type:</span>
                      <p className="text-green-700">{connectionStatus.details.serverVersion}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Backend URL:</span>
                      <p className="text-green-700 font-mono text-xs break-all">
                        {connectionStatus.details.backendUrl}
                      </p>
                    </div>
                  </div>
                  <Alert className="mt-3 border-green-300 bg-green-50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <span className="font-medium">Connection Test Successful!</span>
                      <br />
                      Your Python FastAPI backend is running and accessible. 
                      The SAP Integration Suite dashboard can now connect to your backend.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Failure Details */}
              {connectionStatus.status === "failed" && connectionStatus.details && (
                <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
                  <div className="text-sm">
                    <span className="font-medium text-red-800">Attempted URL:</span>
                    <p className="text-red-700 font-mono text-xs break-all">
                      {connectionStatus.details.backendUrl}
                    </p>
                    {connectionStatus.details.responseTime && (
                      <>
                        <span className="font-medium text-red-800">Response Time:</span>
                        <p className="text-red-700">{connectionStatus.details.responseTime}ms</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backend URL Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-purple-600" />
            <span>Backend URL Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backendUrl">Backend Server URL</Label>
            <Input
              id="backendUrl"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="https://your-ngrok-url.ngrok.io or http://localhost:8000"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Enter your backend server URL. Use ngrok URL for cloud access or
              localhost for local development.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => testConnection()}
                disabled={isTestingConnection || !backendUrl}
              >
                <Monitor className="w-4 h-4 mr-1" />
                {isTestingConnection ? "Testing..." : "Test Connection"}
              </Button>
              <Button onClick={saveBackendUrl} disabled={!backendUrl}>
                <Zap className="w-4 h-4 mr-1" />
                Save & Apply
              </Button>
            </div>

            {/* Inline Connection Test Results */}
            {connectionStatus.status === "connected" && connectionStatus.details && (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-medium">✅ Test Connection Successful!</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Response Time:</span>
                        <p className="text-green-700">{connectionStatus.details.responseTime}ms</p>
                      </div>
                      <div>
                        <span className="font-medium">Server Type:</span>
                        <p className="text-green-700">{connectionStatus.details.serverVersion}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <p className="text-green-700">Backend Ready</p>
                      </div>
                    </div>
                    <p className="text-sm">
                      Your Python FastAPI backend is running and accessible. 
                      The SAP Integration Suite dashboard can now connect to your backend.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Inline Connection Test Failure */}
            {connectionStatus.status === "failed" && connectionStatus.details && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">❌ Test Connection Failed</p>
                    <div className="text-sm">
                      <span className="font-medium">Attempted URL:</span>
                      <p className="font-mono text-xs break-all">{connectionStatus.details.backendUrl}</p>
                      {connectionStatus.details.responseTime && (
                        <>
                          <span className="font-medium">Response Time:</span>
                          <p>{connectionStatus.details.responseTime}ms</p>
                        </>
                      )}
                    </div>
                    <p className="text-sm">
                      Please check that your Python backend is running and accessible at the configured URL.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="w-5 h-5 text-green-600" />
            <span>Setup Instructions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {getCurrentEnvironment() === "Builder.io Cloud" ? (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                🌥️ Cloud Environment Setup (ngrok required):
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">
                    1. Start your Python backend locally:
                  </p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                    cd backend && python main.py
                  </code>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">
                    2. Expose backend with ngrok:
                  </p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                    npm install -g ngrok && ngrok http 8000
                  </code>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">
                    3. Copy the ngrok URL and paste it above:
                  </p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                    https://xyz-abc-123.ngrok.io
                  </code>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                🏠 Local Development Setup:
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Start your Python backend:</p>
                <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                  cd backend && python main.py
                </code>
                <p className="text-xs text-gray-600">
                  Backend should be accessible at http://localhost:8000
                </p>
              </div>
            </div>
          )}

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <p className="font-medium mb-1">💡 Testing Tips:</p>
              <ul className="text-sm space-y-1">
                <li>• Use "Test Connection" to verify your backend is accessible</li>
                <li>• Successful tests will show response time and server details</li>
                <li>• Save the URL after a successful test to apply the configuration</li>
                <li>• The connection test confirms your SAP dashboard can reach the backend</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackendURLConfig;