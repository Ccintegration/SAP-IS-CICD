// File Path: src/components/pipeline/types/IFlowTypes.ts
// Filename: IFlowTypes.ts

export interface IFlow {
  id: string;
  name: string;
  description: string;
  packageId: string;
  packageName?: string;
  status: "active" | "draft" | "error";
  lastModified: string;
  version: string;
  author: string;
  type: "http" | "mail" | "sftp" | "database" | "integration flow";
  parameterCount?: number; // For Configuration Tab display
}

export interface PackageWithIFlows {
  packageId: string;
  packageName: string;
  iflows: IFlow[];
}

export interface Stage2Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export interface IFlowCardProps {
  iflow: IFlow;
  isSelected: boolean;
  onToggle: (iflowId: string) => void;
  showPackageName?: boolean;
}

export interface IFlowPackageListProps {
  packagesByIFlows: PackageWithIFlows[];
  selectedIFlows: string[];
  expandedPackages: Set<string>;
  searchTerm: string;
  onIFlowToggle: (iflowId: string) => void;
  onPackageToggle: (packageId: string) => void;
  onSelectAllInPackage: (packageId: string) => void;
}

export interface PackagePaginationState {
  currentPage: number;
  itemsPerPage: number;
}

export interface UseIFlowDataReturn {
  iFlows: IFlow[];
  packagesByIFlows: PackageWithIFlows[];
  loading: boolean;
  error: string | null;
  loadIFlows: () => Promise<void>;
}

// Configuration-related types for Stage 3
export interface ConfigurationParameter {
  ParameterKey: string;
  ParameterValue: string;
  DataType: string;
  Description?: string;
  Mandatory: boolean;
}

export interface IFlowConfiguration {
  iflowId: string;
  iflowName: string;
  packageId: string;
  packageName: string;
  version: string;
  parameters: ConfigurationParameter[];
  parameterCount: number;
}

export interface SaveConfigurationRequest {
  packageName: string;
  iflowName: string;
  version: string;
  parameters: Array<{
    parameterName: string;
    parameterValue: string;
  }>;
}

// Navigation and confirmation types
export interface NavigationConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}