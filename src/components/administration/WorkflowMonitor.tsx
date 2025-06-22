import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  StopCircle,
  RefreshCw,
  Download,
  FileText,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { WorkflowExecution, WorkflowStep } from "@/lib/workflow-types";
import { WorkflowService } from "@/lib/workflow-service";

interface WorkflowMonitorProps {
  executions: WorkflowExecution[];
  onRefresh: () => void;
  isLoading: boolean;
}

const WorkflowMonitor: React.FC<WorkflowMonitorProps> = ({
  executions,
  onRefresh,
  isLoading,
}) => {
  const [expandedExecution, setExpandedExecution] = useState<string>("");
  const [activeTab, setActiveTab] = useState("steps");

  // Auto-refresh for running workflows
  useEffect(() => {
    const runningExecutions = executions.filter((e) => e.status === "running");
    if (runningExecutions.length > 0) {
      const interval = setInterval(onRefresh, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [executions, onRefresh]);

  const getStatusIcon = (status: WorkflowExecution["status"]) => {
    switch (status) {
      case "running":
        return <Activity className="w-4 h-4 text-blue-600 animate-pulse" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "cancelled":
        return <StopCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: WorkflowExecution["status"]) => {
    const variants = {
      pending: {
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-800",
      },
      running: {
        variant: "default" as const,
        className: "bg-blue-100 text-blue-800",
      },
      completed: {
        variant: "default" as const,
        className: "bg-green-100 text-green-800",
      },
      failed: { variant: "destructive" as const, className: "" },
      cancelled: { variant: "secondary" as const, className: "" },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStepStatusIcon = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "running":
        return <Activity className="w-4 h-4 text-blue-600 animate-pulse" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "skipped":
        return <div className="w-4 h-4 rounded-full bg-gray-300"></div>;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-200"></div>;
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleCancel = async (executionId: string) => {
    try {
      await WorkflowService.cancelWorkflow(executionId);
      onRefresh();
    } catch (error) {
      console.error("Failed to cancel workflow:", error);
    }
  };

  const handleRetry = async (executionId: string) => {
    try {
      await WorkflowService.retryWorkflow(executionId);
      onRefresh();
    } catch (error) {
      console.error("Failed to retry workflow:", error);
    }
  };

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Workflows Executed
          </h3>
          <p className="text-gray-500">
            Execute a workflow to see its progress and results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Workflow Executions</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {executions.map((execution) => (
        <Card key={execution.id} className="overflow-hidden">
          <Collapsible
            open={expandedExecution === execution.id}
            onOpenChange={(open) =>
              setExpandedExecution(open ? execution.id : "")
            }
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(execution.status)}
                    <div>
                      <CardTitle className="text-base">
                        {execution.workflowType
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </CardTitle>
                      <CardDescription>
                        Tenant: {execution.tenantName} • Started:{" "}
                        {execution.startTime.toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(execution.status)}
                    <div className="text-sm text-gray-500">
                      {formatDuration(execution.startTime, execution.endTime)}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedExecution === execution.id
                          ? "transform rotate-180"
                          : ""
                      }`}
                    />
                  </div>
                </div>

                {execution.status === "running" && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Overall Progress</span>
                      <span>{execution.totalProgress}%</span>
                    </div>
                    <Progress
                      value={execution.totalProgress}
                      className="w-full"
                    />
                  </div>
                )}
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="steps">Steps</TabsTrigger>
                    <TabsTrigger value="artifacts">
                      Artifacts ({execution.artifacts.length})
                    </TabsTrigger>
                    <TabsTrigger value="logs">
                      Logs ({execution.logs.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="steps" className="mt-4">
                    <div className="space-y-3">
                      {execution.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            {getStepStatusIcon(step.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">
                                {step.name}
                              </h4>
                              <div className="text-xs text-gray-500">
                                {step.startTime &&
                                  step.endTime &&
                                  formatDuration(step.startTime, step.endTime)}
                              </div>
                            </div>
                            {step.status === "running" &&
                              step.progress !== undefined && (
                                <div className="mt-2">
                                  <Progress
                                    value={step.progress}
                                    className="w-full h-2"
                                  />
                                </div>
                              )}
                            {step.message && (
                              <p className="text-xs text-red-600 mt-1">
                                {step.message}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                      {execution.status === "running" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(execution.id)}
                        >
                          <StopCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                      {execution.status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(execution.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="artifacts" className="mt-4">
                    {execution.artifacts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No artifacts generated yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {execution.artifacts.map((artifact, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="font-medium text-sm">
                                  {artifact.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {artifact.type} •{" "}
                                  {(artifact.size / 1024).toFixed(1)} KB •{" "}
                                  {artifact.createdAt.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="logs" className="mt-4">
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {execution.logs.map((log, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-2 text-xs p-2 bg-gray-50 rounded"
                        >
                          <span className="text-gray-400 font-mono">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <Badge
                            variant={
                              log.level === "error" ? "destructive" : "outline"
                            }
                            className="text-xs py-0"
                          >
                            {log.level}
                          </Badge>
                          <span className="flex-1">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
};

export default WorkflowMonitor;
