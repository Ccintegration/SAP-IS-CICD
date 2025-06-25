// File Path: src/components/pipeline/components/stage3/PackagesAndIntegrationFlows.tsx
// Filename: PackagesAndIntegrationFlows.tsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Settings, Package } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface IFlowConfiguration {
  iflowId: string;
  iflowName: string;
  packageId: string;
  packageName: string;
  version: string;
  parameters: any[];
}

interface PackageGroup {
  packageId: string;
  packageName: string;
  iflows: IFlowConfiguration[];
}

interface PackagesAndIntegrationFlowsProps {
  iflowConfigurations: IFlowConfiguration[];
  selectedIFlowId: string | null;
  onIFlowSelect: (iflowId: string) => void;
  data: any; // Pipeline data from previous stages
}

export const PackagesAndIntegrationFlows: React.FC<PackagesAndIntegrationFlowsProps> = ({
  iflowConfigurations,
  selectedIFlowId,
  onIFlowSelect,
  data,
}) => {
  // State for tracking which packages are expanded (all collapsed by default)
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());

  // Group iFlows by package
  const groupIFlowsByPackage = (): PackageGroup[] => {
    const packageMap = new Map<string, PackageGroup>();

    iflowConfigurations.forEach(iflow => {
      const packageId = iflow.packageId;
      const packageName = iflow.packageName || `Package ${packageId}`;

      if (!packageMap.has(packageId)) {
        packageMap.set(packageId, {
          packageId,
          packageName,
          iflows: []
        });
      }

      packageMap.get(packageId)!.iflows.push(iflow);
    });

    // Sort packages by name
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

  // Check if package is expanded
  const isPackageExpanded = (packageId: string): boolean => {
    return expandedPackages.has(packageId);
  };

  // Get package groups
  const packageGroups = groupIFlowsByPackage();

  // Auto-select first iFlow if none selected
  useEffect(() => {
    if (iflowConfigurations.length > 0 && !selectedIFlowId) {
      onIFlowSelect(iflowConfigurations[0].iflowId);
    }
  }, [iflowConfigurations, selectedIFlowId, onIFlowSelect]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>Packages and Integration Flows</span>
        </CardTitle>
        <div className="text-sm text-gray-500">
          {packageGroups.length} package{packageGroups.length !== 1 ? 's' : ''} • {iflowConfigurations.length} iFlow{iflowConfigurations.length !== 1 ? 's' : ''}
        </div>
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
            {packageGroups.map((packageGroup) => (
              <div key={packageGroup.packageId} className="border-b border-gray-100 last:border-b-0">
                <Collapsible
                  open={isPackageExpanded(packageGroup.packageId)}
                  onOpenChange={() => togglePackage(packageGroup.packageId)}
                >
                  {/* Package Header - Clickable to expand/collapse */}
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {isPackageExpanded(packageGroup.packageId) ? (
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
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {packageGroup.packageId}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {packageGroup.iflows.length}
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Collapsible Content - iFlows in this package */}
                  <CollapsibleContent>
                    <div className="bg-gray-50 border-t">
                      {packageGroup.iflows.map((iflow) => (
                        <div
                          key={iflow.iflowId}
                          onClick={() => onIFlowSelect(iflow.iflowId)}
                          className={cn(
                            "p-4 pl-12 border-l-4 cursor-pointer transition-all hover:bg-gray-100",
                            selectedIFlowId === iflow.iflowId
                              ? "border-l-blue-500 bg-blue-50 hover:bg-blue-100"
                              : "border-l-transparent"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-sm text-gray-900">
                                {iflow.iflowName}
                              </h5>
                              <p className="text-xs text-gray-500 mt-1">
                                {iflow.version} • {iflow.parameters.length} parameter{iflow.parameters.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {iflow.iflowId}
                              </Badge>
                              {selectedIFlowId === iflow.iflowId && (
                                <Badge variant="default" className="text-xs bg-blue-600">
                                  Selected
                                </Badge>
                              )}
                            </div>
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
  );
};