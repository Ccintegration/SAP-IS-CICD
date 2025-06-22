import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  Globe,
  Shield,
  Server,
  Code,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

const CORSInfo: React.FC = () => {
  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-800">
            CORS & Production API Integration
          </CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          Understanding browser security limitations and production solutions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-medium">What's happening:</p>
              <p className="text-sm">
                The "Failed to fetch" error occurs because browsers block
                cross-origin requests to protect user security. Since we're
                calling SAP APIs from a different domain, the browser applies
                CORS (Cross-Origin Resource Sharing) restrictions.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-800">
                  Frontend Limitation
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-red-700">
                  Direct API calls from browser to SAP Integration Suite are
                  blocked by CORS policy.
                </p>
                <div className="bg-red-100 p-2 rounded text-xs font-mono">
                  Browser → SAP APIs = ❌ CORS Error
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Server className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800">
                  Production Solution
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-green-700">
                  Use a backend proxy/API gateway to handle SAP Integration
                  Suite calls.
                </p>
                <div className="bg-green-100 p-2 rounded text-xs font-mono">
                  Browser → Backend → SAP APIs = ✅ Works
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-orange-800">
            Production Implementation Options:
          </h4>

          <div className="grid gap-3">
            <div className="flex items-start space-x-3 p-3 bg-white rounded border">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-700">1</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Backend Proxy API</h5>
                <p className="text-sm text-gray-600">
                  Create Node.js/Python/Java backend that proxies requests to
                  SAP Integration Suite
                </p>
                <Badge variant="outline" className="mt-1 text-xs">
                  Recommended
                </Badge>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-white rounded border">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-700">2</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">
                  SAP Cloud Application Programming Model
                </h5>
                <p className="text-sm text-gray-600">
                  Use SAP CAP with built-in SAP Integration Suite connectivity
                </p>
                <Badge variant="outline" className="mt-1 text-xs">
                  SAP Native
                </Badge>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-white rounded border">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-700">3</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">API Gateway</h5>
                <p className="text-sm text-gray-600">
                  Use cloud API gateway (AWS API Gateway, Azure API Management)
                  as proxy
                </p>
                <Badge variant="outline" className="mt-1 text-xs">
                  Cloud Native
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">Current Demo Mode:</p>
              <p className="text-sm">
                The system is now showing simulated data that represents what
                your CCCI_SANDBOX would contain. This demonstrates the full UI
                and workflow without CORS limitations.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* <div className="bg-gray-100 p-3 rounded">
          <h5 className="font-medium text-gray-900 mb-2">
            Example Backend Implementation:
          </h5>
          <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono">
            {`// Node.js Express example
app.get('/api/sap/packages', async (req, res) => {
  const token = await getSAPToken();
  const response = await fetch(
    'https://your-tenant.hana.ondemand.com/api/v1/IntegrationPackages',
    { headers: { Authorization: \`Bearer \${token}\` } }
  );
  res.json(await response.json());
});`}
          </div>
        </div> */}

        <div className="flex items-center space-x-2 text-sm text-orange-700">
          <ExternalLink className="w-4 h-4" />
          <span>
            For production deployment, implement one of the backend solutions
            above
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CORSInfo;
