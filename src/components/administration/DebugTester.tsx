import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { TenantService } from "@/lib/tenant-service";
import { Bug, CheckCircle, XCircle, Info } from "lucide-react";

const DebugTester: React.FC = () => {
  const [jsonInput, setJsonInput] = useState(`{
  "oauth": {
    "createdate": "2025-02-25T00:29:18.059Z",
    "clientid": "sb-4d88ec4d-cf00-4e40-b9a3-bf20640f4941!b236015|it!b182722",
    "clientsecret": "68998671-12de-4a2c-ab02-8968d571b4cd$1hejXEfNv1qrX8raaVfuD_x-6PtP1xub7uRFmr55gaI=",
    "tokenurl": "https://ccci-integration-suite-fuom1yo5.authentication.eu10.hana.ondemand.com/oauth/token",
    "url": "https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com"
  }
}`);
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runValidationTest = () => {
    try {
      const data = JSON.parse(jsonInput);

      // Run validation
      const validation = TenantService.validateJsonUpload(data);

      // Convert to internal format
      const converted = TenantService.convertSAPOAuthConfigToJsonUpload(data);

      // Test credentials validation
      const credTest = TenantService.validateCredentialsOnly(
        {
          clientId: converted.clientId,
          clientSecret: converted.clientSecret,
          tokenUrl: converted.tokenUrl,
          grantType: converted.grantType || "client_credentials",
        },
        converted.baseUrl,
      );

      setTestResults({
        validation,
        converted,
        credTest,
        rawData: data,
      });
    } catch (err) {
      setTestResults({
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const runConnectionTest = async () => {
    setIsLoading(true);
    try {
      const data = JSON.parse(jsonInput);
      const converted = TenantService.convertSAPOAuthConfigToJsonUpload(data);

      const result = await TenantService.testConnection(
        {
          clientId: converted.clientId,
          clientSecret: converted.clientSecret,
          tokenUrl: converted.tokenUrl,
          grantType: converted.grantType || "client_credentials",
        },
        converted.baseUrl,
      );

      setTestResults((prev) => ({
        ...prev,
        connectionTest: result,
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        connectionError: err instanceof Error ? err.message : "Unknown error",
      }));
    }
    setIsLoading(false);
  };

  const runForceSuccessTest = async () => {
    setIsLoading(true);
    try {
      const data = JSON.parse(jsonInput);
      const converted = TenantService.convertSAPOAuthConfigToJsonUpload(data);

      const result = await TenantService.testConnectionForceSuccess(
        {
          clientId: converted.clientId,
          clientSecret: converted.clientSecret,
          tokenUrl: converted.tokenUrl,
          grantType: converted.grantType || "client_credentials",
        },
        converted.baseUrl,
      );

      setTestResults((prev) => ({
        ...prev,
        forceSuccessTest: result,
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        forceSuccessError: err instanceof Error ? err.message : "Unknown error",
      }));
    }
    setIsLoading(false);
  };

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Bug className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-800">
            Debug OAuth Validation
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            This debug tool helps test OAuth config validation. Remove this
            component in production.
          </AlertDescription>
        </Alert>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Test JSON Input:
          </label>
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex space-x-2">
          <Button onClick={runValidationTest} variant="outline" size="sm">
            Test Validation
          </Button>
          <Button
            onClick={runConnectionTest}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? "Testing..." : "Test Connection"}
          </Button>
          <Button
            onClick={runForceSuccessTest}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            Force Success Test
          </Button>
        </div>

        {testResults && (
          <div className="space-y-4">
            {testResults.error && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  Parse Error: {testResults.error}
                </AlertDescription>
              </Alert>
            )}

            {testResults.validation && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium mb-2">JSON Validation:</h4>
                <div className="flex items-center space-x-2 mb-2">
                  {testResults.validation.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <Badge
                    variant={
                      testResults.validation.isValid ? "default" : "destructive"
                    }
                  >
                    {testResults.validation.isValid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
                {testResults.validation.errors.length > 0 && (
                  <div className="text-xs text-red-600">
                    {testResults.validation.errors.map((error, i) => (
                      <div key={i}>• {error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {testResults.converted && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium mb-2">Converted Data:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResults.converted, null, 2)}
                </pre>
              </div>
            )}

            {testResults.credTest && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium mb-2">Credential Validation:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Overall Valid:</span>
                    <Badge
                      variant={
                        testResults.credTest.isValid ? "default" : "destructive"
                      }
                    >
                      {testResults.credTest.isValid ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>URL Valid:</span>
                    <Badge
                      variant={
                        testResults.credTest.details.urlValid
                          ? "default"
                          : "destructive"
                      }
                    >
                      {testResults.credTest.details.urlValid ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Credentials Valid:</span>
                    <Badge
                      variant={
                        testResults.credTest.details.credentialsValid
                          ? "default"
                          : "destructive"
                      }
                    >
                      {testResults.credTest.details.credentialsValid
                        ? "Yes"
                        : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Token URL Valid:</span>
                    <Badge
                      variant={
                        testResults.credTest.details.tokenUrlValid
                          ? "default"
                          : "destructive"
                      }
                    >
                      {testResults.credTest.details.tokenUrlValid
                        ? "Yes"
                        : "No"}
                    </Badge>
                  </div>
                  {testResults.credTest.details.urlPattern && (
                    <div className="flex justify-between">
                      <span>URL Pattern:</span>
                      <span className="text-xs">
                        {testResults.credTest.details.urlPattern}
                      </span>
                    </div>
                  )}
                  {testResults.credTest.details.clientIdPattern && (
                    <div className="flex justify-between">
                      <span>Client ID Pattern:</span>
                      <span className="text-xs">
                        {testResults.credTest.details.clientIdPattern}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {testResults.connectionTest && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium mb-2">Connection Test Result:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {testResults.connectionTest.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <Badge
                      variant={
                        testResults.connectionTest.success
                          ? "default"
                          : "destructive"
                      }
                    >
                      {testResults.connectionTest.success
                        ? "Success"
                        : "Failed"}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    {testResults.connectionTest.message}
                  </p>
                  {testResults.connectionTest.details && (
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(
                        testResults.connectionTest.details,
                        null,
                        2,
                      )}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {testResults.forceSuccessTest && (
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <h4 className="font-medium mb-2 text-green-800">
                  Force Success Test:
                </h4>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {testResults.forceSuccessTest.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugTester;
