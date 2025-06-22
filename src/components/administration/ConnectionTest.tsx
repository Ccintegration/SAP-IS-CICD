import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Wifi,
  Shield,
  Server,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { ConnectionTestResult } from "@/lib/types";

interface ConnectionTestProps {
  isLoading: boolean;
  result: ConnectionTestResult | null;
  error?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

const ConnectionTest: React.FC<ConnectionTestProps> = ({
  isLoading,
  result,
  error,
  onRetry,
  showRetry = false,
}) => {
  if (!isLoading && !result && !error) {
    return null;
  }

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusBadge = (success: boolean) => {
    if (success) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          Success
        </Badge>
      );
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return "N/A";
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wifi className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Connection Test</CardTitle>
          </div>
          {result && showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Test
            </Button>
          )}
        </div>
        <CardDescription>
          Testing connectivity to SAP Integration Suite
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Testing connection...</span>
            </div>
            <Progress value={33} className="w-full" />
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Validating OAuth credentials</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Testing token endpoint</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Verifying API access</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(result.success)}
                <div>
                  <p className="font-medium text-gray-900">
                    {result.success
                      ? "Connection Successful"
                      : "Connection Failed"}
                  </p>
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                {getStatusBadge(result.success)}
                {result.responseTime && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatResponseTime(result.responseTime)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Results */}
            {result.details && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Test Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-white border rounded">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">OAuth Token</span>
                    </div>
                    {getStatusIcon(result.details.tokenObtained)}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border rounded">
                    <div className="flex items-center space-x-2">
                      <Server className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">API Access</span>
                    </div>
                    {getStatusIcon(result.details.apiAccessible)}
                  </div>
                </div>

                {/* Error Details */}
                {!result.success && result.details.errorCode && (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">
                          Error Code: {result.details.errorCode}
                        </p>
                        {result.details.errorDescription && (
                          <p className="text-sm">
                            {result.details.errorDescription}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Success Actions */}
            {result.success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">
                      Ready to Register
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      The connection test was successful. You can now proceed to
                      register this tenant.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Failure Recommendations */}
            {!result.success && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">
                      Connection Failed
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Please check your credentials and network connectivity.
                      Common issues include:
                    </p>
                    <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                      <li>Invalid client ID or secret</li>
                      <li>Incorrect token URL</li>
                      <li>Network connectivity issues</li>
                      <li>Insufficient permissions or scope</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionTest;
