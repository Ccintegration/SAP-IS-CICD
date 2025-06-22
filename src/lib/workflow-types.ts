export interface WorkflowStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  message?: string;
  startTime?: Date;
  endTime?: Date;
  progress?: number;
  artifacts?: WorkflowArtifact[];
}

export interface WorkflowArtifact {
  name: string;
  type: "package" | "iflow" | "config" | "report" | "log";
  size: number;
  downloadUrl?: string;
  createdAt: Date;
}

export interface WorkflowExecution {
  id: string;
  tenantId: string;
  tenantName: string;
  workflowType: WorkflowType;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  steps: WorkflowStep[];
  startTime: Date;
  endTime?: Date;
  totalProgress: number;
  artifacts: WorkflowArtifact[];
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  stepId?: string;
}

export type WorkflowType =
  | "extract_packages"
  | "extract_iflows"
  | "validate_config"
  | "deploy_artifacts"
  | "full_pipeline"
  | "backup_tenant"
  | "sync_environments";

export interface WorkflowTemplate {
  type: WorkflowType;
  name: string;
  description: string;
  icon: string;
  estimatedDuration: string;
  steps: {
    id: string;
    name: string;
    description: string;
    required: boolean;
  }[];
  requirements: string[];
}

export interface WorkflowConfig {
  tenantId: string;
  workflowType: WorkflowType;
  options: {
    includeTests?: boolean;
    includeConfigurations?: boolean;
    packageFilter?: string;
    targetEnvironment?: string;
    validateOnly?: boolean;
    createBackup?: boolean;
    notifyOnCompletion?: boolean;
  };
}
