// File Path: src/components/pipeline/components/IFlowPackageList.tsx
// Filename: IFlowPackageList.tsx

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Package, List } from "lucide-react";

import { IFlowCard } from './IFlowCard';
import { IFlowPackageListProps, PackagePaginationState } from '../types/IFlowTypes';
import { filterIFlows, getPaginationInfo, getPaginationDisplayText } from '../utils/IFlowHelpers';

export const IFlowPackageList: React.FC<IFlowPackageListProps> = ({
  packagesByIFlows,
  selectedIFlows,
  expandedPackages,
  searchTerm,
  onIFlowToggle,
  onPackageToggle,
  onSelectAllInPackage,
}) => {
  // Pagination state per package
  const [packagePagination, setPackagePagination] = useState<Record<string, PackagePaginationState>>({});

  const updatePackagePagination = (packageId: string, updates: Partial<PackagePaginationState>) => {
    setPackagePagination(prev => ({
      ...prev,
      [packageId]: {
        currentPage: 1,
        itemsPerPage: 10,
        ...prev[packageId],
        ...updates,
      }
    }));
  };

  const getPackagePagination = (packageId: string): PackagePaginationState => {
    return packagePagination[packageId] || { currentPage: 1, itemsPerPage: 10 };
  };

  if (packagesByIFlows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No Integration Flows Found</h3>
        <p className="text-sm">
          {searchTerm 
            ? "No iFlows match your search criteria. Try adjusting your search terms."
            : "No iFlows available in the selected packages."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {packagesByIFlows.map((packageData) => {
        const { currentPage, itemsPerPage } = getPackagePagination(packageData.packageId);
        const isExpanded = expandedPackages.has(packageData.packageId);
        
        // Filter iFlows for this package
        const filteredIFlows = filterIFlows(packageData.iflows, searchTerm);
        const { start, end, totalPages } = getPaginationInfo(currentPage, itemsPerPage, filteredIFlows.length);
        const currentIFlows = filteredIFlows.slice(start, end);
        
        // Check if all iFlows in this package are selected
        const packageIFlowIds = packageData.iflows.map(iflow => iflow.id);
        const allSelected = packageIFlowIds.every(id => selectedIFlows.includes(id));
        const someSelected = packageIFlowIds.some(id => selectedIFlows.includes(id));

        return (
          <div key={packageData.packageId} className="border rounded-lg overflow-hidden">
            {/* Package Header */}
            <Collapsible open={isExpanded} onOpenChange={() => onPackageToggle(packageData.packageId)}>
              <CollapsibleTrigger asChild>
                <div className="bg-gray-50 border-b p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    {/* Left side - Package name and selection */}
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-gray-600" />
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{packageData.packageName}</h3>
                        <div className="text-sm text-gray-500">
                          {packageData.iflows.length} iFlow{packageData.iflows.length === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Count and expand icon */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {filteredIFlows.length} iFlow{filteredIFlows.length === 1 ? '' : 's'}
                        </div>
                        {someSelected && (
                          <div className="text-xs text-blue-600">
                            {packageIFlowIds.filter(id => selectedIFlows.includes(id)).length} selected
                          </div>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Package Content - Collapsed by default */}
              <CollapsibleContent>
                <div className="p-4 bg-white">
                  {/* Package Controls */}
                  <div className="flex items-center justify-between mb-4">
                    {/* Select All for this package */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => onSelectAllInPackage(packageData.packageId)}
                        className={someSelected && !allSelected ? "data-[state=checked]:bg-blue-600" : ""}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectAllInPackage(packageData.packageId)}
                      >
                        {allSelected ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    
                    {/* Items per page for this package */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Show:</label>
                      <Select 
                        value={itemsPerPage.toString()} 
                        onValueChange={(value) => updatePackagePagination(packageData.packageId, { 
                          itemsPerPage: parseInt(value),
                          currentPage: 1 
                        })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">per page</span>
                    </div>
                  </div>

                  {/* Results summary for this package */}
                  <div className="text-sm text-gray-600 mb-4">
                    {getPaginationDisplayText(
                      currentPage, 
                      itemsPerPage, 
                      filteredIFlows.length,
                      searchTerm && filteredIFlows.length !== packageData.iflows.length,
                      packageData.iflows.length
                    )}
                  </div>

                  {/* iFlows List */}
                  <div className="space-y-3">
                    {currentIFlows.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <List className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No iFlows found</p>
                        {searchTerm && (
                          <p className="text-sm">Try adjusting your search terms</p>
                        )}
                      </div>
                    ) : (
                      currentIFlows.map((iflow) => (
                        <IFlowCard
                          key={iflow.id}
                          iflow={iflow}
                          isSelected={selectedIFlows.includes(iflow.id)}
                          onToggle={onIFlowToggle}
                        />
                      ))
                    )}
                  </div>

                  {/* Package Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePackagePagination(packageData.packageId, { 
                          currentPage: Math.max(1, currentPage - 1) 
                        })}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePackagePagination(packageData.packageId, { 
                          currentPage: Math.min(totalPages, currentPage + 1) 
                        })}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
};