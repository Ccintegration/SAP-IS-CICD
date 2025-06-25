// File Path: src/components/pipeline/hooks/useStage3Configuration.ts
// Filename: useStage3Configuration.ts

import { useState, useEffect, useCallback } from "react";
import { backendClient } from "@/lib/backend-client";
import { saveIFlowConfiguration } from "../utils/IFlowHelpers";

// Types
interface ConfigurationParameter {
  ParameterKey: string;
  ParameterValue: string;
  DataType: string;
  Description?: string;
  Mandatory?: boolean;
}

interface IFlowConfiguration {
  iflowId: string;
  iflowName: string;
  packageId: string;
  packageName: string;
  version: string;
  parameters: ConfigurationParameter[];
}

interface ParameterCategory {
  name: string;
  icon: React.ComponentType<any>;
  parameters: ConfigurationParameter[];
  iflowId: string;
}

export const useStage3Configuration = (data: any) => {
  // CORE STATE
  const [iflowConfigurations, setIFlowConfigurations] = useState<IFlowConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState("development");
  const [configurationChanges, setConfigurationChanges] = useState<Record<string, Record<string, string>>>({});
  const [selectedIFlowId, setSelectedIFlowId] = useState<string | null>(null);
  const [maskedFields, setMaskedFields] = useState<Set<string>>(new Set());
  const [parametersNeedingAttention] = useState(3);

  // SEARCH & FILTERING STATE
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDataType, setFilterDataType] = useState("all");
  const [showEmptyOnly, setShowEmptyOnly] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [filterMandatoryOnly, setFilterMandatoryOnly] = useState(false);
  const [filterModifiedOnly, setFilterModifiedOnly] = useState(false);

  // EXPORT/IMPORT STATE
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const [importFile, setImportFile] = useState<File | null>(null);

  // DATA TYPES FOR FILTERING
  const dataTypes = ["all", "xsd:string", "secureParameter", "xsd:int", "xsd:boolean"];

  // LOAD CONFIGURATIONS
  const loadConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading configurations with data:', data);

      if (!data.selectedIFlows || data.selectedIFlows.length === 0) {
        setError("No integration flows selected. Please go back and select iFlows.");
        setLoading(false);
        return;
      }

      // Check if we have iflowDetails (full objects) or just selectedIFlows (IDs)
      let iflowObjects = [];
      
      if (data.iflowDetails && Array.isArray(data.iflowDetails)) {
        // We have full iFlow objects from Stage 2
        iflowObjects = data.iflowDetails;
        console.log('✅ Using iflowDetails from Stage 2:', iflowObjects);
      } else if (data.selectedIFlows && Array.isArray(data.selectedIFlows)) {
        // We only have IDs, need to create mock objects
        console.log('⚠️ Only have selectedIFlows IDs, creating mock objects:', data.selectedIFlows);
        iflowObjects = data.selectedIFlows.map((iflowId: string) => ({
          id: iflowId,
          name: `Integration Flow ${iflowId}`,
          packageId: `PKG_${iflowId.slice(-3)}`,
          packageName: `Package for ${iflowId}`,
          version: "1.0.0",
          description: `Mock iFlow for ${iflowId}`,
          status: "active",
          lastModified: new Date().toISOString(),
          author: "SAP User",
          type: "integration flow"
        }));
      } else {
        setError("Invalid data structure received from previous stage.");
        setLoading(false);
        return;
      }

      // Transform to IFlowConfiguration format
      const configurations: IFlowConfiguration[] = iflowObjects.map((iflow: any) => ({
        iflowId: iflow.id,
        iflowName: iflow.name,
        packageId: iflow.packageId || "UNKNOWN_PKG",
        packageName: iflow.packageName || `Package ${iflow.packageId || "Unknown"}`,
        version: iflow.version || "1.0.0",
        parameters: generateMockParameters(iflow.id, iflow.name),
      }));

      console.log('✅ Generated configurations:', configurations);
      setIFlowConfigurations(configurations);
      setLoading(false);
    } catch (err) {
      console.error("❌ Failed to load configurations:", err);
      setError("Failed to load configuration parameters");
      setLoading(false);
    }
  }, [data]);

  // GENERATE MOCK PARAMETERS (Replace with real SAP API call)
  const generateMockParameters = (iflowId: string, iflowName: string): ConfigurationParameter[] => {
    return [
      {
        ParameterKey: "ServiceURL",
        ParameterValue: `https://api.example.com/${iflowId}`,
        DataType: "xsd:string",
        Description: "Service endpoint URL",
        Mandatory: true,
      },
      {
        ParameterKey: "Username",
        ParameterValue: "",
        DataType: "xsd:string", 
        Description: "Authentication username",
        Mandatory: true,
      },
      {
        ParameterKey: "Password",
        ParameterValue: "",
        DataType: "secureParameter",
        Description: "Authentication password",
        Mandatory: true,
      },
      {
        ParameterKey: "Timeout",
        ParameterValue: "30000",
        DataType: "xsd:int",
        Description: "Connection timeout in milliseconds",
        Mandatory: false,
      },
      {
        ParameterKey: "EnableRetry",
        ParameterValue: "true",
        DataType: "xsd:boolean",
        Description: "Enable automatic retry on failure",
        Mandatory: false,
      },
    ];
  };

  // GET SELECTED IFLOW
  const getSelectedIFlow = useCallback((): IFlowConfiguration | null => {
    return iflowConfigurations.find(iflow => iflow.iflowId === selectedIFlowId) || null;
  }, [iflowConfigurations, selectedIFlowId]);

  // GET PARAMETER VALUE
  const getParameterValue = useCallback((param: ConfigurationParameter, iflowId: string): string => {
    const userValue = configurationChanges[iflowId]?.[param.ParameterKey];
    return userValue !== undefined ? userValue : param.ParameterValue;
  }, [configurationChanges]);

  // HANDLE PARAMETER CHANGE
  const handleParameterChange = useCallback((iflowId: string, paramKey: string, value: string) => {
    setConfigurationChanges(prev => ({
      ...prev,
      [iflowId]: {
        ...prev[iflowId],
        [paramKey]: value
      }
    }));
  }, []);

  // HANDLE ENVIRONMENT CHANGE
  const handleEnvironmentChange = useCallback((environmentId: string) => {
    setSelectedEnvironment(environmentId);
  }, []);

  // CATEGORIZE PARAMETERS
  const categorizeParameters = useCallback((iflow: IFlowConfiguration): ParameterCategory[] => {
    const categories: ParameterCategory[] = [
      {
        name: "Authentication",
        icon: require('lucide-react').Shield,
        parameters: [],
        iflowId: iflow.iflowId,
      },
      {
        name: "Connection Settings",
        icon: require('lucide-react').Database,
        parameters: [],
        iflowId: iflow.iflowId,
      },
      {
        name: "Security Parameters",
        icon: require('lucide-react').Lock,
        parameters: [],
        iflowId: iflow.iflowId,
      },
      {
        name: "General Configuration",
        icon: require('lucide-react').Settings,
        parameters: [],
        iflowId: iflow.iflowId,
      },
    ];

    // Categorize parameters based on their key names
    iflow.parameters.forEach(param => {
      if (param.ParameterKey.toLowerCase().includes('user') || 
          param.ParameterKey.toLowerCase().includes('password') ||
          param.ParameterKey.toLowerCase().includes('auth')) {
        categories[0].parameters.push(param);
      } else if (param.ParameterKey.toLowerCase().includes('url') || 
                 param.ParameterKey.toLowerCase().includes('timeout') ||
                 param.ParameterKey.toLowerCase().includes('connection')) {
        categories[1].parameters.push(param);
      } else if (param.DataType === 'secureParameter' || 
                 param.ParameterKey.toLowerCase().includes('key') ||
                 param.ParameterKey.toLowerCase().includes('secret')) {
        categories[2].parameters.push(param);
      } else {
        categories[3].parameters.push(param);
      }
    });

    return categories.filter(category => category.parameters.length > 0);
  }, []);

  // GET FILTERED PARAMETERS
  const getFilteredParameters = useCallback((categories: ParameterCategory[]): ParameterCategory[] => {
    return categories.map(category => {
      let filteredParams = category.parameters;

      // Apply search filter
      if (searchQuery) {
        filteredParams = filteredParams.filter(param =>
          param.ParameterKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (param.Description && param.Description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      // Apply data type filter
      if (filterDataType !== "all") {
        filteredParams = filteredParams.filter(param => param.DataType === filterDataType);
      }

      // Apply empty only filter
      if (showEmptyOnly) {
        filteredParams = filteredParams.filter(param => {
          const currentValue = getParameterValue(param, category.iflowId);
          return !currentValue || currentValue.trim() === "";
        });
      }

      // Apply mandatory only filter
      if (filterMandatoryOnly) {
        filteredParams = filteredParams.filter(param => param.Mandatory === true);
      }

      // Apply modified only filter
      if (filterModifiedOnly) {
        filteredParams = filteredParams.filter(param => {
          const userValue = configurationChanges[category.iflowId]?.[param.ParameterKey];
          return userValue !== undefined && userValue !== param.ParameterValue;
        });
      }

      return {
        ...category,
        parameters: filteredParams
      };
    }).filter(category => category.parameters.length > 0);
  }, [searchQuery, filterDataType, showEmptyOnly, filterMandatoryOnly, filterModifiedOnly, configurationChanges, getParameterValue]);

  // CATEGORY MANAGEMENT
  const toggleCategory = useCallback((categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  }, [expandedCategories]);

  const isCategoryExpanded = useCallback((categoryKey: string): boolean => {
    return expandedCategories.has(categoryKey);
  }, [expandedCategories]);

  // SAVE CONFIGURATIONS
  const saveConfigurations = useCallback(async (isAutoSave: boolean = false) => {
    try {
      setSaving(true);
      setError(null);

      const selectedIFlow = getSelectedIFlow();
      if (!selectedIFlow) {
        setError("No integration flow selected");
        return;
      }

      // Prepare parameters for saving
      const parametersToSave = selectedIFlow.parameters.map(param => ({
        parameterName: param.ParameterKey,
        parameterValue: getParameterValue(param, selectedIFlow.iflowId),
      }));

      // Save to backend
      const success = await saveIFlowConfiguration(
        selectedIFlow.packageName,
        selectedIFlow.iflowName,
        selectedIFlow.version,
        parametersToSave
      );

      if (success) {
        if (!isAutoSave) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } else {
        setError("Failed to save configuration");
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error("Save failed:", error);
      setError("Failed to save configuration");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  }, [getSelectedIFlow, getParameterValue]);

  // EXPORT FUNCTIONALITY
  const handleExportConfigurations = useCallback(async () => {
    try {
      const selectedIFlow = getSelectedIFlow();
      if (!selectedIFlow) return;

      const exportData = {
        timestamp: new Date().toISOString(),
        environment: selectedEnvironment,
        iflow: {
          id: selectedIFlow.iflowId,
          name: selectedIFlow.iflowName,
          packageName: selectedIFlow.packageName,
          version: selectedIFlow.version,
        },
        parameters: selectedIFlow.parameters.map(param => ({
          key: param.ParameterKey,
          value: getParameterValue(param, selectedIFlow.iflowId),
          dataType: param.DataType,
          mandatory: param.Mandatory,
          description: param.Description,
          isModified: configurationChanges[selectedIFlow.iflowId]?.[param.ParameterKey] !== undefined,
        }))
      };

      let content: string;
      let mimeType: string;
      let filename: string;

      switch (exportFormat) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          filename = `${selectedIFlow.iflowName}_config_${selectedEnvironment}.json`;
          break;
        case 'csv':
          const csvHeaders = 'Parameter Key,Parameter Value,Data Type,Mandatory,Description,Modified\n';
          const csvRows = exportData.parameters.map(param => 
            `"${param.key}","${param.value}","${param.dataType}","${param.mandatory}","${param.description || ''}","${param.isModified}"`
          ).join('\n');
          content = csvHeaders + csvRows;
          mimeType = 'text/csv';
          filename = `${selectedIFlow.iflowName}_config_${selectedEnvironment}.csv`;
          break;
        case 'xml':
          content = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <metadata>
    <timestamp>${exportData.timestamp}</timestamp>
    <environment>${exportData.environment}</environment>
    <iflow id="${exportData.iflow.id}" name="${exportData.iflow.name}" package="${exportData.iflow.packageName}" version="${exportData.iflow.version}" />
  </metadata>
  <parameters>
${exportData.parameters.map(param => `    <parameter key="${param.key}" dataType="${param.dataType}" mandatory="${param.mandatory}" modified="${param.isModified}">
      <value>${param.value}</value>
      <description>${param.description || ''}</description>
    </parameter>`).join('\n')}
  </parameters>
</configuration>`;
          mimeType = 'application/xml';
          filename = `${selectedIFlow.iflowName}_config_${selectedEnvironment}.xml`;
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportDialogOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export configuration');
      setTimeout(() => setError(null), 5000);
    }
  }, [getSelectedIFlow, selectedEnvironment, exportFormat, configurationChanges, getParameterValue]);

  // IMPORT FUNCTIONALITY
  const handleImportConfigurations = useCallback(async () => {
    if (!importFile) return;

    try {
      const selectedIFlow = getSelectedIFlow();
      if (!selectedIFlow) return;

      const text = await importFile.text();
      let importData: any;

      if (importFile.name.endsWith('.json')) {
        importData = JSON.parse(text);
      } else if (importFile.name.endsWith('.csv')) {
        const lines = text.split('\n');
        importData = {
          parameters: lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, ''));
            return {
              key: values[0],
              value: values[1],
              dataType: values[2],
              mandatory: values[3] === 'true',
              description: values[5]
            };
          })
        };
      } else {
        throw new Error('Unsupported file format');
      }

      const newChanges: Record<string, string> = {};
      importData.parameters.forEach((param: any) => {
        if (selectedIFlow.parameters.some(p => p.ParameterKey === param.key)) {
          newChanges[param.key] = param.value;
        }
      });

      setConfigurationChanges(prev => ({
        ...prev,
        [selectedIFlow.iflowId]: {
          ...prev[selectedIFlow.iflowId],
          ...newChanges
        }
      }));

      setImportDialogOpen(false);
      setImportFile(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Import failed:', error);
      setError('Failed to import configuration');
      setTimeout(() => setError(null), 5000);
    }
  }, [importFile, getSelectedIFlow]);

  // RESET FUNCTIONALITY
  const handleResetAllToDefault = useCallback(() => {
    const selectedIFlow = getSelectedIFlow();
    if (!selectedIFlow) return;

    setConfigurationChanges(prev => ({
      ...prev,
      [selectedIFlow.iflowId]: {}
    }));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }, [getSelectedIFlow]);

  // CLEAR ALL FILTERS
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setFilterDataType('all');
    setShowEmptyOnly(false);
    setFilterMandatoryOnly(false);
    setFilterModifiedOnly(false);
    setAdvancedSearchOpen(false);
  }, []);

  // EFFECTS
  useEffect(() => {
    loadConfigurations();
  }, [loadConfigurations]);

  useEffect(() => {
    if (iflowConfigurations.length > 0 && !selectedIFlowId) {
      setSelectedIFlowId(iflowConfigurations[0].iflowId);
      // Auto-expand all categories initially
      const allCategories = categorizeParameters(iflowConfigurations[0]).map(cat => 
        `${iflowConfigurations[0].iflowId}-${cat.name}`
      );
      setExpandedCategories(new Set(allCategories));
    }
  }, [iflowConfigurations, selectedIFlowId, categorizeParameters]);

  useEffect(() => {
    if (autoSave) {
      const interval = setInterval(() => {
        saveConfigurations(true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoSave, saveConfigurations]);

  // Return all state and functions
  return {
    // Core state
    iflowConfigurations,
    loading,
    saving,
    error,
    saveSuccess,
    selectedEnvironment,
    configurationChanges,
    selectedIFlowId,
    maskedFields,
    parametersNeedingAttention,
    dataTypes,
    
    // Search & Filter state
    searchQuery,
    filterDataType,
    showEmptyOnly,
    autoSave,
    expandedCategories,
    advancedSearchOpen,
    filterMandatoryOnly,
    filterModifiedOnly,
    
    // Export/Import state
    exportDialogOpen,
    importDialogOpen,
    exportFormat,
    importFile,
    
    // Setters
    setSelectedEnvironment,
    setSelectedIFlowId,
    setSearchQuery,
    setFilterDataType,
    setShowEmptyOnly,
    setAutoSave,
    setAdvancedSearchOpen,
    setFilterMandatoryOnly,
    setFilterModifiedOnly,
    setExportDialogOpen,
    setImportDialogOpen,
    setExportFormat,
    setImportFile,
    setMaskedFields,
    
    // Functions
    loadConfigurations,
    saveConfigurations,
    handleParameterChange,
    handleEnvironmentChange,
    toggleCategory,
    isCategoryExpanded,
    getSelectedIFlow,
    getParameterValue,
    categorizeParameters,
    getFilteredParameters,
    handleExportConfigurations,
    handleImportConfigurations,
    handleResetAllToDefault,
    clearAllFilters,
  };
};