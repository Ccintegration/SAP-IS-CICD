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
import { Button } from "@/components/ui/button";
import {
  Shield,
  Globe,
  Server,
  Chrome,
  Monitor,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  Settings,
  Zap,
} from "lucide-react";
import CORSTest from "./CORSTest";
import PostmanCredentialTest from "./PostmanCredentialTest";
import BackendProxyDemo from "./BackendProxyDemo";

const CORSSolutionGuide: React.FC = () => {
  const solutions = [
    {
      title: "Backend Proxy Server",
      description: "Best for production environments",
      icon: <Server className="w-5 h-5" />,
      difficulty: "Medium",
      recommended: true,
      steps: [
        "Create a backend service (Node.js, Python, etc.)",
        "Route SAP API calls through your backend",
        "Handle authentication server-side",
        "Return data to your frontend application",
      ],
      pros: ["Secure", "Production-ready", "Full control"],
      cons: ["Requires backend development", "Additional infrastructure"],
    },
    {
      title: "SAP BTP Connectivity",
      description: "Use SAP's built-in connectivity features",
      icon: <Globe className="w-5 h-5" />,
      difficulty: "Advanced",
      recommended: true,
      steps: [
        "Deploy your app to SAP BTP Cloud Foundry",
        "Configure destination service",
        "Use SAP's connectivity libraries",
        "Leverage built-in proxy capabilities",
      ],
      pros: ["Native SAP solution", "Enterprise-grade", "Built-in security"],
      cons: ["Requires SAP BTP subscription", "Complex setup"],
    },
    {
      title: "CORS Browser Extension",
      description: "Quick testing solution (development only)",
      icon: <Chrome className="w-5 h-5" />,
      difficulty: "Easy",
      recommended: false,
      steps: [
        "Install a CORS extension for your browser",
        "Enable the extension",
        "Refresh your application",
        "Test SAP API connectivity",
      ],
      pros: ["Quick setup", "Good for testing"],
      cons: ["Security risk", "Development only", "Not for production"],
      extensions: [
        {
          browser: "Chrome",
          name: "CORS Unblock",
          url: "https://chromewebstore.google.com/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino",
        },
        {
          browser: "Firefox",
          name: "CORS Everywhere",
          url: "https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Alert */}
      <Alert className="border-amber-200 bg-amber-50">
        <Shield className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="space-y-2">
            <p className="font-medium">
              🛡️ Browser Security Restriction Detected
            </p>
            <p className="text-sm">
              Modern browsers block direct API calls to external services like
              SAP Integration Suite due to CORS (Cross-Origin Resource Sharing)
              policies. This is normal security behavior and affects all web
              applications.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* What is CORS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span>What is CORS?</span>
          </CardTitle>
          <CardDescription>
            Understanding the technical background
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>CORS (Cross-Origin Resource Sharing)</strong> is a
              security feature implemented by web browsers that restricts web
              pages from making requests to a different domain, protocol, or
              port than the one serving the web page.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-700 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Why CORS exists
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Prevents malicious websites from accessing your data</li>
                <li>• Protects against cross-site scripting attacks</li>
                <li>• Ensures user security and privacy</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-700 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Impact on applications
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Direct API calls from browser are blocked</li>
                <li>• Requires server-side proxy or special setup</li>
                <li>• Development vs production considerations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solutions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-green-600" />
            <span>Available Solutions</span>
          </CardTitle>
          <CardDescription>
            Choose the best approach for your use case
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                solution.recommended
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      solution.recommended
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {solution.icon}
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center space-x-2">
                      <span>{solution.title}</span>
                      {solution.recommended && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          Recommended
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {solution.description}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    solution.difficulty === "Easy"
                      ? "default"
                      : solution.difficulty === "Medium"
                        ? "secondary"
                        : "destructive"
                  }
                  className={
                    solution.difficulty === "Easy"
                      ? "bg-green-100 text-green-800"
                      : solution.difficulty === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {solution.difficulty}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Steps:</h4>
                  <ol className="text-xs space-y-1">
                    {solution.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex">
                        <span className="mr-2">{stepIndex + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2 text-green-700">
                    Pros:
                  </h4>
                  <ul className="text-xs space-y-1">
                    {solution.pros.map((pro, proIndex) => (
                      <li key={proIndex} className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2 text-red-700">
                    Cons:
                  </h4>
                  <ul className="text-xs space-y-1">
                    {solution.cons.map((con, conIndex) => (
                      <li key={conIndex} className="flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1 text-red-600" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {solution.extensions && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">
                    CORS Extensions (Development Only):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {solution.extensions.map((ext, extIndex) => (
                      <Button
                        key={extIndex}
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(ext.url, "_blank")}
                        className="text-xs"
                      >
                        {ext.browser === "Chrome" ? (
                          <Chrome className="w-3 h-3 mr-1" />
                        ) : (
                          <Zap className="w-3 h-3 mr-1" />
                        )}
                        {ext.name}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Warning: Only use CORS extensions for development and
                    testing. Never use them in production environments.
                  </p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Postman Credential Test */}
      <PostmanCredentialTest />

      {/* Backend Proxy Demo */}
      <BackendProxyDemo />

      {/* CORS Test Component */}
      <CORSTest />

      {/* Next Steps */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Monitor className="w-5 h-5" />
            <span>Next Steps</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Test Your Connectivity</p>
                <p className="text-sm">
                  Run the connectivity test above to check your current browser
                  and network setup capabilities.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">For Development & Testing</p>
                <p className="text-sm">
                  Install a CORS browser extension to quickly test the SAP API
                  integration functionality.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">For Production Deployment</p>
                <p className="text-sm">
                  Implement a backend proxy server or deploy to SAP BTP with
                  proper connectivity configuration.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Verify Your Implementation</p>
                <p className="text-sm">
                  Once you've implemented a solution, return to the CI/CD
                  Pipeline page to test the real SAP API connectivity.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CORSSolutionGuide;
