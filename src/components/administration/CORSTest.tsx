import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Loader2,
  TestTube,
  Globe,
  ShieldCheck,
} from "lucide-react";

interface TestResult {
  testName: string;
  status: "pending" | "success" | "error";
  message: string;
  details?: string;
}

const CORSTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runCORSTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests: TestResult[] = [
      {
        testName: "Basic Fetch Test",
        status: "pending",
        message: "Testing basic fetch capability...",
      },
      {
        testName: "CORS Proxy Test",
        status: "pending",
        message: "Testing CORS proxy service...",
      },
      {
        testName: "SAP OAuth Endpoint",
        status: "pending",
        message: "Testing SAP authentication endpoint...",
      },
      {
        testName: "SAP API Endpoint",
        status: "pending",
        message: "Testing SAP Integration Suite API...",
      },
    ];

    setTestResults([...tests]);

    // Test 1: Basic fetch capability
    try {
      const response = await fetch("https://httpbin.org/json", {
        method: "GET",
        mode: "cors",
      });

      if (response.ok) {
        tests[0] = {
          ...tests[0],
          status: "success",
          message: "Basic fetch works correctly",
          details:
            "Your browser can make cross-origin requests to test endpoints",
        };
      } else {
        tests[0] = {
          ...tests[0],
          status: "error",
          message: "Basic fetch failed",
          details: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      tests[0] = {
        ...tests[0],
        status: "error",
        message: "Basic fetch blocked",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
    setTestResults([...tests]);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test 2: CORS proxy test
    try {
      const proxyUrl =
        "https://api.allorigins.win/get?url=" +
        encodeURIComponent("https://httpbin.org/json");

      const response = await fetch(proxyUrl, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        tests[1] = {
          ...tests[1],
          status: "success",
          message: "CORS proxy service is working",
          details: "The allorigins.win proxy service is accessible",
        };
      } else {
        tests[1] = {
          ...tests[1],
          status: "error",
          message: "CORS proxy service failed",
          details: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      tests[1] = {
        ...tests[1],
        status: "error",
        message: "CORS proxy service blocked",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
    setTestResults([...tests]);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test 3: SAP OAuth endpoint
    const sapTokenUrl =
      "https://ccci-integration-suite-fuom1yo5.authentication.eu10.hana.ondemand.com/oauth/token";
    try {
      // We'll attempt a HEAD request first to see if the endpoint is reachable
      const response = await fetch(sapTokenUrl, {
        method: "HEAD",
        mode: "no-cors", // This won't give us response data but will show if blocked
      });

      tests[2] = {
        ...tests[2],
        status: "success",
        message: "SAP OAuth endpoint is reachable",
        details:
          "The SAP authentication service endpoint responds (Note: CORS may still apply for actual OAuth calls)",
      };
    } catch (error) {
      tests[2] = {
        ...tests[2],
        status: "error",
        message: "SAP OAuth endpoint blocked",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
    setTestResults([...tests]);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test 4: SAP API endpoint
    const sapApiUrl =
      "https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com/api/v1/IntegrationPackages";
    try {
      // Similar test for the API endpoint
      const response = await fetch(sapApiUrl, {
        method: "HEAD",
        mode: "no-cors",
      });

      tests[3] = {
        ...tests[3],
        status: "success",
        message: "SAP API endpoint is reachable",
        details:
          "The SAP Integration Suite API endpoint responds (Note: Authentication and CORS policies still apply)",
      };
    } catch (error) {
      tests[3] = {
        ...tests[3],
        status: "error",
        message: "SAP API endpoint blocked",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
    setTestResults([...tests]);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case "error":
        return <Badge variant="destructive">Fail</Badge>;
      case "pending":
        return <Badge variant="secondary">Running...</Badge>;
    }
  };

  const overallStatus =
    testResults.length > 0
      ? testResults.every((t) => t.status === "success")
        ? "all-pass"
        : testResults.some((t) => t.status === "success")
          ? "partial"
          : "fail"
      : "not-run";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="w-5 h-5 text-blue-600" />
          <span>CORS & Connectivity Test</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Test your browser's ability to connect to SAP services and CORS
            proxy services.
          </p>
          <Button onClick={runCORSTests} disabled={isRunning} variant="outline">
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Run Tests
              </>
            )}
          </Button>
        </div>

        {/* Overall Status */}
        {testResults.length > 0 && (
          <Alert
            className={
              overallStatus === "all-pass"
                ? "border-green-200 bg-green-50"
                : overallStatus === "partial"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-red-200 bg-red-50"
            }
          >
            <ShieldCheck
              className={`w-4 h-4 ${
                overallStatus === "all-pass"
                  ? "text-green-600"
                  : overallStatus === "partial"
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            />
            <AlertDescription
              className={
                overallStatus === "all-pass"
                  ? "text-green-800"
                  : overallStatus === "partial"
                    ? "text-yellow-800"
                    : "text-red-800"
              }
            >
              {overallStatus === "all-pass" && (
                <p>
                  <strong>🎉 All tests passed!</strong> Your browser and network
                  setup appears to be working well. You may still encounter CORS
                  issues with SAP APIs specifically, which would require
                  additional solutions.
                </p>
              )}
              {overallStatus === "partial" && (
                <p>
                  <strong>⚠️ Mixed results.</strong> Some connectivity works but
                  you may need additional CORS solutions for full SAP API
                  access.
                </p>
              )}
              {overallStatus === "fail" && (
                <p>
                  <strong>❌ Connectivity issues detected.</strong> Your browser
                  or network may be blocking cross-origin requests. Check the
                  solutions guide above.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Test Results:</h4>
            {testResults.map((test, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium text-sm">{test.testName}</span>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
                <p className="text-sm text-gray-600 mb-1">{test.message}</p>
                {test.details && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {test.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Note:</strong> These tests check basic connectivity and
            proxy services. SAP-specific CORS policies may still block actual
            API calls even if these tests pass.
          </p>
          <p>
            If tests fail, try installing a CORS browser extension or
            implementing a backend proxy solution.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CORSTest;
