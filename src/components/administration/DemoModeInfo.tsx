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
  PlayCircle,
  Database,
  CheckCircle,
  Info,
  Sparkles,
  Clock,
} from "lucide-react";

const DemoModeInfo: React.FC = () => {
  return (
    <Card className="mt-4 border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PlayCircle className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg text-green-800">
              Demo Mode Active
            </CardTitle>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <Sparkles className="w-3 h-3 mr-1" />
            Live Demo
          </Badge>
        </div>
        <CardDescription className="text-green-700">
          CCCI_SANDBOX data simulation is now active - experience the full
          functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-medium">✅ Demo Mode Benefits:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• No CORS errors or network issues</li>
                <li>• Instant data loading and synchronization</li>
                <li>• Full CI/CD Pipeline functionality</li>
                <li>• Realistic CCCI_SANDBOX package and iFlow data</li>
                <li>• Complete workflow testing capabilities</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-blue-200">
            <CardContent className="p-4 text-center">
              <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-blue-800">Simulated Data</h4>
              <p className="text-xs text-blue-600 mt-1">
                CCCI packages & iFlows
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-green-800">Full Functionality</h4>
              <p className="text-xs text-green-600 mt-1">
                All features working
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-purple-800">Instant Response</h4>
              <p className="text-xs text-purple-600 mt-1">No network delays</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-3">
            What You Can Test Now:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">CI/CD Pipeline:</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• View CCCI_SANDBOX packages</li>
                <li>• Monitor integration flows</li>
                <li>• Test sync functionality</li>
                <li>• Execute workflows</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Administration:</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Manage base tenant settings</li>
                <li>• View connection status</li>
                <li>• Test workflow execution</li>
                <li>• Explore all features</li>
              </ul>
            </div>
          </div>
        </div>

        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <p className="font-medium mb-1">Production Deployment:</p>
            <p className="text-sm">
              In production, implement a backend proxy to make real API calls to
              your SAP Integration Suite tenant. The current demo shows exactly
              how the system would work with live data.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default DemoModeInfo;
