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
  Zap,
  Server,
  CheckCircle,
  AlertTriangle,
  Info,
  Globe,
  Shield,
} from "lucide-react";

const RealSAPConnectivity: React.FC = () => {
  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-800">
              Real SAP API Connectivity
            </CardTitle>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Server className="w-3 h-3 mr-1" />
            Live Connection
          </Badge>
        </div>
        <CardDescription className="text-blue-700">
          Direct connection to CCCI_SANDBOX SAP Integration Suite APIs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">✅ Real API Mode Active:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Direct OAuth authentication with CCCI_SANDBOX</li>
                <li>• Live API calls to SAP Integration Suite</li>
                <li>• Real package and iFlow data retrieval</li>
                <li>• Multiple CORS bypass strategies implemented</li>
                <li>• Automatic failover between connection methods</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-green-200">
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-green-800">OAuth</h4>
              <p className="text-xs text-green-600 mt-1">
                Real SAP authentication
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-blue-200">
            <CardContent className="p-4 text-center">
              <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-blue-800">CORS Bypass</h4>
              <p className="text-xs text-blue-600 mt-1">Multiple strategies</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200">
            <CardContent className="p-4 text-center">
              <Server className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-purple-800">Live Data</h4>
              <p className="text-xs text-purple-600 mt-1">Direct from SAP IS</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-3">
            Connection Strategies (Auto-failover):
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Strategy 1:</span>
              <span className="text-gray-600">
                CORS Proxy Service (allorigins.win)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Strategy 2:</span>
              <span className="text-gray-600">
                Direct API with Custom Headers
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="font-medium">Strategy 3:</span>
              <span className="text-gray-600">
                Browser Extension CORS Bypass
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-100 p-3 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">
            Current API Endpoints:
          </h5>
          <div className="space-y-1 text-xs font-mono text-blue-800">
            <div>
              🔐 OAuth:
              https://ccci-integration-suite-fuom1yo5.authentication.eu10.hana.ondemand.com/oauth/token
            </div>
            <div>
              📦 Packages:
              https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com/api/v1/IntegrationPackages
            </div>
            <div>
              🔄 iFlows:
              https://ccci-integration-suite-fuom1yo5.it-cpi024.cfapps.eu10-002.hana.ondemand.com/api/v1/IntegrationDesigntimeArtifacts
            </div>
          </div>
        </div>

        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <p className="font-medium">Browser CORS Limitations:</p>
              <p className="text-sm">If API calls fail due to CORS, you can:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>
                  • Use Chrome with --disable-web-security flag for testing
                </li>
                <li>• Install a CORS browser extension</li>
                <li>• Check browser console for detailed error messages</li>
                <li>
                  • The system will automatically try multiple bypass strategies
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <Alert className="border-green-200 bg-green-50">
          <Info className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <p className="font-medium mb-1">✅ Real Data Expected:</p>
            <p className="text-sm">
              The system will now fetch actual packages and integration flows
              from your CCCI_SANDBOX tenant. Any data you see will be real
              information from your SAP Integration Suite environment.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default RealSAPConnectivity;
