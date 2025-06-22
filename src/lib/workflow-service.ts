import {
  WorkflowExecution,
  WorkflowStep,
  WorkflowType,
  WorkflowTemplate,
  WorkflowConfig,
  WorkflowArtifact,
  WorkflowLog,
} from "./workflow-types";
import { SAPTenant } from "./types";

// Mock storage for workflow executions
let workflowExecutions: WorkflowExecution[] = [];

export class WorkflowService {
  static getWorkflowTemplates(): WorkflowTemplate[] {
    return [
      {
        type: "extract_packages",
        name: "Extract Integration Packages",
        description:
          "Extract all integration packages from the SAP Integration Suite tenant",
        icon: "📦",
        estimatedDuration: "2-5 minutes",
        steps: [
          {
            id: "connect",
            name: "Connect to Tenant",
            description: "Establish connection to SAP IS",
            required: true,
          },
          {
            id: "discover",
            name: "Discover Packages",
            description: "Scan for all available packages",
            required: true,
          },
          {
            id: "extract",
            name: "Extract Package Data",
            description: "Download package configurations",
            required: true,
          },
          {
            id: "validate",
            name: "Validate Packages",
            description: "Verify package integrity",
            required: false,
          },
        ],
        requirements: ["Valid OAuth credentials", "Package read permissions"],
      },
      {
        type: "extract_iflows",
        name: "Extract Integration Flows",
        description: "Extract all integration flows and their configurations",
        icon: "🔄",
        estimatedDuration: "3-8 minutes",
        steps: [
          {
            id: "connect",
            name: "Connect to Tenant",
            description: "Establish connection to SAP IS",
            required: true,
          },
          {
            id: "discover",
            name: "Discover iFlows",
            description: "Scan for all integration flows",
            required: true,
          },
          {
            id: "extract",
            name: "Extract iFlow Data",
            description: "Download iFlow configurations",
            required: true,
          },
          {
            id: "dependencies",
            name: "Extract Dependencies",
            description: "Map iFlow dependencies",
            required: false,
          },
          {
            id: "validate",
            name: "Validate iFlows",
            description: "Verify iFlow configurations",
            required: false,
          },
        ],
        requirements: ["Valid OAuth credentials", "iFlow read permissions"],
      },
      {
        type: "validate_config",
        name: "Validate Configuration",
        description: "Validate tenant configuration and connectivity",
        icon: "✅",
        estimatedDuration: "1-3 minutes",
        steps: [
          {
            id: "connect",
            name: "Test Connection",
            description: "Verify tenant connectivity",
            required: true,
          },
          {
            id: "validate_oauth",
            name: "Validate OAuth",
            description: "Test OAuth token generation",
            required: true,
          },
          {
            id: "check_permissions",
            name: "Check Permissions",
            description: "Verify access permissions",
            required: true,
          },
          {
            id: "test_apis",
            name: "Test APIs",
            description: "Validate API endpoints",
            required: true,
          },
        ],
        requirements: ["Valid OAuth credentials"],
      },
      {
        type: "deploy_artifacts",
        name: "Deploy Artifacts",
        description: "Deploy integration artifacts to target environment",
        icon: "🚀",
        estimatedDuration: "5-15 minutes",
        steps: [
          {
            id: "connect",
            name: "Connect to Target",
            description: "Connect to target tenant",
            required: true,
          },
          {
            id: "prepare",
            name: "Prepare Artifacts",
            description: "Prepare artifacts for deployment",
            required: true,
          },
          {
            id: "deploy",
            name: "Deploy Packages",
            description: "Deploy integration packages",
            required: true,
          },
          {
            id: "configure",
            name: "Configure iFlows",
            description: "Apply configurations",
            required: true,
          },
          {
            id: "test",
            name: "Run Tests",
            description: "Execute deployment tests",
            required: false,
          },
        ],
        requirements: [
          "Valid OAuth credentials",
          "Deployment permissions",
          "Target environment access",
        ],
      },
      {
        type: "full_pipeline",
        name: "Full CI/CD Pipeline",
        description: "Complete end-to-end CI/CD pipeline execution",
        icon: "⚡",
        estimatedDuration: "10-30 minutes",
        steps: [
          {
            id: "extract",
            name: "Extract Source",
            description: "Extract from source tenant",
            required: true,
          },
          {
            id: "validate",
            name: "Validate Artifacts",
            description: "Validate extracted artifacts",
            required: true,
          },
          {
            id: "build",
            name: "Build Pipeline",
            description: "Build deployment packages",
            required: true,
          },
          {
            id: "test",
            name: "Run Tests",
            description: "Execute test suite",
            required: false,
          },
          {
            id: "deploy",
            name: "Deploy to Target",
            description: "Deploy to target environment",
            required: true,
          },
          {
            id: "verify",
            name: "Verify Deployment",
            description: "Verify deployment success",
            required: true,
          },
        ],
        requirements: [
          "Source and target tenant access",
          "Full pipeline permissions",
        ],
      },
      {
        type: "backup_tenant",
        name: "Backup Tenant",
        description: "Create a complete backup of the tenant configuration",
        icon: "💾",
        estimatedDuration: "5-10 minutes",
        steps: [
          {
            id: "connect",
            name: "Connect to Tenant",
            description: "Establish connection",
            required: true,
          },
          {
            id: "inventory",
            name: "Create Inventory",
            description: "Catalog all artifacts",
            required: true,
          },
          {
            id: "backup",
            name: "Backup Artifacts",
            description: "Create backup files",
            required: true,
          },
          {
            id: "verify",
            name: "Verify Backup",
            description: "Validate backup integrity",
            required: true,
          },
        ],
        requirements: ["Valid OAuth credentials", "Full read permissions"],
      },
    ];
  }

