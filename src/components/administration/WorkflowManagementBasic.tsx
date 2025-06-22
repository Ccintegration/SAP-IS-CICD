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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Workflow, PlayCircle, Activity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { SAPTenant } from "@/lib/types";
import { WorkflowConfig, WorkflowType } from "@/lib/workflow-types";
import { WorkflowService } from "@/lib/workflow-service";
import { TenantService } from "@/lib/tenant-service";

const WorkflowManagementBasic: React.FC = () => {
  const [tenants, setTenants] = useState<SAPTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | "">(
    "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const tenantList = await TenantService.getAllTenants();
      setTenants(tenantList);
    } catch (error) {
      toast.error("Failed to load tenants");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedTenant || !selectedWorkflow) return;

    try {
      setIsExecuting(true);

      const tenant = tenants.find((t) => t.id === selectedTenant);
      if (!tenant) {
        throw new Error("Tenant not found");
      }

      const config: WorkflowConfig = {
        tenantId: selectedTenant,
        workflowType: selectedWorkflow,
        options: {
          includeTests: true,
          includeConfigurations: true,
          notifyOnCompletion: true,
        },
      };

      await WorkflowService.executeWorkflow(tenant, config);

      toast.success("Workflow started successfully!", {
        description: `${selectedWorkflow.replace(/_/g, " ")} execution has begun on ${tenant.name}`,
      });

      // Reset form
      setSelectedWorkflow("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start workflow";
      toast.error("Workflow execution failed", {
        description: errorMessage,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const workflows = WorkflowService.getWorkflowTemplates();
  const connectedTenants = tenants.filter(
    (t) => t.connectionStatus === "connected",
  );

  const canExecute = selectedTenant && selectedWorkflow && !isExecuting;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Workflow className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-xl">Workflow Management</CardTitle>
          </div>
          <CardDescription>
            Execute SAP Integration Suite workflows on your registered tenants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {connectedTenants.length === 0 && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                No connected tenants available. Please register and connect a
                tenant first.
              </AlertDescription>
            </Alert>
          )}

          {/* Tenant Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Tenant</label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a connected tenant..." />
              </SelectTrigger>
              <SelectContent>
                {connectedTenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{tenant.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Workflow Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Workflow</label>
            <Select
              value={selectedWorkflow}
              onValueChange={(value) =>
                setSelectedWorkflow(value as WorkflowType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a workflow to execute..." />
              </SelectTrigger>
              <SelectContent>
                {workflows.map((workflow) => (
                  <SelectItem key={workflow.type} value={workflow.type}>
                    <div className="flex items-center space-x-2">
                      <span>{workflow.icon}</span>
                      <span>{workflow.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Execute Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleExecute}
              disabled={!canExecute}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isExecuting ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Starting Workflow...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Execute Workflow
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simple Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {connectedTenants.length}
              </div>
              <div className="text-sm text-blue-600">Connected Tenants</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {workflows.length}
              </div>
              <div className="text-sm text-green-600">Available Workflows</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">✓</div>
              <div className="text-sm text-purple-600">System Ready</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">🚀</div>
              <div className="text-sm text-orange-600">Ready to Deploy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowManagementBasic;
