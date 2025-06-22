import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRight,
  Settings,
  Server,
  ExternalLink,
  MapPin,
  ChevronRight,
} from "lucide-react";

const BackendSetupGuide: React.FC = () => {
  const navigateToAdministration = () => {
    window.location.href = "/administration";
  };

  const steps = [
    {
      step: 1,
      title: "Go to Administration",
      description: "Navigate to the Administration tab",
      action: "Click Administration in the navigation menu",
    },
    {
      step: 2,
      title: "Find Backend Configuration",
      description: "Locate the Python Backend Configuration section",
      action: "Look for the purple 'Python Backend Configuration' card",
    },
    {
      step: 3,
      title: "Configure URL",
      description: "Set up your backend URL",
      action: "Click 'URL Config' tab and enter your backend URL",
    },
    {
      step: 4,
      title: "Test Connection",
      description: "Verify the connection works",
      action: "Click 'Test Connection' to verify setup",
    },
  ];

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <MapPin className="w-5 h-5" />
          <span>Backend Setup Location Guide</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-blue-800">
        <Alert className="border-blue-300 bg-blue-100">
          <Settings className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <p className="font-medium mb-1">
              📍 Backend URL Configuration Location
            </p>
            <p className="text-sm">
              The backend URL configuration is located in the{" "}
              <strong>Administration tab</strong> under{" "}
              <strong>"Python Backend Configuration"</strong> section.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Step-by-step guide:</h4>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg"
              >
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-blue-700 mb-1">
                    {step.description}
                  </p>
                  <p className="text-xs text-blue-600">{step.action}</p>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-blue-200">
          <div className="text-sm">
            <p className="font-medium">Quick Navigation:</p>
            <p className="text-xs">
              Click the button to go directly to Administration
            </p>
          </div>
          <Button
            onClick={navigateToAdministration}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Go to Administration
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="bg-white/60 p-3 rounded-lg">
          <p className="text-xs">
            <strong>What you'll configure:</strong> Your Python FastAPI backend
            URL (e.g., <code>http://localhost:8000</code> for local development
            or ngrok URL for cloud access)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackendSetupGuide;