  static async executeWorkflow(
    tenant: SAPTenant,
    config: WorkflowConfig,
  ): Promise<WorkflowExecution> {
    const template = this.getWorkflowTemplates().find(
      (t) => t.type === config.workflowType,
    );
    if (!template) {
      throw new Error(`Unknown workflow type: ${config.workflowType}`);
    }

    const execution: WorkflowExecution = {
      id: Date.now().toString(),
      tenantId: tenant.id,
      tenantName: tenant.name,
      workflowType: config.workflowType,
      status: "pending",
      steps: template.steps.map((step) => ({
        id: step.id,
        name: step.name,
        status: "pending",
        progress: 0,
      })),
      startTime: new Date(),
      totalProgress: 0,
      artifacts: [],
      logs: [
        {
          timestamp: new Date(),
          level: "info",
          message: `Starting ${template.name} workflow for tenant ${tenant.name}`,
        },
      ],
    };

    workflowExecutions.push(execution);

    // Start execution in background
    this.runWorkflowSteps(execution, tenant, config);

    return execution;
  }

  private static async runWorkflowSteps(
    execution: WorkflowExecution,
    tenant: SAPTenant,
    config: WorkflowConfig,
  ): Promise<void> {
    execution.status = "running";

    for (let i = 0; i < execution.steps.length; i++) {
      const step = execution.steps[i];

      // Start step
      step.status = "running";
      step.startTime = new Date();
      execution.logs.push({
        timestamp: new Date(),
        level: "info",
        message: `Starting step: ${step.name}`,
        stepId: step.id,
      });

      try {
        // Simulate step execution
        await this.executeStep(step, tenant, config, execution);

        // Complete step
        step.status = "completed";
        step.endTime = new Date();
        step.progress = 100;

        execution.logs.push({
          timestamp: new Date(),
          level: "info",
          message: `Completed step: ${step.name}`,
          stepId: step.id,
        });
      } catch (error) {
        step.status = "failed";
        step.endTime = new Date();
        step.message = error instanceof Error ? error.message : "Unknown error";

        execution.logs.push({
          timestamp: new Date(),
          level: "error",
          message: `Failed step: ${step.name} - ${step.message}`,
          stepId: step.id,
        });

        execution.status = "failed";
        execution.endTime = new Date();
        return;
      }

      // Update overall progress
      execution.totalProgress = Math.round(
        ((i + 1) / execution.steps.length) * 100,
      );
    }

    execution.status = "completed";
    execution.endTime = new Date();
    execution.logs.push({
      timestamp: new Date(),
      level: "info",
      message: `Workflow completed successfully`,
    });
  }

