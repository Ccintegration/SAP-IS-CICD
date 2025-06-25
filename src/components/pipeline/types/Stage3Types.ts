// File Path: src/components/pipeline/types/Stage3Types.ts
// Filename: Stage3Types.ts

// Core data interfaces
export interface ConfigurationParameter {
  ParameterKey: string;
  ParameterValue: string;
  DataType: string;
  Description?: string;
  Mandatory?: boolean;
}

export interface IFlowConfiguration {
  iflowId: string;
  iflowName: string;
  packageId: string;
  packageName: string;
  version: string;
  parameters: ConfigurationParameter[];
  parameterCount?: number; // For display purposes
}

export interface ParameterCategory {
  name: string;
  icon: React.ComponentType<any>;
  parameters: ConfigurationParameter[];
  iflowId: string;
}

// Environment management
export interface EnvironmentStatus {
  id: string;
  name: string;
  configured: number;
  pending: number;
  total: number;
  health: 'healthy' | 'warning' | 'error';
  isLive?: boolean;
}

// Package grouping for the new collapsible feature
export interface PackageGroup {
  packageId: string;
  packageName: string;
  iflows: IFlowConfiguration[];
}

// Component props interfaces
export interface Stage3Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Export/Import interfaces
export interface ExportData {
  timestamp: string;
  environment: string;
  iflow: {
    id: string;
    name: string;
    packageName: string;
    version: string;
  };
  parameters: Array<{
    key: string;
    value: string;
    dataType: string;
    mandatory?: boolean;
    description?: string;
    isModified: boolean;
  }>;
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

// Hook return type
export interface UseStage3ConfigurationReturn {
  // Core state
  iflowConfigurations: IFlowConfiguration[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveSuccess: boolean;
  selectedEnvironment: string;
  configurationChanges: Record<string, Record<string, string>>;
  selectedIFlowId: string | null;
  maskedFields: Set<string>;
  parametersNeedingAttention: number;
  dataTypes: string[];
  
  // Search & Filter state
  searchQuery: string;
  filterDataType: string;
  showEmptyOnly: boolean;
  autoSave: boolean;
  expandedCategories: Set<string>;
  advancedSearchOpen: boolean;
  filterMandatoryOnly: boolean;
  filterModifiedOnly: boolean;
  
  // Export/Import state
  exportDialogOpen: boolean;
  importDialogOpen: boolean;
  exportFormat: 'json' | 'csv' | 'xml';
  importFile: File | null;
  
  // State setters
  setSelectedEnvironment: (env: string) => void;
  setSelectedIFlowId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterDataType: (type: string) => void;
  setShowEmptyOnly: (show: boolean) => void;
  setAutoSave: (autoSave: boolean) => void;
  setAdvancedSearchOpen: (open: boolean) => void;
  setFilterMandatoryOnly: (filter: boolean) => void;
  setFilterModifiedOnly: (filter: boolean) => void;
  setExportDialogOpen: (open: boolean) => void;
  setImportDialogOpen: (open: boolean) => void;
  setExportFormat: (format: 'json' | 'csv' | 'xml') => void;
  setImportFile: (file: File | null) => void;
  setMaskedFields: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // Functions
  loadConfigurations: () => Promise<void>;
  saveConfigurations: (isAutoSave?: boolean) => Promise<void>;
  handleParameterChange: (iflowId: string, paramKey: string, value: string) => void;
  handleEnvironmentChange: (environmentId: string) => void;
  toggleCategory: (categoryKey: string) => void;
  isCategoryExpanded: (categoryKey: string) => boolean;
  getSelectedIFlow: () => IFlowConfiguration | null;
  getParameterValue: (param: ConfigurationParameter, iflowId: string) => string;
  categorizeParameters: (iflow: IFlowConfiguration) => ParameterCategory[];
  getFilteredParameters: (categories: ParameterCategory[]) => ParameterCategory[];
  handleExportConfigurations: () => Promise<void>;
  handleImportConfigurations: () => Promise<void>;
  handleResetAllToDefault: () => void;
  clearAllFilters: () => void;
}

// Navigation and confirmation types
export interface NavigationConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

// Filter and search types
export type DataTypeFilter = "all" | "xsd:string" | "secureParameter" | "xsd:int" | "xsd:boolean";

export interface FilterState {
  searchQuery: string;
  dataType: DataTypeFilter;
  showEmptyOnly: boolean;
  mandatoryOnly: boolean;
  modifiedOnly: boolean;
}

// Category types for parameter organization
export type ParameterCategoryType = 
  | "Authentication"
  | "Connection Settings" 
  | "Security Parameters"
  | "General Configuration";

export interface CategoryConfig {
  name: ParameterCategoryType;
  icon: React.ComponentType<any>;
  description?: string;
}

// Validation types
export interface ParameterValidation {
  isValid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  parameterId: string;
  validations: ParameterValidation[];
}

// Backend integration types
export interface BackendSaveResponse {
  success: boolean;
  message?: string;
  savedAt?: string;
  errors?: string[];
}

export interface BackendLoadResponse {
  success: boolean;
  configurations?: IFlowConfiguration[];
  message?: string;
  errors?: string[];
}