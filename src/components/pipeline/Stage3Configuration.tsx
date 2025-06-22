import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Upload,
  Key,
  Lock,
  Shield,
  Database,
  GitCompare,
  AlertTriangle,
} from "lucide-react";
import { backendClient } from "@/lib/backend-client";

// INTERFACES
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
  version: string;
  parameters: ConfigurationParameter[];
}

interface Stage3Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface ParameterCategory {
  name: string;
  icon: React.ComponentType<any>;
  parameters: ConfigurationParameter[];
  iflowId: string;
}

interface EnvironmentStatus {
  id: string;
  name: string;
  configured: number;
  pending: number;
  total: number;
  health: 'healthy' | 'warning' | 'error';
  isLive?: boolean;
}

const Stage3Configuration: React.FC<Stage3Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
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

  // PHASE 2: ENHANCED SEARCH & FILTERING STATE
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDataType, setFilterDataType] = useState("all");
  const [showEmptyOnly, setShowEmptyOnly] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [filterMandatoryOnly, setFilterMandatoryOnly] = useState(false);
  const [filterModifiedOnly, setFilterModifiedOnly] = useState(false);

  // PHASE 2: EXPORT/IMPORT STATE
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const [importFile, setImportFile] = useState<File | null>(null);
  
  
  // CONFIGURATION DATA
  const environments: EnvironmentStatus[] = [
    {
      id: "development",
      name: "Development",
      configured: 24,
      pending: 3,
      total: 27,
      health: 'healthy'
    },
    {
      id: "testing",
      name: "Testing", 
      configured: 20,
      pending: 7,
      total: 27,
      health: 'warning'
    },
    {
      id: "staging",
      name: "Staging",
      configured: 25,
      pending: 2,
      total: 27,
      health: 'healthy'
    },
    {
      id: "production",
      name: "Production",
      configured: 27,
      pending: 0,
      total: 27,
      health: 'healthy',
      isLive: true
    },
  ];
  useEffect(() => {
  console.log('🔍 Filters changed:', {
    searchQuery,
    filterDataType,
    showEmptyOnly,
    filterMandatoryOnly,
    filterModifiedOnly
  });
}, [searchQuery, filterDataType, showEmptyOnly, filterMandatoryOnly, filterModifiedOnly]);
  const dataTypes = ["all", "xsd:string", "secureParameter", "xsd:int", "xsd:boolean"];

  // EFFECTS
  useEffect(() => {
    loadConfigurations();
  }, [data.selectedIFlows]);

  useEffect(() => {
    if (iflowConfigurations.length > 0 && !selectedIFlowId) {
      setSelectedIFlowId(iflowConfigurations[0].iflowId);
      // Auto-expand all categories initially
      const allCategories = categorizeParameters(iflowConfigurations[0]).map(cat => 
        `${iflowConfigurations[0].iflowId}-${cat.name}`
      );
      setExpandedCategories(new Set(allCategories));
    }
  }, [iflowConfigurations]);

  useEffect(() => {
    if (autoSave) {
      const interval = setInterval(() => {
        saveConfigurations(true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoSave, configurationChanges]);

  // CORE FUNCTIONS
  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!data.selectedIFlows || data.selectedIFlows.length === 0) {
        setError("No integration flows selected. Please go back and select iFlows.");
        setIFlowConfigurations([]);
        return;
      }

      console.log("🔄 Loading configurations for iFlows:", data.selectedIFlows);

      const configPromises = data.selectedIFlows.map(async (iflowId: string) => {
        try {
          // Find the iflow details to get version and name
          const iflowDetails = data.iflowDetails?.find(
            (iflow: any) => iflow.id === iflowId || iflow.Id === iflowId,
          );

          const iflowVersion = iflowDetails?.version || iflowDetails?.Version || "active";
          const iflowName = iflowDetails?.name || iflowDetails?.Name || `iFlow ${iflowId}`;

          console.log(`Loading configuration for ${iflowId} (${iflowName}) version ${iflowVersion}`);

          // Call backend API to get configuration parameters
          const response = await fetch(
            `http://localhost:8000/api/sap/iflows/${iflowId}/configurations?version=${iflowVersion}`
          );

          console.log(`🔍 API Response status for ${iflowId}:`, response.status);

          if (!response.ok) {
            console.warn(`Failed to load configuration for ${iflowId}: ${response.status}`);
            return {
              iflowId,
              iflowName,
              version: iflowVersion,
              parameters: [],
              environments: [],
            };
          }

          const result = await response.json();
          console.log(`🔍 RAW API Response for ${iflowId}:`, result);

          if (!result.success) {
            console.error(`❌ API returned error for ${iflowId}:`, result.message);
            return {
              iflowId,
              iflowName,
              version: iflowVersion,
              parameters: [],
              environments: [],
            };
          }

          // Extract parameters directly - use the raw data array
          const parameters = result.data || [];
          console.log(`🔍 Extracted ${parameters.length} parameters for ${iflowId}:`, parameters);

          return {
            iflowId,
            iflowName,
            version: iflowVersion,
            parameters,
            environments: [],
          };

        } catch (error) {
          console.error(`❌ Error loading configuration for ${iflowId}:`, error);
          
          const iflowDetails = data.iflowDetails?.find(
            (iflow: any) => iflow.id === iflowId || iflow.Id === iflowId,
          );

          return {
            iflowId,
            iflowName: iflowDetails?.name || iflowDetails?.Name || `iFlow ${iflowId}`,
            version: iflowDetails?.version || iflowDetails?.Version || "active",
            parameters: [],
            environments: [],
          };
        }
      });

      const configs = await Promise.all(configPromises);
      
      console.log("🔍 Final configurations loaded:", configs);
      configs.forEach((config, index) => {
        console.log(`Config ${index + 1}: ${config.iflowName} (${config.iflowId}) has ${config.parameters.length} parameters`);
      });
      
      setIFlowConfigurations(configs);

    } catch (error) {
      console.error("❌ Failed to load configurations:", error);
      setError("Failed to load configuration parameters from SAP tenant");
      setIFlowConfigurations([]);
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = useCallback((
    iflowId: string,
    parameterKey: string,
    value: string,
  ) => {
    console.log(`🔄 Updating configuration: ${iflowId}.${parameterKey} = "${value}"`);
    
    setConfigurationChanges((prev) => ({
      ...prev,
      [iflowId]: {
        ...prev[iflowId],
        [parameterKey]: value,
      },
    }));
    setSaveSuccess(false);
    
    if (autoSave) {
      setTimeout(() => saveConfigurations(true), 1000);
    }
  }, [autoSave]);

  const saveConfigurations = async (isAutoSave: boolean = false) => {
    if (!isAutoSave) setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const configurationData = {
        environment: selectedEnvironment,
        timestamp: new Date().toISOString(),
        iflows: iflowConfigurations.map((config) => {
          const allConfigurations: Record<string, string> = {};
          
          config.parameters.forEach((param) => {
            if (param.ParameterValue && param.ParameterValue.trim() !== "") {
              allConfigurations[param.ParameterKey] = param.ParameterValue;
            }
          });
          
          const userChanges = configurationChanges[config.iflowId] || {};
          Object.keys(userChanges).forEach((paramKey) => {
            if (userChanges[paramKey] && userChanges[paramKey].trim() !== "") {
              allConfigurations[paramKey] = userChanges[paramKey];
            }
          });

          console.log(`📝 iFlow ${config.iflowId}: Saving ${Object.keys(allConfigurations).length} parameters`);

          return {
            iflowId: config.iflowId,
            iflowName: config.iflowName,
            version: config.version,
            configurations: allConfigurations,
          };
        }),
      };

      const totalConfigs = configurationData.iflows.reduce((sum, iflow) => 
        sum + Object.keys(iflow.configurations).length, 0
      );
      console.log(`💾 Total configurations being saved: ${totalConfigs}`);

      const response = await fetch(`${backendClient.getBaseUrl()}/api/save-iflow-configurations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configurationData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save configurations: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSaveSuccess(true);
        
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
        
        if (!isAutoSave) {
          console.log("✅ Configurations saved successfully:", result.data);
          console.log(`✅ Saved ${result.data.total_parameters} parameters to ${result.data.filename}`);
        }
      } else {
        throw new Error(result.message || "Failed to save configurations");
      }

    } catch (error: any) {
      console.error("❌ Failed to save configurations:", error);
      setError(
        `Failed to save configurations: ${error.message || 'Unknown error'}`
      );
      
      setTimeout(() => {
        setError(null);
      }, 5000);
      
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  // HELPER FUNCTIONS
  const categorizeParameters = (iflow: IFlowConfiguration): ParameterCategory[] => {
    const categories: ParameterCategory[] = [];
    
    const authParams = iflow.parameters.filter(p => 
      p.ParameterKey.toLowerCase().includes('credential') ||
      p.ParameterKey.toLowerCase().includes('logon') ||
      p.ParameterKey.toLowerCase().includes('auth')
    );
    if (authParams.length > 0) {
      categories.push({
        name: 'Authentication',
        icon: Key,
        parameters: authParams,
        iflowId: iflow.iflowId
      });
    }

    const securityParams = iflow.parameters.filter(p => 
      p.DataType === 'secureParameter' ||
      p.ParameterKey.toLowerCase().includes('key') ||
      p.ParameterKey.toLowerCase().includes('alias') ||
      p.ParameterKey.toLowerCase().includes('certificate')
    );
    if (securityParams.length > 0) {
      categories.push({
        name: 'Security',
        icon: Shield,
        parameters: securityParams,
        iflowId: iflow.iflowId
      });
    }

    const configParams = iflow.parameters.filter(p => 
      !authParams.includes(p) && !securityParams.includes(p)
    );
    if (configParams.length > 0) {
      categories.push({
        name: 'Configuration',
        icon: Settings,
        parameters: configParams,
        iflowId: iflow.iflowId
      });
    }

    return categories;
  };

  const handleEnvironmentChange = (environment: string) => {
    setSelectedEnvironment(environment);
    if (data.configurations && data.configurations[environment]) {
      setConfigurationChanges(data.configurations[environment].configurations || {});
    } else {
      setConfigurationChanges({});
    }
  };
  
  const handleNext = () => {
    const environmentConfigs = {
      environment: selectedEnvironment,
      configurations: configurationChanges,
      timestamp: new Date().toISOString(),
    };

    onComplete({
      ...data,
      configurations: {
        ...data.configurations,
        [selectedEnvironment]: environmentConfigs,
      },
      currentEnvironmentConfigs: environmentConfigs,
    });

    onNext();
  };

  const parameterNeedsAttention = (param: ConfigurationParameter, iflowId: string): boolean => {
    const currentValue = configurationChanges[iflowId]?.[param.ParameterKey] || param.ParameterValue;
    return param.Mandatory && (!currentValue || currentValue.trim() === "");
  };

  const getParameterValue = (param: ConfigurationParameter, iflowId: string): string => {
    const userValue = configurationChanges[iflowId]?.[param.ParameterKey];
    if (userValue !== undefined) {
      return userValue;
    }
    return param.ParameterValue || "";
  };

  const getSelectedIFlow = (): IFlowConfiguration | null => {
    return iflowConfigurations.find(iflow => iflow.iflowId === selectedIFlowId) || null;
  };

  // PHASE 2: ENHANCED FILTERING - FIXED
  const getFilteredParameters = (categories: ParameterCategory[]): ParameterCategory[] => {
    return categories.map(category => {
      let filteredParams = [...category.parameters]; // Create a copy

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredParams = filteredParams.filter(param =>
          param.ParameterKey.toLowerCase().includes(query) ||
          (param.Description || '').toLowerCase().includes(query) ||
          param.DataType.toLowerCase().includes(query)
        );
      }

      // Apply data type filter
      if (filterDataType !== 'all') {
        filteredParams = filteredParams.filter(param => param.DataType === filterDataType);
      }

      // Apply empty values filter
      if (showEmptyOnly) {
        filteredParams = filteredParams.filter(param => {
          const currentValue = getParameterValue(param, category.iflowId);
          return !currentValue || currentValue.trim() === '';
        });
      }

      // Apply mandatory filter
      if (filterMandatoryOnly) {
        filteredParams = filteredParams.filter(param => param.Mandatory === true);
      }

      // Apply modified filter
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
  };

  // PHASE 2: CATEGORY MANAGEMENT
  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const isCategoryExpanded = (categoryKey: string): boolean => {
    return expandedCategories.has(categoryKey);
  };

  // PHASE 2: EXPORT FUNCTIONALITY
  const handleExportConfigurations = async () => {
    try {
      const selectedIFlow = getSelectedIFlow();
      if (!selectedIFlow) return;

      const exportData = {
        timestamp: new Date().toISOString(),
        environment: selectedEnvironment,
        iflow: {
          id: selectedIFlow.iflowId,
          name: selectedIFlow.iflowName,
          version: selectedIFlow.version,
        },
        parameters: selectedIFlow.parameters.map(param => ({
          key: param.ParameterKey,
          value: getParameterValue(param, selectedIFlow.iflowId),
          dataType: param.DataType,
          mandatory: param.Mandatory,
          description: param.Description,
          isModified: configurationChanges[selectedIFlow.iflowId]?.[param.ParameterKey] !== undefined
        }))
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          filename = `${selectedIFlow.iflowId}_${selectedEnvironment}_config.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          const csvHeaders = 'Parameter Key,Current Value,Data Type,Mandatory,Modified,Description\n';
          const csvRows = exportData.parameters.map(param => 
            `"${param.key}","${param.value}","${param.dataType}","${param.mandatory}","${param.isModified}","${param.description || ''}"`
          ).join('\n');
          content = csvHeaders + csvRows;
          filename = `${selectedIFlow.iflowId}_${selectedEnvironment}_config.csv`;
          mimeType = 'text/csv';
          break;
        case 'xml':
          content = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <metadata>
    <timestamp>${exportData.timestamp}</timestamp>
    <environment>${exportData.environment}</environment>
    <iflow id="${exportData.iflow.id}" name="${exportData.iflow.name}" version="${exportData.iflow.version}"/>
  </metadata>
  <parameters>
${exportData.parameters.map(param => `    <parameter key="${param.key}" dataType="${param.dataType}" mandatory="${param.mandatory}" modified="${param.isModified}">
      <value>${param.value}</value>
      <description>${param.description || ''}</description>
    </parameter>`).join('\n')}
  </parameters>
</configuration>`;
          filename = `${selectedIFlow.iflowId}_${selectedEnvironment}_config.xml`;
          mimeType = 'application/xml';
          break;
      }

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
  };

  // PHASE 2: IMPORT FUNCTIONALITY
  const handleImportConfigurations = async () => {
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
  };

  // PHASE 2: RESET FUNCTIONALITY
  const handleResetAllToDefault = () => {
    const selectedIFlow = getSelectedIFlow();
    if (!selectedIFlow) return;

    setConfigurationChanges(prev => ({
      ...prev,
      [selectedIFlow.iflowId]: {}
    }));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const clearAllFilters = () => {
    console.log('🧹 Clearing all filters');
    setSearchQuery('');
    setFilterDataType('all');
    setShowEmptyOnly(false);
    setFilterMandatoryOnly(false);
    setFilterModifiedOnly(false);
    setAdvancedSearchOpen(false);
  };

  // LOADING STATE
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            Loading configuration parameters from SAP Integration Suite...
          </p>
        </CardContent>
      </Card>
    );
  }

  // COMPONENT RENDER
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
                Configuration Management
              </h2>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">System Healthy</span>
              </div>
            </div>
            <p className="text-gray-600 mt-1">
              Configure environment-specific parameters for integration flows
            </p>
          </div>
          {parametersNeedingAttention > 0 && (
            <div className="flex items-center space-x-2 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{parametersNeedingAttention} parameters need attention</span>
            </div>
          )}
        </div>
        <Badge variant="outline" className="text-sm">
          Step 3 of 8
        </Badge>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* ENHANCED CONFIGURATION TOOLS */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-4">
            {/* Main Search and Filter Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search parameters, descriptions, or data types..."
                    value={searchQuery}
                    onChange={(e) => {
                      console.log('🔍 Search query changed:', e.target.value);
                      setSearchQuery(e.target.value);
                    }}
                    className="pl-9 w-80"
                  />
                </div>
                <Select value={filterDataType} onValueChange={(value) => {
                  console.log('📊 Data type filter changed:', value);
                  setFilterDataType(value);
                }}></Select>
                
                {/* <Select value={filterDataType} onValueChange={setFilterDataType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Data Types" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "all" ? "All Data Types" : type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Advanced</span>
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log('🔄 Reset Filters clicked');
                    clearAllFilters();
                  }}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Filters</span>
                </Button>
              </div>
            </div>

            {/* Advanced Filters (Collapsible) */}
            {advancedSearchOpen && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch checked={showEmptyOnly} onCheckedChange={setShowEmptyOnly} />
                    <Label className="text-sm">Empty Values Only</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch checked={filterMandatoryOnly} onCheckedChange={setFilterMandatoryOnly} />
                    <Label className="text-sm">Mandatory Only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch checked={filterModifiedOnly} onCheckedChange={setFilterModifiedOnly} />
                    <Label className="text-sm">Modified Only</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                    <Label className="text-sm">Auto-save</Label>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setExportDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Config</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setImportDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Config</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetAllToDefault}
                >
                  Reset All to Default
                </Button>
              </div>

              <div className="text-sm text-gray-500">
                {getSelectedIFlow() ? `${getFilteredParameters(categorizeParameters(getSelectedIFlow()!)).reduce((sum, cat) => sum + cat.parameters.length, 0)} parameters shown` : '0 parameters'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ENVIRONMENT STATUS LINE */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Configure environment-specific parameters for integration flows</span>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>4 configured</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>3 pending</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-gray-400" />
            <span>Last saved 2 min ago</span>
          </div>
        </div>
      </div>

      {/* ENVIRONMENTS SECTION */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <CardTitle>Environments</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <GitCompare className="w-4 h-4" />
                <span>Compare Environments</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ArrowRight className="w-4 h-4" />
                <span>Sync to Production</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {environments.map((env) => (
              <div
                key={env.id}
                onClick={() => handleEnvironmentChange(env.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedEnvironment === env.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-sm">{env.name}</span>
                    {env.isLive && <Badge variant="destructive" className="text-xs">Live</Badge>}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    env.health === 'healthy' ? 'bg-green-500' : 
                    env.health === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div className="text-xs text-gray-500">
                  {env.configured} configured, {env.pending} pending
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TWO-PANEL LAYOUT - INTEGRATION FLOWS */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel: Integration Flows List */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Integration Flows</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {iflowConfigurations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No integration flows found</p>
                  <p className="text-sm text-gray-400">
                    Please select integration flows in the previous step
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {iflowConfigurations.map((iflow) => (
                    <div
                      key={iflow.iflowId}
                      onClick={() => setSelectedIFlowId(iflow.iflowId)}
                      className={`p-4 border-l-4 cursor-pointer transition-all hover:bg-gray-50 ${
                        selectedIFlowId === iflow.iflowId
                          ? 'border-l-blue-500 bg-blue-50'
                          : 'border-l-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-sm text-gray-900">{iflow.iflowName}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {iflow.version} • {iflow.parameters.length} params
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {iflow.iflowId}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Configuration Parameters */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Configuration Parameters</CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {getSelectedIFlow()?.parameters.length || 0} parameters
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!getSelectedIFlow() ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select an integration flow to configure parameters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const selectedIFlow = getSelectedIFlow()!;
                    const filteredCategories = getFilteredParameters(categorizeParameters(selectedIFlow));

                    return filteredCategories.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No parameters match your current filters</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={clearAllFilters}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    ) : (
                      filteredCategories.map((category) => {
                        const categoryKey = `${selectedIFlow.iflowId}-${category.name}`;
                        const isExpanded = isCategoryExpanded(categoryKey);
                        
                        return (
                          <div key={category.name} className="border rounded-lg">
                            {/* Collapsible Category Header */}
                            <div 
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b"
                              onClick={() => toggleCategory(categoryKey)}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                                  <category.icon className="w-4 h-4 text-gray-600" />
                                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {category.parameters.length} parameters
                                </Badge>
                                {category.parameters.some(p => parameterNeedsAttention(p, selectedIFlow.iflowId)) && (
                                  <Badge variant="destructive" className="text-xs">
                                    Needs Attention
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                {category.parameters.filter(p => {
                                  const userValue = configurationChanges[selectedIFlow.iflowId]?.[p.ParameterKey];
                                  return userValue !== undefined && userValue !== p.ParameterValue;
                                }).length} modified
                              </div>
                            </div>
                            
                            {/* Collapsible Parameters Content */}
                            {isExpanded && (
                              <div className="p-4 space-y-3">
                                {category.parameters.map((param) => {
                                  const needsAttention = parameterNeedsAttention(param, selectedIFlow.iflowId);
                                  const currentValue = getParameterValue(param, selectedIFlow.iflowId);
                                  const isModified = configurationChanges[selectedIFlow.iflowId]?.[param.ParameterKey] !== undefined;
                                  
                                  return (
                                    <div
                                      key={param.ParameterKey}
                                      className={`grid grid-cols-12 gap-4 p-4 border rounded-lg ${
                                        needsAttention ? 'border-orange-300 bg-orange-50' : 
                                        isModified ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                                      }`}
                                    >
                                      {/* Parameter Name */}
                                      <div className="col-span-4">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <Label className="font-medium text-sm">{param.ParameterKey}</Label>
                                          {needsAttention && (
                                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                                          )}
                                          {isModified && (
                                            <Badge variant="outline" className="text-xs">Modified</Badge>
                                          )}
                                          {param.Mandatory && (
                                            <Badge variant="destructive" className="text-xs">Required</Badge>
                                          )}
                                          {param.DataType === 'secureParameter' && (
                                            <Lock className="w-3 h-3 text-gray-500" />
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500">{param.DataType}</div>
                                        {param.Description && (
                                          <p className="text-xs text-gray-500 mt-1">{param.Description}</p>
                                        )}
                                      </div>
                                      
                                      {/* Current Value - Enhanced Editable Field */}
                                      <div className="col-span-4">
                                        <Label className="text-xs text-gray-500 mb-1 block">Current Value</Label>
                                        {needsAttention ? (
                                          <Input
                                            value={currentValue}
                                            onChange={(e) => updateConfiguration(selectedIFlow.iflowId, param.ParameterKey, e.target.value)}
                                            placeholder="Enter parameter value..."
                                            className="border-orange-300 bg-orange-50 text-sm"
                                          />
                                        ) : param.DataType === 'secureParameter' ? (
                                          <div className="relative">
                                            <Input
                                              type={maskedFields.has(`${selectedIFlow.iflowId}-${param.ParameterKey}`) ? "password" : "text"}
                                              value={currentValue}
                                              onChange={(e) => updateConfiguration(selectedIFlow.iflowId, param.ParameterKey, e.target.value)}
                                              placeholder="Enter secure parameter..."
                                              className="text-sm pr-8"
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="absolute right-1 top-1 h-6 w-6 p-0"
                                              onClick={() => {
                                                const fieldId = `${selectedIFlow.iflowId}-${param.ParameterKey}`;
                                                const newMasked = new Set(maskedFields);
                                                if (newMasked.has(fieldId)) {
                                                  newMasked.delete(fieldId);
                                                } else {
                                                  newMasked.add(fieldId);
                                                }
                                                setMaskedFields(newMasked);
                                              }}
                                            >
                                              {maskedFields.has(`${selectedIFlow.iflowId}-${param.ParameterKey}`) ? "👁️" : "🙈"}
                                            </Button>
                                          </div>
                                        ) : param.DataType === 'xsd:boolean' ? (
                                          <Select
                                            value={currentValue || "false"}
                                            onValueChange={(value) => updateConfiguration(selectedIFlow.iflowId, param.ParameterKey, value)}
                                          >
                                            <SelectTrigger className="text-sm">
                                              <SelectValue placeholder="Select value" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="true">TRUE</SelectItem>
                                              <SelectItem value="false">FALSE</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        ) : param.DataType === 'xsd:int' ? (
                                          <Input
                                            type="number"
                                            value={currentValue}
                                            onChange={(e) => updateConfiguration(selectedIFlow.iflowId, param.ParameterKey, e.target.value)}
                                            placeholder="Enter number..."
                                            className="text-sm"
                                          />
                                        ) : (
                                          <Input
                                            value={currentValue}
                                            onChange={(e) => updateConfiguration(selectedIFlow.iflowId, param.ParameterKey, e.target.value)}
                                            placeholder="Enter parameter value..."
                                            className="text-sm"
                                          />
                                        )}
                                      </div>
                                      
                                      {/* Default Value */}
                                      <div className="col-span-3">
                                        <Label className="text-xs text-gray-500 mb-1 block">Default</Label>
                                        <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                                          {param.ParameterValue || "No default"}
                                        </div>
                                      </div>
                                      
                                      {/* Reset Button */}
                                      <div className="col-span-1 flex items-center justify-center">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => updateConfiguration(selectedIFlow.iflowId, param.ParameterKey, param.ParameterValue || "")}
                                          className="w-8 h-8 p-0"
                                          title="Reset to default"
                                        >
                                          🔄
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={onPrevious} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Previous: iFlow Selection</span>
        </Button>

        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => saveConfigurations(false)}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? "Saving..." : "Save Configuration"}</span>
            </Button>

            <Button onClick={handleNext} className="flex items-center space-x-2">
              <span>Next: Design Validation</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Success Notification under Save button */}
          {saveSuccess && (
            <div className="flex items-center space-x-2 text-green-600 text-sm animate-in fade-in duration-300">
              <CheckCircle className="w-4 h-4" />
              <span>✅ Configuration saved successfully!</span>
            </div>
          )}

          {/* Error Notification under Save button */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm animate-in fade-in duration-300">
              <AlertCircle className="w-4 h-4" />
              <span>❌ Failed to save configuration</span>
            </div>
          )}
        </div>
      </div>

      {/* EXPORT DIALOG */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Configuration</DialogTitle>
            <DialogDescription>
              Export the current configuration for {getSelectedIFlow()?.iflowName} in {selectedEnvironment} environment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportConfigurations}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMPORT DIALOG */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Configuration</DialogTitle>
            <DialogDescription>
              Import configuration for {getSelectedIFlow()?.iflowName}. Supported formats: JSON, CSV.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select File</Label>
              <Input
                type="file"
                accept=".json,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
            {importFile && (
              <div className="text-sm text-gray-600">
                Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportDialogOpen(false); setImportFile(null); }}>
              Cancel
            </Button>
            <Button onClick={handleImportConfigurations} disabled={!importFile}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stage3Configuration;