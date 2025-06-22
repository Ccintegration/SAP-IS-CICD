import React, { useState } from "react";
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
  Code,
  Play,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

const APIDebugger: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  // SAP Integration Suite API Endpoints Documentation
  const apiEndpoints = [
    {
      name: "OAuth Token",
      method: "POST",
      url: "https://ccci-integration-suite-fuom1yo5.authentication.eu10.hana.ondemand.com/oauth/token",
      description: "Get OAuth access token for API authentication",
      body: `grant_type=client_credentials&client_id=sb-4d88ec4d-cf00-4e40-b9a3-bf20640f4941!b236015|it!b182722&client_secret=YOUR_SECRET&scope=it!b182722.ESBDataStore.readPayload it!b182722.NodeManager.read uaa.resource`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
    },
    {
      name: "Integration Packages",
      method: "GET",
      url: "https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com/api/v1/IntegrationPackages",
      description: "Fetch all integration packages",
      headers: {
        Authorization: "Bearer YOUR_ACCESS_TOKEN",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
    {
      name: "Integration Flows (Design-time)",
      method: "GET",
      url: "https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com/api/v1/IntegrationDesigntimeArtifacts?$filter=Type%20eq%20'IntegrationFlow'",
      description: "Fetch all integration flows from design-time",
      headers: {
        Authorization: "Bearer YOUR_ACCESS_TOKEN",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
    {
      name: "Integration Flows (Runtime)",
      method: "GET",
      url: "https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com/api/v1/IntegrationRuntimeArtifacts",
      description: "Fetch runtime status of deployed integration flows",
      headers: {
        Authorization: "Bearer YOUR_ACCESS_TOKEN",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
    {
      name: "Package Content",
      method: "GET",
      url: "https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com/api/v1/IntegrationPackages('PACKAGE_ID')/IntegrationDesigntimeArtifacts",
      description: "Get all artifacts within a specific package",
      headers: {
        Authorization: "Bearer YOUR_ACCESS_TOKEN",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  ];

  const testOAuth = async () => {
    const log = `🔐 Testing OAuth Token Request...\n`;
    setLogs((prev) => [...prev, log]);

    // Use the correct SAP Integration Suite scopes
    const sapScopes = [
      "it!b182722.ESBDataStore.readPayload",
      "it!b182722.NodeManager.read",
      "uaa.resource",
      "it!b182722.IntegrationOperationServer.read",
      "it!b182722.ESBDataStore.read",
      "it!b182722.WebToolingCatalog.DetailsRead",
      "it!b182722.WebToolingCatalog.OverviewRead",
      "it!b182722.WebToolingWorkspace.Read",
    ].join(" ");

    const scopeLog = `🔑 Using SAP scopes: ${sapScopes}\n`;
    setLogs((prev) => [...prev, scopeLog]);

    try {
      const response = await fetch(
        "https://ccci-integration-suite-fuom1yo5.authentication.eu10.hana.ondemand.com/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id:
              "sb-4d88ec4d-cf00-4e40-b9a3-bf20640f4941!b236015|it!b182722",
            client_secret:
              "68998671-12de-4a2c-ab02-8968d571b4cd$1hejXEfNv1qrX8raaVfuD_x-6PtP1xub7uRFmr55gaI=",
            scope: sapScopes,
          }),
        },
      );

      const resultLog = `📡 OAuth Response: ${response.status} ${response.statusText}\n`;
      setLogs((prev) => [...prev, resultLog]);

      // Read response body once
      const responseText = await response.text();
      const bodyLog = `📋 Response Body: ${responseText}\n`;
      setLogs((prev) => [...prev, bodyLog]);

      if (response.ok) {
        const data = JSON.parse(responseText);
        const successLog = `🎉 Token obtained! Expires in: ${data.expires_in} seconds\n`;
        setLogs((prev) => [...prev, successLog]);
      } else {
        const errorLog = `❌ OAuth Error: ${responseText}\n`;
        setLogs((prev) => [...prev, errorLog]);

        // Try to parse error and show available scopes
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.scope) {
            const availableScopesLog = `💡 Available scopes: ${errorData.scope}\n`;
            setLogs((prev) => [...prev, availableScopesLog]);
          }
        } catch (parseError) {
          // Response is not JSON
        }
      }
    } catch (error) {
      const errorLog = `❌ Network Error: ${error}\n`;
      setLogs((prev) => [...prev, errorLog]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <Card className="mt-4 border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Code className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-lg text-purple-800">
            SAP API Debugger
          </CardTitle>
        </div>
        <CardDescription className="text-purple-700">
          Debug and test SAP Integration Suite API calls for CCCI_SANDBOX
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="endpoints">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
            <TabsTrigger value="test">Test APIs</TabsTrigger>
            <TabsTrigger value="logs">Debug Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                These are the exact SAP Integration Suite API endpoints being
                used to fetch data from your CCCI_SANDBOX tenant.
              </AlertDescription>
            </Alert>

            {apiEndpoints.map((endpoint, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            endpoint.method === "GET" ? "default" : "secondary"
                          }
                          className={
                            endpoint.method === "GET"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {endpoint.method}
                        </Badge>
                        <h4 className="font-medium">{endpoint.name}</h4>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(endpoint.url)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy URL
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={endpoint.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Open
                          </a>
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">
                      {endpoint.description}
                    </p>

                    <div className="bg-gray-100 p-3 rounded text-xs font-mono break-all">
                      {endpoint.url}
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2">Headers:</h5>
                      <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
                        {Object.entries(endpoint.headers).map(
                          ([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span>{" "}
                              {value}
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    {endpoint.body && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Body:</h5>
                        <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                          {endpoint.body}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50">
              <Info className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Test the OAuth authentication with your CCCI_SANDBOX
                credentials. This will verify if the API connection works.
              </AlertDescription>
            </Alert>

            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <h4 className="font-medium">OAuth Token Test</h4>
                  <p className="text-sm text-gray-600">
                    Test OAuth authentication with your CCCI_SANDBOX credentials
                  </p>
                  <Button onClick={testOAuth} className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Test OAuth Authentication
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Manual API Testing</h4>
                  <p className="text-sm text-gray-600">
                    You can also test these APIs manually using tools like
                    Postman or curl:
                  </p>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                    curl -X POST \<br />
                    'https://ccci-integration-suite-fuom1yo5.authentication.eu10.hana.ondemand.com/oauth/token'
                    \<br />
                    -H 'Content-Type: application/x-www-form-urlencoded' \<br />
                    -d
                    'grant_type=client_credentials&client_id=sb-4d88ec4d-cf00-4e40-b9a3-bf20640f4941!b236015|it!b182722&client_secret=YOUR_SECRET'
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">API Debug Logs</h4>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Clear Logs
              </Button>
            </div>

            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-gray-500">
                      No logs yet. Click "Test OAuth Authentication" to see API
                      call logs.
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Check your browser's Network tab (F12 → Network) to see the
                actual API requests and responses in real-time.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default APIDebugger;