  private static async executeStep(
    step: WorkflowStep,
    tenant: SAPTenant,
    config: WorkflowConfig,
    execution: WorkflowExecution,
  ): Promise<void> {
    // Simulate realistic execution time
    const baseTime = 2000; // 2 seconds base
    const randomTime = Math.random() * 5000; // 0-5 seconds random
    const stepTime = baseTime + randomTime;

    // Simulate progress updates
    const progressSteps = 5;
    for (let i = 0; i <= progressSteps; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, stepTime / progressSteps),
      );
      step.progress = Math.round((i / progressSteps) * 100);
    }

    // Generate mock artifacts based on step type
    const artifacts = this.generateMockArtifacts(step.id, config.workflowType);
    execution.artifacts.push(...artifacts);

    // Simulate some failures for demonstration (10% failure rate)
    if (Math.random() < 0.1) {
      throw new Error(`Simulated failure in step: ${step.name}`);
    }

    // Add detailed logs for specific steps
    if (step.id === "extract") {
      execution.logs.push({
        timestamp: new Date(),
        level: "info",
        message: `Extracted ${Math.floor(Math.random() * 20) + 5} artifacts`,
        stepId: step.id,
      });
    }

    if (step.id === "validate") {
      execution.logs.push({
        timestamp: new Date(),
        level: "info",
        message: `Validation completed with ${Math.floor(Math.random() * 3)} warnings`,
        stepId: step.id,
      });
    }
  }

  private static generateMockArtifacts(
    stepId: string,
    workflowType: WorkflowType,
  ): WorkflowArtifact[] {
    const artifacts: WorkflowArtifact[] = [];

    switch (stepId) {
      case "extract":
        if (workflowType === "extract_packages") {
          artifacts.push(
            {
              name: "integration-packages.json",
              type: "package",
              size: Math.floor(Math.random() * 100000) + 50000,
              createdAt: new Date(),
            },
            {
              name: "package-dependencies.xml",
              type: "config",
              size: Math.floor(Math.random() * 50000) + 10000,
              createdAt: new Date(),
            },
          );
        }

        if (workflowType === "extract_iflows") {
          artifacts.push(
            {
              name: "integration-flows.json",
              type: "iflow",
              size: Math.floor(Math.random() * 200000) + 100000,
              createdAt: new Date(),
            },
            {
              name: "iflow-configurations.xml",
              type: "config",
              size: Math.floor(Math.random() * 75000) + 25000,
              createdAt: new Date(),
            },
          );
        }
        break;

      case "validate":
        artifacts.push({
          name: "validation-report.html",
          type: "report",
          size: Math.floor(Math.random() * 30000) + 10000,
          createdAt: new Date(),
        });
        break;

      case "backup":
        artifacts.push({
          name: `tenant-backup-${new Date().toISOString().split("T")[0]}.zip`,
          type: "package",
          size: Math.floor(Math.random() * 10000000) + 5000000,
          createdAt: new Date(),
        });
        break;
    }

    return artifacts;
  }

  static async getWorkflowExecutions(): Promise<WorkflowExecution[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...workflowExecutions].sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime(),
    );
  }

  static async getWorkflowExecution(
    id: string,
  ): Promise<WorkflowExecution | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return workflowExecutions.find((e) => e.id === id) || null;
  }

  static async cancelWorkflow(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const execution = workflowExecutions.find((e) => e.id === id);
    if (execution && execution.status === "running") {
      execution.status = "cancelled";
      execution.endTime = new Date();
      execution.logs.push({
        timestamp: new Date(),
        level: "warn",
        message: "Workflow cancelled by user",
      });
    }
  }

  static async retryWorkflow(id: string): Promise<WorkflowExecution> {
    const originalExecution = workflowExecutions.find((e) => e.id === id);
    if (!originalExecution) {
      throw new Error("Workflow execution not found");
    }

    // Create new execution based on original
    const newExecution: WorkflowExecution = {
      ...originalExecution,
      id: Date.now().toString(),
      status: "pending",
      startTime: new Date(),
      endTime: undefined,
      totalProgress: 0,
      artifacts: [],
      logs: [
        {
          timestamp: new Date(),
          level: "info",
          message: `Retrying workflow (original ID: ${id})`,
        },
      ],
      steps: originalExecution.steps.map((step) => ({
        ...step,
        status: "pending",
        progress: 0,
        startTime: undefined,
        endTime: undefined,
        message: undefined,
      })),
    };

    workflowExecutions.push(newExecution);
    return newExecution;
  }
}
