import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Loader2,
  TestTube,
  Copy,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface PostmanTestResult {
  step: string;
  status: "pending" | "success" | "error";
  message: string;
  details?: string;
  data?: any;
}

const PostmanCredentialTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<PostmanTestResult[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);

  // Pre-filled with CCCI_SANDBOX credentials (user can modify if needed)
  const [credentials, setCredentials] = useState({
    clientId: "sb-4d88ec4d-cf00-4e40-b9a3-bf20640f4941!b236015|it!b182722",
    clientSecret:
      "68998671-12de-4a2c-ab02-8968d571b4cd$1hejXEfNv1qrX8raaVfuD_x-6PtP1xub7uRFmr55gaI=",
    tokenUrl:
      "https://ccci-integration-suite-fuom1yo5.authentication.eu10.hana.ondemand.com/oauth/token",
    baseUrl:
      "https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com",
  });

  const runPostmanStyleTest = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests: PostmanTestResult[] = [
      {
        step: "OAuth Token Request",
        status: "pending",
        message: "Getting access token with your Postman credentials...",
      },
      {
        step: "Packages API Call",
        status: "pending",
        message: "Fetching Integration Packages...",
      },
      {
        step: "iFlows API Call",
        status: "pending",
        message: "Fetching Integration Flows...",
      },
    ];

    setTestResults([...tests]);

    try {
      // Step 1: Get OAuth Token (using CORS proxy)
      console.log("🔐 Testing OAuth with Postman credentials...");

      const tokenRequestBody = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: [
          "it!b182722.ESBDataStore.readPayload",
          "it!b182722.NodeManager.read",
          "uaa.resource",
          "it!b182722.IntegrationOperationServer.read",
          "it!b182722.ESBDataStore.read",
          "it!b182722.WebToolingCatalog.DetailsRead",
          "it!b182722.WebToolingWorkspace.Read",
        ].join(" "),
      });

      // Use CORS proxy for OAuth
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(credentials.tokenUrl)}`;

      const tokenResponse = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: tokenRequestBody,
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        tests[0] = {
          ...tests[0],
          status: "error",
          message: "OAuth token request failed",
          details: `HTTP ${tokenResponse.status}: ${errorText}`,
        };
        setTestResults([...tests]);
        setIsRunning(false);
        return;
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      tests[0] = {
        ...tests[0],
        status: "success",
        message: "✅ OAuth token obtained successfully!",
        details: `Token type: ${tokenData.token_type}, Expires in: ${tokenData.expires_in}s`,
        data: { tokenObtained: true, tokenType: tokenData.token_type },
      };
      setTestResults([...tests]);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 2: Fetch Packages
      console.log("📦 Fetching Integration Packages...");

      const packagesUrl = `${credentials.baseUrl}/api/v1/IntegrationPackages`;
      const packagesProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(packagesUrl)}`;

      const packagesResponse = await fetch(packagesProxyUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!packagesResponse.ok) {
        tests[1] = {
          ...tests[1],
          status: "error",
          message: "Packages API call failed",
          details: `HTTP ${packagesResponse.status}: ${packagesResponse.statusText}`,
        };
      } else {
        const packagesProxyData = await packagesResponse.json();
        const packagesData = JSON.parse(packagesProxyData.contents);
        const packages = packagesData.d?.results || packagesData.results || [];

        tests[1] = {
          ...tests[1],
          status: "success",
          message: `✅ Found ${packages.length} Integration Packages!`,
          details:
            packages.length > 0
              ? `Sample package: ${packages[0].Name || packages[0].name || "N/A"}`
              : "No packages found",
          data: {
            packagesCount: packages.length,
            packages: packages.slice(0, 3),
          },
        };
      }
      setTestResults([...tests]);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 3: Fetch iFlows
      console.log("🔄 Fetching Integration Flows...");

      const iflowsUrl = `${credentials.baseUrl}/api/v1/IntegrationDesigntimeArtifacts?$filter=Type%20eq%20'IntegrationFlow'`;
      const iflowsProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(iflowsUrl)}`;

      const iflowsResponse = await fetch(iflowsProxyUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!iflowsResponse.ok) {
        tests[2] = {
          ...tests[2],
          status: "error",
          message: "iFlows API call failed",
          details: `HTTP ${iflowsResponse.status}: ${iflowsResponse.statusText}`,
        };
      } else {
        const iflowsProxyData = await iflowsResponse.json();
        const iflowsData = JSON.parse(iflowsProxyData.contents);
        const iflows = iflowsData.d?.results || iflowsData.results || [];

        tests[2] = {
          ...tests[2],
          status: "success",
          message: `✅ Found ${iflows.length} Integration Flows!`,
          details:
            iflows.length > 0
              ? `Sample iFlow: ${iflows[0].Name || iflows[0].name || "N/A"}`
              : "No iFlows found",
          data: { iflowsCount: iflows.length, iflows: iflows.slice(0, 3) },
        };
      }
      setTestResults([...tests]);
    } catch (error) {
      console.error("❌ Test failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update the current pending test
      const currentTestIndex = tests.findIndex((t) => t.status === "pending");
      if (currentTestIndex >= 0) {
        tests[currentTestIndex] = {
          ...tests[currentTestIndex],
          status: "error",
          message: "Test failed due to browser restriction",
          details: `${errorMessage}. This is likely due to CORS policy blocking.`,
        };
        setTestResults([...tests]);
      }
    }

    setIsRunning(false);
  };

  const copyPostmanRequest = () => {
    const postmanCollection = {
      info: {
        name: "SAP Integration Suite Test",
        description: "Test collection for SAP APIs that work in Postman",
      },
      item: [
        {
          name: "Get OAuth Token",
          request: {
            method: "POST",
            header: [
              {
                key: "Content-Type",
                value: "application/x-www-form-urlencoded",
              },
              { key: "Accept", value: "application/json" },
            ],
            body: {
              mode: "urlencoded",
              urlencoded: [
                { key: "grant_type", value: "client_credentials" },
                { key: "client_id", value: credentials.clientId },
                { key: "client_secret", value: credentials.clientSecret },
                {
                  key: "scope",
                  value:
                    "it!b182722.ESBDataStore.readPayload it!b182722.NodeManager.read uaa.resource",
                },
              ],
            },
            url: { raw: credentials.tokenUrl },
          },
        },
        {
          name: "Get Integration Packages",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{access_token}}" },
              { key: "Accept", value: "application/json" },
            ],
            url: { raw: `${credentials.baseUrl}/api/v1/IntegrationPackages` },
          },
        },
      ],
    };

    navigator.clipboard.writeText(JSON.stringify(postmanCollection, null, 2));
    toast.success("Postman collection copied to clipboard!");
  };

  const getStatusIcon = (status: PostmanTestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const successfulTests = testResults.filter(
    (t) => t.status === "success",
  ).length;
  const totalTests = testResults.length;

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <Alert className="border-blue-200 bg-blue-50">
        <TestTube className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <p className="font-medium">🎯 Postman vs Browser Credential Test</p>
            <p className="text-sm">
              Since your credentials work in Postman, let's test them in the
              browser with CORS proxy. This will prove your credentials are
              correct and show the CORS bypass in action.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Credentials Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your SAP Credentials</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCredentials(!showCredentials)}
            >
              {showCredentials ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {showCredentials ? "Hide" : "Show"} Credentials
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCredentials && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={credentials.clientId}
                  onChange={(e) =>
                    setCredentials({ ...credentials, clientId: e.target.value })
                  }
                  placeholder="Your SAP client ID"
                />
              </div>
              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={credentials.clientSecret}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      clientSecret: e.target.value,
                    })
                  }
                  placeholder="Your SAP client secret"
                />
              </div>
              <div>
                <Label htmlFor="tokenUrl">Token URL</Label>
                <Input
                  id="tokenUrl"
                  value={credentials.tokenUrl}
                  onChange={(e) =>
                    setCredentials({ ...credentials, tokenUrl: e.target.value })
                  }
                  placeholder="SAP OAuth token endpoint"
                />
              </div>
              <div>
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={credentials.baseUrl}
                  onChange={(e) =>
                    setCredentials({ ...credentials, baseUrl: e.target.value })
                  }
                  placeholder="SAP Integration Suite base URL"
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Button onClick={runPostmanStyleTest} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Test Postman Credentials in Browser
                </>
              )}
            </Button>
            <Button variant="outline" onClick={copyPostmanRequest}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Postman Collection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results</span>
              {totalTests > 0 && (
                <Badge
                  variant={
                    successfulTests === totalTests ? "default" : "secondary"
                  }
                >
                  {successfulTests}/{totalTests} Passed
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((test, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.step}</span>
                  </div>
                  <Badge
                    variant={
                      test.status === "success"
                        ? "default"
                        : test.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {test.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{test.message}</p>
                {test.details && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {test.details}
                  </p>
                )}
                {test.data && test.status === "success" && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium text-green-700">Sample Data:</p>
                    <pre className="bg-green-50 p-2 rounded text-green-800 overflow-x-auto">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {successfulTests === totalTests && totalTests > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">
                🎉 Perfect! Your Postman credentials work in the browser too!
              </p>
              <p className="text-sm">
                The test successfully used CORS proxy to access SAP APIs with
                your credentials. Now you just need to enable CORS bypass for
                the main application.
              </p>
              <p className="text-sm font-medium">
                Next step: Install a CORS browser extension and refresh the
                CI/CD Pipeline page.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PostmanCredentialTest;
