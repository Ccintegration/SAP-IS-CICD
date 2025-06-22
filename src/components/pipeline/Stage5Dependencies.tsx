import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
            // Find the iflow details from previous stage data
            const iflowDetails = data.iflowDetails?.find(
              (iflow: any) => iflow.id === iflowId,
            ) || { id: iflowId, name: `iFlow ${iflowId}`, version: "1.0.0" };

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

            return {
              iflowId,
              iflowName: iflowDetails.name,
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
              <CardTitle className="text-2xl text-orange-800">
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
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5" />
            <span>iFlow Dependency Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={dependencyResults[0]?.iflowId} className="w-full">
            <TabsList
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${dependencyResults.length}, 1fr)`,
              }}
            >
              {dependencyResults.map((result) => (
                <TabsTrigger
                  key={result.iflowId}
                  value={result.iflowId}
                  className="text-sm flex flex-col items-center p-2"
                >
                  <span className="truncate">{result.iflowName}</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getRiskBadgeColor(result.riskLevel)}>
                      {result.riskLevel}
                    </Badge>
                    <Badge variant="secondary">{result.totalResources}</Badge>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {dependencyResults.map((result) => (
              <TabsContent
                key={result.iflowId}
                value={result.iflowId}
                className="space-y-4"
              >
                {/* iFlow Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        {result.iflowName}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <p>
                          <strong>ID:</strong> {result.iflowId}
                        </p>
                        <p>
                          <strong>Version:</strong> {result.version}
                        </p>
                        <p>
                          <strong>Total Resources:</strong>{" "}
                          {result.totalResources}
                        </p>
                        <p>
                          <strong>Critical Dependencies:</strong>{" "}
                          {result.criticalDependencies}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge
                        className={`text-lg px-4 py-2 ${getRiskBadgeColor(result.riskLevel)}`}
                      >
                        {result.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Resource Categories */}
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(result.resources).map(([type, resources]) => (
                    <Card key={type} className="border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center space-x-2">
                          {getResourceIcon(type)}
                          <span>{getResourceTitle(type)}</span>
                          <Badge variant="secondary">{resources.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {resources.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">
                            No {getResourceTitle(type).toLowerCase()} found
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {resources.map((resource, index) => (
                              <div
                                key={index}
                                className="p-2 bg-gray-50 rounded text-sm"
                              >
                                <div className="font-medium truncate">
                                  {resource.Name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {resource.ResourceType}
                                  {resource.Size && (
                                    <span className="ml-2">
                                      • {Math.round(resource.Size / 1024)}KB
                                    </span>
                                  )}
                                </div>
                                {resource.Description && (
                                  <div className="text-xs text-gray-500 truncate mt-1">
                                    {resource.Description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Critical Dependencies Details */}
                {result.criticalDependencies > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-orange-800 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>Critical Dependencies</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.resources.external_services.length > 0 && (
                          <div>
                            <h4 className="font-medium text-orange-900 mb-2 flex items-center space-x-2">
                              <ExternalLink className="w-4 h-4" />
                              <span>
                                External Services (
                                {result.resources.external_services.length})
                              </span>
                            </h4>
                            <div className="pl-6 space-y-1">
                              {result.resources.external_services.map(
                                (service, index) => (
                                  <p
                                    key={index}
                                    className="text-sm text-orange-700"
                                  >
                                    • {service.Name}
                                  </p>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {result.resources.process_direct.length > 0 && (
                          <div>
                            <h4 className="font-medium text-orange-900 mb-2 flex items-center space-x-2">
                              <Network className="w-4 h-4" />
                              <span>
                                Process Direct Connections (
                                {result.resources.process_direct.length})
                              </span>
                            </h4>
                            <div className="pl-6 space-y-1">
                              {result.resources.process_direct.map(
                                (connection, index) => (
                                  <p
                                    key={index}
                                    className="text-sm text-orange-700"
                                  >
                                    • {connection.Name}
                                  </p>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {result.resources.value_mappings.length > 0 && (
                          <div>
                            <h4 className="font-medium text-orange-900 mb-2 flex items-center space-x-2">
                              <Database className="w-4 h-4" />
                              <span>
                                Value Mappings (
                                {result.resources.value_mappings.length})
                              </span>
                            </h4>
                            <div className="pl-6 space-y-1">
                              {result.resources.value_mappings.map(
                                (mapping, index) => (
                                  <p
                                    key={index}
                                    className="text-sm text-orange-700"
                                  >
                                    • {mapping.Name}
                                  </p>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
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
            className="flex items-center space-x-2"
          >
            <span>Next: Upload Artifacts</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Stage5Dependencies;
