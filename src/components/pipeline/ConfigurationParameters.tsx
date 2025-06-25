// File Path: src/components/pipeline/components/stage3/ConfigurationParameters.tsx
// Filename: ConfigurationParameters.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Settings,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Key,
  Lock,
  Shield,
  Database,
  X,
} from "lucide-react";

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

interface ConfigurationParametersProps {
  selectedIFlow: IFlowConfiguration | null;
  configurationChanges: Record<string, Record<string, string>>;
  selectedEnvironment: string;
  searchQuery: string;
  filterDataType: string;
  showEmptyOnly: boolean;
  filterMandatoryOnly: boolean;
  filterModifiedOnly: boolean;
  advancedSearchOpen: boolean;
  expandedCategories: Set<string>;
  maskedFields: Set<string>;
  autoSave: boolean;
  onParameterChange: (iflowId: string, paramKey: string, value: string) => void;
  onSearchChange: (query: string) => void;
  onFilterDataTypeChange: (dataType: string) => void;
  onShowEmptyOnlyChange: (show: boolean) => void;
  onFilterMandatoryOnlyChange: (filter: boolean) => void;
  onFilterModifiedOnlyChange: (filter: boolean) => void;
  onAdvancedSearchToggle: (open: boolean) => void;
  onToggleCategory: (categoryKey: string) => void;
  onToggleMask: (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => void;
  onAutoSaveChange: (autoSave: boolean) => void;
  onClearAllFilters: () => void;
  getParameterValue: (param: ConfigurationParameter, iflowId: string) => string;
  categorizeParameters: (iflow: IFlowConfiguration) => ParameterCategory[];
  getFilteredParameters: (categories: ParameterCategory[]) => ParameterCategory[];
  isCategoryExpanded: (categoryKey: string) => boolean;
}

export const ConfigurationParameters: React.FC<ConfigurationParametersProps> = ({
  selectedIFlow,
  configurationChanges,
  selectedEnvironment,
  searchQuery,
  filterDataType,
  showEmptyOnly,
  filterMandatoryOnly,
  filterModifiedOnly,
  advancedSearchOpen,
  expandedCategories,
  maskedFields,
  autoSave,
  onParameterChange,
  onSearchChange,
  onFilterDataTypeChange,
  onShowEmptyOnlyChange,
  onFilterMandatoryOnlyChange,
  onFilterModifiedOnlyChange,
  onAdvancedSearchToggle,
  onToggleCategory,
  onToggleMask,
  onAutoSaveChange,
  onClearAllFilters,
  getParameterValue,
  categorizeParameters,
  getFilteredParameters,
  isCategoryExpanded,
}) => {
  const dataTypes = ["all", "xsd:string", "secureParameter", "xsd:int", "xsd:boolean"];

  // Helper function to toggle field masking
  const toggleFieldMask = (fieldKey: string) => {
    onToggleMask(prev => {
      const newMasked = new Set(prev);
      if (newMasked.has(fieldKey)) {
        newMasked.delete(fieldKey);
      } else {
        newMasked.add(fieldKey);
      }
      return newMasked;
    });
  };

  // Get icon for parameter category
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case "Authentication":
        return Shield;
      case "Connection Settings":
        return Database;
      case "Security Parameters":
        return Lock;
      default:
        return Settings;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Configuration Parameters</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {selectedIFlow?.parameters.length || 0} parameters
            </span>
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="space-y-4">
          {/* Basic Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search parameters..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAdvancedSearchToggle(!advancedSearchOpen)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>
            {(searchQuery || filterDataType !== "all" || showEmptyOnly || filterMandatoryOnly || filterModifiedOnly) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAllFilters}
                className="flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <Collapsible open={advancedSearchOpen} onOpenChange={onAdvancedSearchToggle}>
            <CollapsibleContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataType">Data Type</Label>
                  <Select value={filterDataType} onValueChange={onFilterDataTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dataTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type === "all" ? "All Types" : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Filter Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showEmptyOnly"
                        checked={showEmptyOnly}
                        onCheckedChange={onShowEmptyOnlyChange}
                      />
                      <Label htmlFor="showEmptyOnly" className="text-sm">Empty values only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="filterMandatory"
                        checked={filterMandatoryOnly}
                        onCheckedChange={onFilterMandatoryOnlyChange}
                      />
                      <Label htmlFor="filterMandatory" className="text-sm">Mandatory only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="filterModified"
                        checked={filterModifiedOnly}
                        onCheckedChange={onFilterModifiedOnlyChange}
                      />
                      <Label htmlFor="filterModified" className="text-sm">Modified only</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Auto-save toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="autoSave"
                checked={autoSave}
                onCheckedChange={onAutoSaveChange}
              />
              <Label htmlFor="autoSave" className="text-sm">Auto-save every 30 seconds</Label>
            </div>
            <div className="text-sm text-gray-500">
              {selectedIFlow ? `${getFilteredParameters(categorizeParameters(selectedIFlow)).reduce((sum, cat) => sum + cat.parameters.length, 0)} parameters shown` : '0 parameters'}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!selectedIFlow ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Select an integration flow to configure parameters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const filteredCategories = getFilteredParameters(categorizeParameters(selectedIFlow));

              return filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No parameters match your search criteria</p>
                  <Button
                    variant="outline"
                    onClick={onClearAllFilters}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                filteredCategories.map((category) => {
                  const categoryKey = `${selectedIFlow.iflowId}-${category.name}`;
                  const CategoryIcon = getCategoryIcon(category.name);
                  
                  return (
                    <Collapsible
                      key={categoryKey}
                      open={isCategoryExpanded(categoryKey)}
                      onOpenChange={() => onToggleCategory(categoryKey)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {isCategoryExpanded(categoryKey) ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                              <CategoryIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <h3 className="font-medium text-sm text-gray-900">
                              {category.name}
                            </h3>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {category.parameters.length}
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="mt-2 space-y-4 pl-4">
                          {category.parameters.map((param) => {
                            const fieldKey = `${selectedIFlow.iflowId}-${param.ParameterKey}`;
                            const currentValue = getParameterValue(param, selectedIFlow.iflowId);
                            const isModified = configurationChanges[selectedIFlow.iflowId]?.[param.ParameterKey] !== undefined;
                            const isSecure = param.DataType === 'secureParameter';
                            const isMasked = maskedFields.has(fieldKey);
                            
                            return (
                              <div key={param.ParameterKey} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Label className="font-medium text-sm">
                                      {param.ParameterKey}
                                    </Label>
                                    {param.Mandatory && (
                                      <Badge variant="destructive" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                    {isModified && (
                                      <Badge variant="default" className="text-xs bg-blue-600">
                                        Modified
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Badge variant="outline" className="text-xs">
                                      {param.DataType}
                                    </Badge>
                                    {isSecure && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleFieldMask(fieldKey)}
                                        className="h-6 w-6 p-0"
                                      >
                                        {isMasked ? (
                                          <EyeOff className="w-3 h-3" />
                                        ) : (
                                          <Eye className="w-3 h-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="relative">
                                    {isSecure && (
                                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    )}
                                    <Input
                                      type={isSecure && isMasked ? "password" : "text"}
                                      value={currentValue}
                                      onChange={(e) => onParameterChange(selectedIFlow.iflowId, param.ParameterKey, e.target.value)}
                                      placeholder={`Enter ${param.ParameterKey}...`}
                                      className={`${isSecure ? 'pl-10' : ''} ${
                                        param.Mandatory && !currentValue ? 'border-red-300' : ''
                                      }`}
                                    />
                                  </div>
                                  
                                  {param.Description && (
                                    <p className="text-xs text-gray-500">{param.Description}</p>
                                  )}
                                  
                                  {param.Mandatory && !currentValue && (
                                    <p className="text-xs text-red-600">This parameter is required</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};