// File Path: src/components/pipeline/Stage3Configuration.tsx
// Filename: Stage3Configuration.tsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Settings,
  Package,
  ChevronDown,
  ChevronRight,
  Database,
} from "lucide-react";

// Import the backend client
import { backendClient } from "@/lib/backend-client";

// Simple interfaces
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

interface PackageGroup {
  packageId: string;
  packageName: string;
  iflows: IFlowConfiguration[];
}

interface Stage3Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
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
  // State
  const [iflowConfigurations, setIFlowConfigurations] = useState<IFlowConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState("development");
  const [selectedIFlowId, setSelectedIFlowId] = useState<string | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [parameterValues, setParameterValues] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Environment configuration
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

  // Generate mock parameters (fallback)
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
    ];
  };

  // Load configurations
  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Stage3 - Loading configurations with data:', data);
      console.log('🔍 Stage3 - data.selectedIFlows:', data.selectedIFlows);
      console.log('🔍 Stage3 - data.iflowDetails:', data.iflowDetails);

      if ((!data.selectedIFlows || data.selectedIFlows.length === 0) && 
          (!data.iflowDetails || data.iflowDetails.length === 0)) {
        setError("No integration flows selected. Please go back and select iFlows.");
        setLoading(false);
        return;
      }

      // Handle different data structures from Stage 2
      let iflowObjects = [];
      
      if (data.iflowDetails && Array.isArray(data.iflowDetails) && data.iflowDetails.length > 0) {
        // We have full iFlow objects from Stage 2
        iflowObjects = data.iflowDetails;
        console.log('✅ Using iflowDetails from Stage 2:', iflowObjects);
      } else if (data.selectedIFlows && Array.isArray(data.selectedIFlows) && data.selectedIFlows.length > 0) {
        // We only have IDs, need to create mock objects
        console.log('⚠️ Only have selectedIFlows IDs, creating mock objects:', data.selectedIFlows);
        iflowObjects = data.selectedIFlows.map((iflowId: string, index: number) => ({
          id: iflowId,
          name: `Integration Flow ${iflowId}`,
          packageId: `PKG_${String(index + 1).padStart(3, '0')}`,
          packageName: `Package ${index + 1}`,
          version: "1.0.0",
          description: `Mock iFlow for ${iflowId}`,
          status: "active",
          lastModified: new Date().toISOString(),
          author: "SAP User",
          type: "integration flow"
        }));
      } else {
        setError("No integration flows found in the data. Please go back and select iFlows.");
        setLoading(false);
        return;
      }

      console.log(`🔄 Loading configurations for ${iflowObjects.length} iFlows...`);

      // Load all configuration parameters for all iFlows in parallel
      const configurationPromises = iflowObjects.map(async (iflow: any) => {
        try {
          console.log(`📡 Loading parameters for iFlow: ${iflow.id} (${iflow.name})`);
          
          // Use existing backend client method to get real parameters
          const parameters = await backendClient.getIFlowConfigurations(iflow.id, iflow.version || "active");
          
          console.log(`✅ Loaded ${parameters.length} parameters for ${iflow.id}`);
          
          // Transform to our parameter format
          const transformedParameters: ConfigurationParameter[] = parameters.map((param: any) => ({
            ParameterKey: param.ParameterKey || param.Key || param.key,
            ParameterValue: param.ParameterValue || param.Value || param.value || "",
            DataType: param.DataType || param.Type || param.dataType || "xsd:string",
            Description: param.Description || param.description || "",
            Mandatory: param.Mandatory || param.mandatory || false,
          }));

          return {
            iflowId: iflow.id,
            iflowName: iflow.name,
            packageId: iflow.packageId || "UNKNOWN_PKG",
            packageName: iflow.packageName || `Package ${iflow.packageId || "Unknown"}`,
            version: iflow.version || "1.0.0",
            parameters: transformedParameters,
          };
        } catch (error) {
          console.error(`❌ Failed to load parameters for ${iflow.id}:`, error);
          
          // Fallback to mock parameters if API fails
          const mockParams = generateMockParameters(iflow.id, iflow.name);
          
          return {
            iflowId: iflow.id,
            iflowName: iflow.name,
            packageId: iflow.packageId || "UNKNOWN_PKG",
            packageName: iflow.packageName || `Package ${iflow.packageId || "Unknown"}`,
            version: iflow.version || "1.0.0",
            parameters: mockParams,
          };
        }
      });

      // Wait for all configuration API calls to complete
      const configurations = await Promise.all(configurationPromises);
      
      console.log(`✅ All configurations loaded:`, configurations);
      setIFlowConfigurations(configurations);
      
      // Auto-select first iFlow
      if (configurations.length > 0) {
        setSelectedIFlowId(configurations[0].iflowId);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("❌ Failed to load configurations:", err);
      setError("Failed to load configuration parameters");
      setLoading(false);
    }
  };

  // Group iFlows by package
  const groupIFlowsByPackage = (): PackageGroup[] => {
    const packageMap = new Map<string, PackageGroup>();

    iflowConfigurations.forEach(iflow => {
      const packageId = iflow.packageId;
      const packageName = iflow.packageName;

      if (!packageMap.has(packageId)) {
        packageMap.set(packageId, {
          packageId,
          packageName,
          iflows: []
        });
      }

      packageMap.get(packageId)!.iflows.push(iflow);
    });

    return Array.from(packageMap.values()).sort((a, b) => 
      a.packageName.localeCompare(b.packageName)
    );
  };

  // Toggle package expansion
  const togglePackage = (packageId: string) => {
    const newExpanded = new Set(expandedPackages);
    if (newExpanded.has(packageId)) {
      newExpanded.delete(packageId);
    } else {
      newExpanded.add(packageId);
    }
    setExpandedPackages(newExpanded);
  };

  // Handle iFlow selection (no need to load parameters since they're already loaded)
  const handleIFlowSelection = async (iflowId: string) => {
    setSelectedIFlowId(iflowId);
    console.log(`🔍 Selected iFlow: ${iflowId}`);
  };

  // Handle parameter value changes
  const handleParameterChange = (iflowId: string, parameterKey: string, value: string) => {
    setParameterValues(prev => ({
      ...prev,
      [iflowId]: {
        ...prev[iflowId],
        [parameterKey]: value
      }
    }));
  };

  // Get parameter value (either user-modified or original)
  const getParameterValue = (iflowId: string, parameterKey: string, originalValue: string): string => {
    return parameterValues[iflowId]?.[parameterKey] ?? originalValue;
  };

  // Save configuration parameters using existing backend API - SAVES ALL IFLOWS AT ONCE
  const saveConfigurationParameters = async () => {
    try {
      setSaving(true);
      
      if (!iflowConfigurations || iflowConfigurations.length === 0) {
        alert("No iFlow configurations available to save");
        return;
      }

      console.log(`💾 Preparing to save ALL ${iflowConfigurations.length} iFlows from Stage2...`);

      // Prepare data for ALL iFlows from Stage2 (not just selected one)
      const configData = {
        environment: "PRD", // Hardcoded as requested
        timestamp: new Date().toISOString(),
        iflows: iflowConfigurations.map((config) => {
          // Get all parameters (original + user modifications)
          const allConfigurations: Record<string, string> = {};
          
          // Add all original parameter values
          config.parameters.forEach((param) => {
            allConfigurations[param.ParameterKey] = param.ParameterValue || "";
          });
          
          // Override with user changes if any
          const userChanges = parameterValues[config.iflowId] || {};
          Object.keys(userChanges).forEach((paramKey) => {
            allConfigurations[paramKey] = userChanges[paramKey];
          });

          console.log(`📝 iFlow ${config.iflowId} (${config.iflowName}): ${Object.keys(allConfigurations).length} parameters`);

          return {
            iflowId: config.iflowId,
            iflowName: config.iflowName,
            version: config.version,
            configurations: allConfigurations,
          };
        })
      };

      const totalParams = configData.iflows.reduce((sum, iflow) => 
        sum + Object.keys(iflow.configurations).length, 0
      );
      
      console.log(`💾 Saving ${configData.iflows.length} iFlows with ${totalParams} total parameters to PRD environment`);

      // Use existing backend client method
      const result = await backendClient.saveIFlowConfigurations(configData);
      
      console.log('✅ Configuration saved successfully:', result);
      console.log(`✅ Files created: ${result.data.filename} and ${result.data.latest_filename}`);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('❌ Failed to save configuration:', error);
      alert(`Failed to save configuration: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Effects
  useEffect(() => {
    loadConfigurations();
  }, [data]);

  useEffect(() => {
    console.log('🔍 Stage3Configuration - Data received:', data);
    console.log('🔍 Stage3Configuration - iflowConfigurations:', iflowConfigurations);
    console.log('🔍 Stage3Configuration - loading:', loading);
    console.log('🔍 Stage3Configuration - error:', error);
  }, [data, iflowConfigurations, loading, error]);

  // Handle next step navigation
  const handleNext = () => {
    const dataToPass = {
      ...data, // Keep existing data from previous stages
      configurations: {},
      environment: selectedEnvironment,
      iflowConfigurations: iflowConfigurations,
      iflowDetails: iflowConfigurations // Pass complete iFlow configurations including packageName
    };

    console.log('🔄 Stage3 passing data to Stage4:', dataToPass);
    console.log('📊 Stage3 - iflowConfigurations details:');
    iflowConfigurations.forEach((config, index) => {
      console.log(`  ${index + 1}. iFlow ID: ${config.iflowId}`);
      console.log(`     iFlow Name: ${config.iflowName}`);
      console.log(`     Package ID: ${config.packageId}`);
      console.log(`     Package Name: ${config.packageName}`);
      console.log(`     Version: ${config.version}`);
      console.log(`     Parameters Count: ${config.parameters.length}`);
      console.log('     ---');
    });

    onComplete(dataToPass);
    onNext();
  };

  // Loading state
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

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button onClick={loadConfigurations} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const packageGroups = groupIFlowsByPackage();

  return (
    <div className="space-y-6">
      {/* HEADER REMOVED as per new design */}

      {/* ENVIRONMENTS SECTION */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <CardTitle>Environments</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {environments.map((env) => (
              <div
                key={env.id}
                onClick={() => setSelectedEnvironment(env.id)}
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
                    {env.isLive && (
                      <Badge variant="destructive" className="text-xs">
                        Live
                      </Badge>
                    )}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    env.health === 'healthy' ? 
                      'bg-green-500' : 
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

      {/* TWO-PANEL LAYOUT */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel: Packages and Integration Flows */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Deployable Artifacts</span>
              </CardTitle>
              <div className="text-sm text-gray-500">
                {packageGroups.length} package{packageGroups.length !== 1 ? 's' : ''} • {iflowConfigurations.length} iFlow{iflowConfigurations.length !== 1 ? 's' : ''}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {packageGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No integration flows found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {packageGroups.map((packageGroup) => (
                    <div key={packageGroup.packageId} className="border-b border-gray-100 last:border-b-0">
                      <Collapsible
                        open={expandedPackages.has(packageGroup.packageId)}
                        onOpenChange={() => togglePackage(packageGroup.packageId)}
                      >
                        {/* Package Header */}
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                {expandedPackages.has(packageGroup.packageId) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                                <Package className="w-4 h-4 text-purple-600" />
                              </div>
                              <div className="text-left">
                                <h4 className="font-medium text-sm text-gray-900">
                                  {packageGroup.packageName}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {packageGroup.iflows.length} iFlow{packageGroup.iflows.length !== 1 ? 's' : ''} selected
                                </p>
                              </div>
                            </div>
                            {/* Removed Package ID badge and numeric count badge */}
                          </div>
                        </CollapsibleTrigger>

                        {/* Collapsible Content - iFlows */}
                        <CollapsibleContent>
                          <div className="bg-gray-50 border-t">
                            {packageGroup.iflows.map((iflow) => (
                              <div
                                key={iflow.iflowId}
                                onClick={() => handleIFlowSelection(iflow.iflowId)}
                                className={`p-4 pl-12 border-l-4 cursor-pointer transition-all hover:bg-gray-100 ${
                                  selectedIFlowId === iflow.iflowId
                                    ? "border-l-blue-500 bg-blue-50 hover:bg-blue-100"
                                    : "border-l-transparent"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    <h5 className="font-medium text-sm text-gray-900">
                                      {iflow.iflowName}
                                    </h5>
                                    <p className="text-xs text-gray-500 mt-1 text-left">
                                      Version: {iflow.version} • {iflow.parameters.length} parameter{iflow.parameters.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  {/* Removed iFlow ID badge and "Selected" badge */}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
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
                    {selectedIFlowId ? 
                      iflowConfigurations.find(iflow => iflow.iflowId === selectedIFlowId)?.parameters.length || 0 
                      : 0} parameters
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedIFlowId ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select an integration flow to configure parameters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const selectedConfig = iflowConfigurations.find(config => config.iflowId === selectedIFlowId);
                    if (!selectedConfig) return null;

                    return (
                      <div className="space-y-4">
                        {/* iFlow Info */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-medium text-blue-900 mb-2 text-left">Selected Integration Flow</h3>
                          <div className="space-y-1 text-left">
                            <div className="text-sm text-left"><strong>Name:</strong> {selectedConfig.iflowName}</div>
                            <div className="text-sm text-left"><strong>Package:</strong> {selectedConfig.packageName}</div>
                            <div className="text-sm text-left"><strong>Version:</strong> {selectedConfig.version}</div>
                          </div>
                        </div>

                        {/* Parameters Table */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 text-left">Externalized parameters</h4>
                          {selectedConfig.parameters.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Parameter Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Parameter Value
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Data Type
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {selectedConfig.parameters.map((param, index) => (
                                    <tr key={param.ParameterKey} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-gray-900">
                                            {param.ParameterKey}
                                          </span>
                                          {param.Mandatory && (
                                            <Badge variant="destructive" className="text-xs">
                                              Required
                                            </Badge>
                                          )}
                                        </div>
                                        {param.Description && (
                                          <p className="text-xs text-gray-500 mt-1">{param.Description}</p>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                        <input
                                          type={param.DataType === 'secureParameter' ? "password" : "text"}
                                          value={getParameterValue(selectedIFlowId, param.ParameterKey, param.ParameterValue)}
                                          onChange={(e) => handleParameterChange(selectedIFlowId, param.ParameterKey, e.target.value)}
                                          placeholder={`Enter ${param.ParameterKey}...`}
                                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                            param.Mandatory && !getParameterValue(selectedIFlowId, param.ParameterKey, param.ParameterValue) 
                                              ? 'border-red-300' 
                                              : 'border-gray-300'
                                          }`}
                                        />
                                        {param.Mandatory && !getParameterValue(selectedIFlowId, param.ParameterKey, param.ParameterValue) && (
                                          <p className="text-xs text-red-600 mt-1">This parameter is required</p>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-left">
                                        <Badge variant="outline" className="text-xs">
                                          {param.DataType}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p>No configuration parameters found for this iFlow</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={onPrevious}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous: iFlow Selection</span>
        </Button>

        <div className="flex items-center space-x-4">
          {/* Save Configuration Button */}
          <Button
            onClick={saveConfigurationParameters}
            disabled={saving || iflowConfigurations.length === 0}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>{saving ? "Saving..." : `Save All ${iflowConfigurations.length} iFlow Configurations`}</span>
          </Button>

          <Button onClick={handleNext} className="flex items-center space-x-2">
            <span>Next: Design Validation</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Save Success Message */}
      {saveSuccess && (
        <div className="flex items-center justify-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span>✅ All {iflowConfigurations.length} iFlow configurations saved successfully to backend/configurations/PRD/iflow_configurations.csv</span>
        </div>
      )}
    </div>
  );
};

export default Stage3Configuration;