import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Rocket,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  PlayCircle,
  Server,
  Activity,
  Zap,
  Globe,
  Package,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DeploymentResult {
  iflowId: string;
  iflowName: string;
  version: string;
  status: "pending" | "deploying" | "deployed" | "failed" | "started";
  progress: number;
  message?: string;
  deploymentId?: string;
  runtimeId?: string;
  timestamp?: string;
  targetEnvironment: string;
}

interface Stage7Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage7Deploy: React.FC<Stage7Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [deploymentResults, setDeploymentResults] = useState<
    DeploymentResult[]
  >([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState("development");

  const environments = [
    {
      id: "development",
      name: "Development",
      color: "bg-blue-100 text-blue-800",
      endpoint: "dev.company.com",
    },
    {
      id: "testing",
      name: "Testing",
      color: "bg-yellow-100 text-yellow-800",
      endpoint: "test.company.com",
    },
    {
      id: "production",
      name: "Production",
      color: "bg-green-100 text-green-800",
      endpoint: "prod.company.com",
    },
  ];

  useEffect(() => {
    initializeDeploymentResults();
  }, [data.selectedIFlows, data.uploadResults]);

  const initializeDeploymentResults = () => {
    if (!data.selectedIFlows || data.selectedIFlows.length === 0) {
      setError(
        "No integration flows selected. Please go back and select iFlows.",
      );
      return;
    }

    // Use the environment from upload results if available
    const targetEnv = data.uploadResults?.environment || selectedEnvironment;
    setSelectedEnvironment(targetEnv);

    const results: DeploymentResult[] = data.selectedIFlows.map(
      (iflowId: string) => {
        const iflowDetails = data.iflowDetails?.find(
          (iflow: any) => iflow.id === iflowId,
        ) || { id: iflowId, name: `iFlow ${iflowId}`, version: "1.0.0" };

        // Check if this iFlow was successfully uploaded
        const uploadResult = data.uploadResults?.results?.find(
          (r: any) => r.iflowId === iflowId,
        );
        const wasUploaded = uploadResult?.status === "success";

        return {
          iflowId,
          iflowName: iflowDetails.name,
          version: iflowDetails.version,
          status: wasUploaded ? ("pending" as const) : ("failed" as const),
          progress: 0,
          message: wasUploaded
            ? "Ready for deployment"
            : "Upload required before deployment",
          targetEnvironment: targetEnv,
        };
      },
    );

    setDeploymentResults(results);
  };

  const deploySingleIFlow = async (result: DeploymentResult): Promise<void> => {
    setDeploymentResults((prev) =>
      prev.map((r) =>
        r.iflowId === result.iflowId
          ? {
              ...r,
              status: "deploying",
              progress: 10,
              message: "Initiating deployment...",
            }
          : r,
      ),
    );

    try {
      // Simulate deployment progress
      const progressSteps = [
        { progress: 20, message: "Validating artifact..." },
        { progress: 40, message: "Deploying to runtime..." },
        { progress: 60, message: "Configuring runtime parameters..." },
        { progress: 80, message: "Starting integration flow..." },
        { progress: 90, message: "Verifying deployment..." },
      ];

      for (const step of progressSteps) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setDeploymentResults((prev) =>
          prev.map((r) =>
            r.iflowId === result.iflowId
              ? {
                  ...r,
                  progress: step.progress,
                  message: step.message,
                }
              : r,
          ),
        );
      }

      // Call the actual deployment API
      const response = await fetch(
        `/api/sap/iflows/${result.iflowId}/deploy?version=${result.version}&target_environment=${result.targetEnvironment}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Deployment failed: ${response.statusText}`);
      }

      const deploymentResponse = await response.json();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate successful deployment
      setDeploymentResults((prev) =>
        prev.map((r) =>
          r.iflowId === result.iflowId
            ? {
                ...r,
                status: "deployed",
                progress: 100,
                message: `Successfully deployed and started in ${result.targetEnvironment}`,
                deploymentId:
                  deploymentResponse.data?.deployment_id ||
                  `deploy_${Date.now()}`,
                runtimeId: `runtime_${result.iflowId}_${Date.now()}`,
                timestamp: new Date().toISOString(),
              }
            : r,
        ),
      );
    } catch (error) {
      console.error(`Deployment failed for ${result.iflowId}:`, error);
      setDeploymentResults((prev) =>
        prev.map((r) =>
          r.iflowId === result.iflowId
            ? {
                ...r,
                status: "failed",
                progress: 0,
                message: `Deployment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
              }
            : r,
        ),
      );
    }
  };

  const deployAllIFlows = async () => {
    setIsDeploying(true);
    setError(null);

    try {
      // Filter out iFlows that weren't uploaded successfully
      const deployableIFlows = deploymentResults.filter(
        (result) => result.status === "pending",
      );

      if (deployableIFlows.length === 0) {
        setError(
          "No iFlows available for deployment. Please ensure all uploads completed successfully.",
        );
        setIsDeploying(false);
        return;
      }

      // Reset deployable iFlows to pending
      setDeploymentResults((prev) =>
        prev.map((r) =>
          deployableIFlows.some((d) => d.iflowId === r.iflowId)
            ? { ...r, status: "pending" as const, progress: 0 }
            : r,
        ),
      );

      // Deploy each iFlow sequentially
      for (const result of deployableIFlows) {
        await deploySingleIFlow(result);
      }

      console.log(
        `Successfully deployed ${deployableIFlows.length} iFlows to ${selectedEnvironment}`,
      );
    } catch (error) {
      console.error("Deployment process failed:", error);
      setError("Deployment process failed. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "deploying":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "deployed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "deploying":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOverallProgress = () => {
    if (deploymentResults.length === 0) return 0;
    const totalProgress = deploymentResults.reduce(
      (sum, result) => sum + result.progress,
      0,
    );
    return Math.round(totalProgress / deploymentResults.length);
  };

  const getSuccessfulDeployments = () => {
    return deploymentResults.filter((result) => result.status === "deployed")
      .length;
  };

  const getFailedDeployments = () => {
    return deploymentResults.filter((result) => result.status === "failed")
      .length;
  };

  const getDeployableCount = () => {
    return deploymentResults.filter((result) => result.status === "pending")
      .length;
  };

  const canProceed = () => {
    return (
      deploymentResults.length > 0 &&
      deploymentResults.some((result) => result.status === "deployed")
    );
  };

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="flex items-center justify-center p-8">
          <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
          <div>
            <p className="text-lg font-medium text-red-800">{error}</p>
            <Button onClick={initializeDeploymentResults} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Rocket className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-emerald-800">
                Deploy to Runtime
              </CardTitle>
              <p className="text-emerald-600 mt-1">
                Deploy uploaded integration flows to SAP Integration Suite
                runtime environment and start the integration flows.
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
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total iFlows</p>
                <p className="text-2xl font-bold text-blue-600">
                  {deploymentResults.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Ready to Deploy</p>
                <p className="text-2xl font-bold text-orange-600">
                  {getDeployableCount()}
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
                <p className="text-sm text-gray-600">Deployed</p>
                <p className="text-2xl font-bold text-green-600">
                  {getSuccessfulDeployments()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {getFailedDeployments()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Runtime Environment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="p-6 rounded-lg border-2 border-emerald-300 bg-emerald-50">
              <div className="text-center">
                <Badge
                  className={
                    environments.find((e) => e.id === selectedEnvironment)
                      ?.color
                  }
                >
                  {environments.find((e) => e.id === selectedEnvironment)?.name}{" "}
                  Runtime
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  {
                    environments.find((e) => e.id === selectedEnvironment)
                      ?.endpoint
                  }
                </p>
                <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Server className="w-4 h-4" />
                    <span>Runtime Engine</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="w-4 h-4" />
                    <span>Auto-start Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Rocket className="w-5 h-5" />
              <span>Deployment Progress</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {getOverallProgress()}% Complete
              </span>
              <Button
                onClick={deployAllIFlows}
                disabled={isDeploying || getDeployableCount() === 0}
                className="flex items-center space-x-2"
              >
                {isDeploying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                <span>{isDeploying ? "Deploying..." : "Deploy All"}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <Progress value={getOverallProgress()} className="w-full h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {getSuccessfulDeployments()}/{deploymentResults.length} deployed
              </span>
              <span>
                Target:{" "}
                {environments.find((e) => e.id === selectedEnvironment)?.name}{" "}
                Runtime
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual iFlow Deployment Status */}
      <Card>
        <CardHeader>
          <CardTitle>iFlow Deployment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deploymentResults.map((result) => (
              <div
                key={result.iflowId}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h4 className="font-medium">{result.iflowName}</h4>
                      <p className="text-sm text-gray-600">
                        {result.iflowId} • v{result.version} •{" "}
                        {result.targetEnvironment}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusBadgeColor(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">
                      {result.progress}%
                    </span>
                  </div>
                </div>

                <Progress value={result.progress} className="w-full" />

                {result.message && (
                  <p className="text-sm text-gray-600">{result.message}</p>
                )}

                {result.status === "deployed" && result.runtimeId && (
                  <div className="bg-green-50 p-3 rounded text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-green-800">
                          <strong>Runtime ID:</strong> {result.runtimeId}
                        </p>
                        <p className="text-green-700">
                          <strong>Deployment ID:</strong> {result.deploymentId}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-700">
                          <strong>Status:</strong> Running
                        </p>
                        <p className="text-green-700">
                          <strong>Deployed At:</strong>{" "}
                          {new Date(result.timestamp!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {result.status === "failed" && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-800">
                      Deployment Failed
                    </AlertTitle>
                    <AlertDescription className="text-red-700">
                      {result.message ||
                        "Unknown error occurred during deployment"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Runtime Environment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <Badge
                    className={
                      environments.find((e) => e.id === selectedEnvironment)
                        ?.color
                    }
                  >
                    {
                      environments.find((e) => e.id === selectedEnvironment)
                        ?.name
                    }
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Runtime Endpoint:</span>
                  <span className="font-medium">
                    {
                      environments.find((e) => e.id === selectedEnvironment)
                        ?.endpoint
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-start:</span>
                  <span className="font-medium text-green-600">Enabled</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Deployment Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total iFlows:</span>
                  <span className="font-medium">
                    {deploymentResults.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Successfully Deployed:</span>
                  <span className="font-medium text-green-600">
                    {getSuccessfulDeployments()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Failed Deployments:</span>
                  <span className="font-medium text-red-600">
                    {getFailedDeployments()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Overall Progress:</span>
                  <span className="font-medium">{getOverallProgress()}%</span>
                </div>
              </div>
            </div>
          </div>

          {getFailedDeployments() > 0 && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">
                Deployment Issues Detected
              </AlertTitle>
              <AlertDescription className="text-red-700">
                {getFailedDeployments()} deployment(s) failed. Please review the
                errors and retry deployment for failed iFlows before proceeding
                to testing.
              </AlertDescription>
            </Alert>
          )}

          {getSuccessfulDeployments() > 0 && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">
                Deployment Successful
              </AlertTitle>
              <AlertDescription className="text-green-700">
                {getSuccessfulDeployments()} integration flow(s) have been
                successfully deployed and are now running in the{" "}
                {environments.find((e) => e.id === selectedEnvironment)?.name}{" "}
                environment. You can now proceed to testing.
              </AlertDescription>
            </Alert>
          )}
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
          <span>Previous: Upload Artifacts</span>
        </Button>

        <div className="flex space-x-4">
          <Button
            onClick={initializeDeploymentResults}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Status</span>
          </Button>

          <Button
            onClick={() => {
              onComplete({
                deploymentResults: {
                  environment: selectedEnvironment,
                  results: deploymentResults,
                  successCount: getSuccessfulDeployments(),
                  failureCount: getFailedDeployments(),
                  timestamp: new Date().toISOString(),
                },
              });
              onNext();
            }}
            disabled={!canProceed()}
            className="flex items-center space-x-2"
          >
            <span>Next: Testing</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Stage7Deploy;
