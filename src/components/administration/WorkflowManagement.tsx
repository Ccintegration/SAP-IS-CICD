import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Workflow,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import WorkflowSelector from "./WorkflowSelector";
import WorkflowMonitor from "./WorkflowMonitor";
import { SAPTenant } from "@/lib/types";
import { WorkflowExecution, WorkflowConfig } from "@/lib/workflow-types";
import { WorkflowService } from "@/lib/workflow-service";
import { TenantService } from "@/lib/tenant-service";

const WorkflowManagement: React.FC = () => {
  const [tenants, setTenants] = useState<SAPTenant[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);

  useEffect(() => {
    loadTenants();
    loadExecutions();
  }, []);

  const loadTenants = async () => {
    try {
      setIsLoadingTenants(true);
      const tenantList = await TenantService.getAllTenants();
      setTenants(tenantList);
    } catch (error) {
      toast.error("Failed to load tenants");
    } finally {
      setIsLoadingTenants(false);
    }
  };

  const loadExecutions = async () => {
    try {
      setIsLoadingExecutions(true);
      const executionList = await WorkflowService.getWorkflowExecutions();
      setExecutions(executionList);
    } catch (error) {
      toast.error("Failed to load workflow executions");
    } finally {
      setIsLoadingExecutions(false);
    }
  };

  const handleWorkflowStart = async (config: WorkflowConfig) => {
    try {
      setIsExecutingWorkflow(true);

      const tenant = tenants.find((t) => t.id === config.tenantId);
      if (!tenant) {
        throw new Error("Tenant not found");
      }

      const execution = await WorkflowService.executeWorkflow(tenant, config);

      toast.success("Workflow started successfully!", {
        description: `${config.workflowType.replace(/_/g, " ")} execution has begun on ${tenant.name}`,
      });

      // Refresh executions to show the new one
      await loadExecutions();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start workflow";
      toast.error("Workflow execution failed", {
        description: errorMessage,
      });
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  const getWorkflowStats = () => {
    const stats = {
      total: executions.length,
      running: executions.filter((e) => e.status === "running").length,
      completed: executions.filter((e) => e.status === "completed").length,
      failed: executions.filter((e) => e.status === "failed").length,
    };
    return stats;
  };

  const stats = getWorkflowStats();
  const connectedTenants = tenants.filter(
    (t) => t.connectionStatus === "connected",
  );

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Workflow className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-xl">Workflow Management</CardTitle>
          </div>
          <CardDescription>
            Execute and monitor SAP Integration Suite workflows on your
            registered tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {connectedTenants.length}
              </div>
              <div className="text-sm text-blue-600">Connected Tenants</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {stats.completed}
              </div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {stats.running}
              </div>
              <div className="text-sm text-yellow-600">Running</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">
                {stats.failed}
              </div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>

          {/* Status Alert */}
          {connectedTenants.length === 0 && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                No connected tenants available. Please register and connect
                tenants in the administration section above.
              </AlertDescription>
            </Alert>
          )}

          {stats.running > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <Activity className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {stats.running} workflow{stats.running > 1 ? "s" : ""} currently
                running. Monitor progress below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Workflow Interface */}
      <Tabs defaultValue="execute" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="execute" className="flex items-center space-x-2">
            <Workflow className="w-4 h-4" />
            <span>Execute Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Monitor Executions</span>
            {stats.running > 0 && (
              <Badge className="bg-blue-600 text-white ml-2">
                {stats.running}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="execute">
          <WorkflowSelector
            tenants={tenants}
            onWorkflowStart={handleWorkflowStart}
            isLoading={isExecutingWorkflow}
          />
        </TabsContent>

        <TabsContent value="monitor">
          <WorkflowMonitor
            executions={executions}
            onRefresh={loadExecutions}
            isLoading={isLoadingExecutions}
          />
        </TabsContent>
      </Tabs>

      {/* Available Workflows Quick Reference */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg text-purple-800">
            Available Workflows
          </CardTitle>
          <CardDescription className="text-purple-600">
            Quick reference for supported workflow operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WorkflowService.getWorkflowTemplates().map((workflow) => (
              <div
                key={workflow.type}
                className="p-3 bg-white rounded-lg border border-purple-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{workflow.icon}</span>
                  <h4 className="font-medium text-sm text-purple-900">
                    {workflow.name}
                  </h4>
                </div>
                <p className="text-xs text-purple-700 mb-2">
                  {workflow.description}
                </p>
                <div className="flex items-center space-x-1 text-xs text-purple-600">
                  <Clock className="w-3 h-3" />
                  <span>{workflow.estimatedDuration}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowManagement;
