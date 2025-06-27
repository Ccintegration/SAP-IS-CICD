import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GitBranch,
  Package,
  FileCode,
  Database,
  Link,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Layers,
  Cpu,
  Globe,
  Code,
  FileText,
  Server,
  Network,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ResourceDependency {
  Name: string;
  ResourceType: string;
  Description?: string;
  Size?: number;
  LastModified?: string;
}

interface DependencyAnalysis {
  value_mappings: ResourceDependency[];
  groovy_scripts: ResourceDependency[];
  message_mappings: ResourceDependency[];
  external_services: ResourceDependency[];
  process_direct: ResourceDependency[];
  other: ResourceDependency[];
}

interface IFlowDependencies {
  iflowId: string;
  iflowName: string;
  version: string;
  resources: DependencyAnalysis;
  totalResources: number;
  criticalDependencies: number;
  riskLevel: "low" | "medium" | "high";
}

interface Stage5Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage5Dependencies: React.FC<Stage5Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [dependencyResults, setDependencyResults] = useState<
    IFlowDependencies[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  useEffect(() => {
    loadDependencies();
  }, [data.selectedIFlows]);

  const loadDependencies = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!data.selectedIFlows || data.selectedIFlows.length === 0) {
        setError(
          "No integration flows selected. Please go back and select iFlows.",
        );
        setLoading(false);
        return;
      }

      const dependencyPromises = data.selectedIFlows.map(
        async (iflowId: string) => {
          try {
            // Robustly find the iflow details from previous stage data
            let iflowDetails = data.iflowDetails?.find(
              (iflow: any) => iflow.id === iflowId || iflow.iflowId === iflowId,
            );
            if (!iflowDetails) {
              console.warn(
                `[Dependencies] No details found for iFlow ${iflowId} in iflowDetails. Defaulting version to '1.0.0'.`,
              );
              iflowDetails = { id: iflowId, name: `iFlow ${iflowId}`, version: "1.0.0" };
            } else if (!iflowDetails.version) {
              console.warn(
                `[Dependencies] No version found for iFlow ${iflowId}. Defaulting version to '1.0.0'.`,
              );
              iflowDetails.version = "1.0.0";
            }

            console.log(
              `🔗 [Dependencies] Fetching resources for ${iflowId} from: http://localhost:8000/api/sap/iflows/${iflowId}/resources?version=${iflowDetails.version}`,
            );

            const response = await fetch(
              `http://localhost:8000/api/sap/iflows/${iflowId}/resources?version=${iflowDetails.version}`,
            );

            if (!response.ok) {
              const responseText = await response.text();
              console.error(
                `❌ [Dependencies] Failed to fetch resources for ${iflowId}:`,
                {
                  status: response.status,
                  statusText: response.statusText,
                  responseText: responseText.substring(0, 500), // First 500 chars for debugging
                },
              );
              throw new Error(
                `Failed to fetch resources for ${iflowId}: ${response.status} ${response.statusText}`,
              );
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              const responseText = await response.text();
              console.error(
                `❌ [Dependencies] Expected JSON but got ${contentType} for ${iflowId}:`,
                responseText.substring(0, 500),
              );
              throw new Error(
                `Invalid response format for ${iflowId}: expected JSON but got ${contentType}`,
              );
            }

            const result = await response.json();
            const resources: DependencyAnalysis = result.data;

            // Calculate total resources and critical dependencies
            const totalResources = Object.values(resources).reduce(
              (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
              0,
            );

            const criticalDependencies =
              resources.external_services.length +
              resources.process_direct.length +
              resources.value_mappings.length;

            // Determine risk level
            let riskLevel: "low" | "medium" | "high" = "low";
            if (criticalDependencies > 5) riskLevel = "high";
            else if (criticalDependencies > 2) riskLevel = "medium";

            let iflowName = iflowDetails.iflowName || iflowDetails.name || `iFlow ${iflowId}`;

            return {
              iflowId,
              iflowName,
              version: iflowDetails.version,
              resources,
              totalResources,
              criticalDependencies,
              riskLevel,
            };
          } catch (error) {
            console.error(
              `❌ [Dependencies] Failed to load dependencies for ${iflowId}:`,
              error,
            );

            // Check if this is the HTML response error
            if (error instanceof Error && error.message.includes("<!doctype")) {
              console.error(
                `🚨 [Dependencies] HTML response detected for ${iflowId} - likely API endpoint not found or backend not running`,
              );
            }

            return {
              iflowId,
              iflowName: `iFlow ${iflowId}`,
              version: "1.0.0",
              resources: {
                value_mappings: [],
                groovy_scripts: [],
                message_mappings: [],
                external_services: [],
                process_direct: [],
                other: [],
              },
              totalResources: 0,
              criticalDependencies: 0,
              riskLevel: "low" as const,
            };
          }
        },
      );

      const results = await Promise.all(dependencyPromises);
      setDependencyResults(results);
    } catch (error) {
      console.error("Failed to load dependencies:", error);
      setError("Failed to load dependency analysis");
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "value_mappings":
        return <Database className="w-4 h-4 text-blue-500" />;
      case "groovy_scripts":
        return <Code className="w-4 h-4 text-green-500" />;
      case "message_mappings":
        return <FileText className="w-4 h-4 text-purple-500" />;
      case "external_services":
        return <Globe className="w-4 h-4 text-orange-500" />;
      case "process_direct":
        return <Network className="w-4 h-4 text-red-500" />;
      default:
        return <FileCode className="w-4 h-4 text-gray-500" />;
    }
  };

  const getResourceTitle = (type: string) => {
    switch (type) {
      case "value_mappings":
        return "Value Mappings";
      case "groovy_scripts":
        return "Groovy Scripts";
      case "message_mappings":
        return "Message Mappings";
      case "external_services":
        return "External Services";
      case "process_direct":
        return "Process Direct";
      default:
        return "Other Resources";
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getTotalResources = () => {
    return dependencyResults.reduce(
      (sum, result) => sum + result.totalResources,
      0,
    );
  };

  const getTotalCriticalDependencies = () => {
    return dependencyResults.reduce(
      (sum, result) => sum + result.criticalDependencies,
      0,
    );
  };

  const getHighRiskIFlows = () => {
    return dependencyResults.filter((result) => result.riskLevel === "high");
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mr-3" />
          <span className="text-lg">Analyzing dependencies...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="flex items-center justify-center p-8">
          <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
          <div>
            <p className="text-lg font-medium text-red-800">{error}</p>
            <Button onClick={loadDependencies} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highRiskIFlows = getHighRiskIFlows();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-red-50">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <GitBranch className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-orange-800 text-left">
                Dependencies Analysis
              </CardTitle>
              <p className="text-orange-600 mt-1">
                Analyze resources, dependencies, and external services used by
                your integration flows.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Layers className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Resources</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getTotalResources()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Critical Dependencies</p>
                <p className="text-2xl font-bold text-orange-600">
                  {getTotalCriticalDependencies()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Low Risk iFlows</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    dependencyResults.filter((r) => r.riskLevel === "low")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">High Risk iFlows</p>
                <p className="text-2xl font-bold text-red-600">
                  {highRiskIFlows.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Alert */}
      {highRiskIFlows.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">
            High Dependency Risk Detected
          </AlertTitle>
          <AlertDescription className="text-red-700">
            {highRiskIFlows.length} integration flow(s) have high dependency
            risk due to multiple external dependencies. Please review these
            carefully before deployment.
            <div className="mt-2">
              <strong>High-risk iFlows:</strong>{" "}
              {highRiskIFlows.map((iflow) => iflow.iflowName).join(", ")}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Dependency Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Dependencies (Tabular View)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border-b text-left">Package Name</th>
                  <th className="px-4 py-2 border-b text-left">iFlow Name</th>
                  <th className="px-4 py-2 border-b text-left">Version</th>
                  <th className="px-4 py-2 border-b text-left">Dependencies</th>
                </tr>
              </thead>
              <tbody>
                {dependencyResults.map((result) => {
                  // Gather all dependencies/resources
                  const allDeps = [
                    ...result.resources.value_mappings,
                    ...result.resources.groovy_scripts,
                    ...result.resources.message_mappings,
                    ...result.resources.external_services,
                    ...result.resources.process_direct,
                    ...result.resources.other,
                  ];
                  const depList = allDeps.length > 0
                    ? allDeps.map((dep) => dep.Name).join(", ")
                    : "No Resources Found";
                  // Try to get package name from iflowDetails if available
                  let packageName = "";
                  if (data.iflowDetails) {
                    const found = data.iflowDetails.find((i: any) => i.iflowId === result.iflowId || i.id === result.iflowId);
                    packageName = found?.packageName || found?.packageId || "";
                  }
                  return (
                    <tr key={result.iflowId} className="border-b">
                      <td className="px-4 py-2 align-top text-left">{packageName}</td>
                      <td className="px-4 py-2 align-top text-left">{result.iflowName}</td>
                      <td className="px-4 py-2 align-top">{result.version}</td>
                      <td className="px-4 py-2 align-top text-left">
                        {allDeps.length > 0
                          ? allDeps.map((dep, idx) => <div key={idx}>{dep.Name}</div>)
                          : <div>No Resources Found</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dependencies Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Dependencies Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Dependency Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total iFlows:</span>
                    <span className="font-medium">
                      {dependencyResults.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Resources:</span>
                    <span className="font-medium">{getTotalResources()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Critical Dependencies:</span>
                    <span className="font-medium text-orange-600">
                      {getTotalCriticalDependencies()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Risk Assessment</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low Risk:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {
                        dependencyResults.filter((r) => r.riskLevel === "low")
                          .length
                      }{" "}
                      iFlows
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Medium Risk:</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {
                        dependencyResults.filter(
                          (r) => r.riskLevel === "medium",
                        ).length
                      }{" "}
                      iFlows
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High Risk:</span>
                    <Badge className="bg-red-100 text-red-800">
                      {highRiskIFlows.length} iFlows
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {highRiskIFlows.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">
                  Deployment Considerations
                </AlertTitle>
                <AlertDescription className="text-yellow-700">
                  <p className="mb-2">
                    High-risk iFlows require careful attention during
                    deployment:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Ensure all external services are accessible</li>
                    <li>
                      Verify value mappings are deployed to target environment
                    </li>
                    <li>Check process direct connections are available</li>
                    <li>Validate groovy scripts compatibility</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          onClick={onPrevious}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous: Design Validation</span>
        </Button>

        <div className="flex space-x-4">
          <Button
            onClick={loadDependencies}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Analysis</span>
          </Button>

          <Button
            onClick={() => {
              setShowWarningDialog(true);
            }}
            className="flex items-center space-x-2"
          >
            <span>Next: Upload Artifacts</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <span>Deployment Warning</span>
            </DialogTitle>
            <DialogDescription className="text-left">
              Before going for Deployments, Make sure that All dependencies related to iFlow such as External, Internal APIs, Process Calls, Shared Objects like Security Materials, Script Collections, Certificates, etc pre-requisites are taken care. Are you sure to go for Deployment?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWarningDialog(false)}
            >
              No
            </Button>
            <Button
              onClick={() => {
                setShowWarningDialog(false);
                onComplete({
                  dependencies: {
                    results: dependencyResults,
                    totalResources: getTotalResources(),
                    criticalDependencies: getTotalCriticalDependencies(),
                    highRiskIFlows: highRiskIFlows.map((iflow) => ({
                      id: iflow.iflowId,
                      name: iflow.iflowName,
                      risk: iflow.riskLevel,
                      criticalCount: iflow.criticalDependencies,
                    })),
                  },
                });
                onNext();
              }}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stage5Dependencies;
