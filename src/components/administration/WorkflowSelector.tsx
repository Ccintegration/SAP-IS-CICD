import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlayCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { SAPTenant } from "@/lib/types";
import {
  WorkflowTemplate,
  WorkflowConfig,
  WorkflowType,
} from "@/lib/workflow-types";
import { WorkflowService } from "@/lib/workflow-service";

interface WorkflowSelectorProps {
  tenants: SAPTenant[];
  onWorkflowStart: (config: WorkflowConfig) => void;
  isLoading: boolean;
}

const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  tenants,
  onWorkflowStart,
  isLoading,
}) => {
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | "">(
    "",
  );
  const [options, setOptions] = useState({
    includeTests: true,
    includeConfigurations: true,
    packageFilter: "",
    targetEnvironment: "",
    validateOnly: false,
    createBackup: false,
    notifyOnCompletion: true,
  });

  const workflows = WorkflowService.getWorkflowTemplates();
  const selectedWorkflowTemplate = workflows.find(
    (w) => w.type === selectedWorkflow,
  );
  const selectedTenantObject = tenants.find((t) => t.id === selectedTenant);

  const handleExecute = () => {
    if (!selectedTenant || !selectedWorkflow) return;

    const config: WorkflowConfig = {
      tenantId: selectedTenant,
      workflowType: selectedWorkflow,
      options,
    };

    onWorkflowStart(config);
  };

  const canExecute = selectedTenant && selectedWorkflow && !isLoading;
  const connectedTenants = tenants.filter(
    (t) => t.connectionStatus === "connected",
  );

  const getWorkflowIcon = (type: WorkflowType) => {
    const iconMap = {
      extract_packages: "📦",
      extract_iflows: "🔄",
      validate_config: "✅",
      deploy_artifacts: "🚀",
      full_pipeline: "⚡",
      backup_tenant: "💾",
      sync_environments: "🔄",
    };
    return iconMap[type] || "⚙️";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Execute Workflow</CardTitle>
          </div>
          <CardDescription>
            Select a tenant and workflow to execute integration operations
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
            <Label className="text-sm font-medium">Select Tenant</Label>
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
                      <Badge variant="outline" className="text-xs">
                        {tenant.connectionStatus}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTenantObject && (
              <div className="text-xs text-gray-500">
                Base URL: {selectedTenantObject.baseUrl}
              </div>
            )}
          </div>

          {/* Workflow Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Workflow</Label>
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
                      <span className="text-lg">
                        {getWorkflowIcon(workflow.type)}
                      </span>
                      <span>{workflow.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Workflow Details */}
          {selectedWorkflowTemplate && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {getWorkflowIcon(selectedWorkflowTemplate.type)}{" "}
                      {selectedWorkflowTemplate.name}
                    </h4>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{selectedWorkflowTemplate.estimatedDuration}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    {selectedWorkflowTemplate.description}
                  </p>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Workflow Steps:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedWorkflowTemplate.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center space-x-2"
                        >
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          <span className="text-xs text-gray-700">
                            {step.name}
                          </span>
                          {step.required && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Requirements:
                    </h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {selectedWorkflowTemplate.requirements.map(
                        (req, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>{req}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workflow Options */}
          {selectedWorkflow && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Workflow Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeTests"
                      checked={options.includeTests}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          includeTests: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="includeTests" className="text-sm">
                      Include test artifacts
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeConfigurations"
                      checked={options.includeConfigurations}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          includeConfigurations: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="includeConfigurations" className="text-sm">
                      Include configurations
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createBackup"
                      checked={options.createBackup}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          createBackup: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="createBackup" className="text-sm">
                      Create backup before changes
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notifyOnCompletion"
                      checked={options.notifyOnCompletion}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          notifyOnCompletion: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="notifyOnCompletion" className="text-sm">
                      Notify on completion
                    </Label>
                  </div>
                </div>

                {(selectedWorkflow === "extract_packages" ||
                  selectedWorkflow === "extract_iflows") && (
                  <div>
                    <Label
                      htmlFor="packageFilter"
                      className="text-sm font-medium"
                    >
                      Package Filter (optional)
                    </Label>
                    <Input
                      id="packageFilter"
                      placeholder="e.g., HR_*, FINANCE_INTEGRATION"
                      value={options.packageFilter}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          packageFilter: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use wildcards (*) to filter packages by name
                    </p>
                  </div>
                )}

                {selectedWorkflow === "deploy_artifacts" && (
                  <div>
                    <Label
                      htmlFor="targetEnvironment"
                      className="text-sm font-medium"
                    >
                      Target Environment
                    </Label>
                    <Select
                      value={options.targetEnvironment}
                      onValueChange={(value) =>
                        setOptions((prev) => ({
                          ...prev,
                          targetEnvironment: value,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select target environment..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Execute Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleExecute}
              disabled={!canExecute}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <PlayCircle className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Starting Workflow..." : "Execute Workflow"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowSelector;
