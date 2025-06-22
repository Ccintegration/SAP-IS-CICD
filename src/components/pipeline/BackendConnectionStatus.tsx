import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Settings,
  AlertTriangle,
  Server,
  Globe,
  ExternalLink,
  Code,
  Zap,
  RefreshCw,
} from "lucide-react";
import { BackendBaseTenantService } from "@/lib/backend-tenant-service";
import { backendClient } from "@/lib/backend-client";
import BackendSetupGuide from "./BackendSetupGuide";

const BackendConnectionStatus: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<{
    available: boolean;
    error?: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    setIsChecking(true);
    try {
      const health = await BackendBaseTenantService.getBackendHealth();
      setBackendStatus({
        available: health.isAvailable,
        error: health.error,
      });
    } catch (error) {
      setBackendStatus({
        available: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getEnvironmentInfo = () => {
    const hostname = window.location.hostname;
    if (hostname.includes("builder.codes") || hostname.includes("builder.io")) {
      return {
        type: "Builder.io Cloud",
        requiresNgrok: true,
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
      };
    } else if (hostname === "localhost" || hostname.startsWith("127.")) {
      return {
        type: "Local Development",
        requiresNgrok: false,
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-800",
      };
    } else {
      return {
        type: "Custom Environment",
        requiresNgrok: true,
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        textColor: "text-purple-800",
      };
    }
  };

  const config = BackendBaseTenantService.getConfiguration();
  const envInfo = getEnvironmentInfo();

  return (
    <div className="space-y-4">
      {/* Backend Status Header */}
      <Card className={`${envInfo.bgColor} ${envInfo.borderColor}`}>
        <CardHeader>
          <CardTitle
            className={`flex items-center justify-between ${envInfo.textColor}`}
          >
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>Python Backend Connection</span>
            </div>
            <div className="flex items-center space-x-2">
              {backendStatus?.available ? (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Disconnected
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={checkBackendStatus}
                disabled={isChecking}
              >
                {isChecking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={envInfo.textColor}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Environment:</p>
                <p className="text-xs">{envInfo.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Backend URL:</p>
                <p className="text-xs font-mono">
                  {config.backendUrl || "Not configured"}
                </p>
              </div>
            </div>

            {backendStatus?.available ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <p className="font-medium">✅ Backend Connected</p>
                  <p className="text-sm">
                    Python FastAPI backend is running and accessible. Ready for
                    real SAP API calls.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-medium">❌ Backend Not Available</p>
                  <p className="text-sm">
                    {backendStatus?.error || "Python backend is not accessible"}
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Navigation Guide */}
      {!backendStatus?.available && <BackendSetupGuide />}

      {/* Setup Instructions */}
      {!backendStatus?.available && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-orange-600" />
              <span>Backend Setup Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <p className="font-medium mb-2">🚫 No Mock Data Available</p>
                <p className="text-sm">
                  This CI/CD Pipeline requires a live Python FastAPI backend
                  connection. No simulation or mock data is provided.
                </p>
              </AlertDescription>
            </Alert>

            {envInfo.requiresNgrok ? (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Cloud Environment Setup:
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">
                    1. Start your Python backend locally:
                  </p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                    cd backend && python main.py
                  </code>

                  <p className="text-sm font-medium">
                    2. Expose backend with ngrok:
                  </p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                    npm install -g ngrok && ngrok http 8000
                  </code>

                  <p className="text-sm font-medium">
                    3. Configure ngrok URL in Administration:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.href = "/administration";
                    }}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Go to Administration
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Local Development Setup:
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">
                    Start your Python backend:
                  </p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                    cd backend && python main.py
                  </code>
                  <p className="text-xs text-gray-600">
                    Backend should be accessible at http://localhost:8000
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Code className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                For detailed instructions, see{" "}
                <code className="bg-gray-100 px-1 rounded">
                  BACKEND_IMPLEMENTATION_GUIDE.md
                </code>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Status */}
      <Alert
        className={
          backendStatus?.available
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }
      >
        <Globe
          className={`w-4 h-4 ${
            backendStatus?.available ? "text-green-600" : "text-red-600"
          }`}
        />
        <AlertDescription
          className={
            backendStatus?.available ? "text-green-800" : "text-red-800"
          }
        >
          <p className="font-medium">
            {backendStatus?.available
              ? "🎉 Ready for CI/CD Pipeline"
              : "⚠️ CI/CD Pipeline Unavailable"}
          </p>
          <p className="text-sm">
            {backendStatus?.available
              ? "Backend is connected. You can proceed with the CI/CD pipeline using real SAP Integration Suite data."
              : "Connect your Python backend to access real SAP data and proceed with the CI/CD pipeline. No mock data is available."}
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BackendConnectionStatus;
