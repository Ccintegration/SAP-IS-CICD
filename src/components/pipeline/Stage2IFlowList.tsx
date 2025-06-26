// File Path: src/components/pipeline/Stage2IFlowList.tsx
// Filename: Stage2IFlowList.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ChevronLeft, Search, Loader2 } from "lucide-react";

// Import type definitions first
interface IFlow {
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
  parameterCount?: number;
}

interface PackageWithIFlows {
  packageId: string;
  packageName: string;
  iflows: IFlow[];
}

interface Stage2Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Create a local implementation of IFlowPackageList for now
import { useState as usePackageState } from 'react';
import { Button as Btn } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Package, List } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import the existing utilities
import { formatIFlowModifiedDate, getIFlowExactDateString } from "./utils/IFlowDateUtils";

// Import data loading hook
import { useState as useDataState, useEffect, useRef } from 'react';
import { PipelineSAPService } from "@/lib/pipeline-sap-service";

// Custom hook for data loading
const useIFlowData = (selectedPackages: string[]) => {
  const [iFlows, setIFlows] = useDataState<IFlow[]>([]);
  const [packagesByIFlows, setPackagesByIFlows] = useDataState<PackageWithIFlows[]>([]);
  const [loading, setLoading] = useDataState(true);
  const [error, setError] = useDataState<string | null>(null);

  const lastCallRef = useRef<number>(0);
  const isLoadingRef = useRef(false);
  const selectedPackagesRef = useRef<string[]>([]);

  const loadIFlows = async () => {
    const now = Date.now();
    const currentSelectedPackages = selectedPackages || [];
    
    if (isLoadingRef.current || (now - lastCallRef.current) < 500) {
      return;
    }

    const packagesChanged = JSON.stringify(selectedPackagesRef.current) !== JSON.stringify(currentSelectedPackages);
    if (!packagesChanged && lastCallRef.current > 0) {
      return;
    }

    lastCallRef.current = now;
    isLoadingRef.current = true;
    selectedPackagesRef.current = [...currentSelectedPackages];
    
    setLoading(true);
    setError(null);
    
    try {
      const selectedPackageIds = currentSelectedPackages.length > 0 
        ? currentSelectedPackages 
        : ["all"];

      const iflowsData = await PipelineSAPService.getIntegrationFlows(selectedPackageIds);
      
      // Debug: Log the first raw iFlow object from backend response
      if (iflowsData.length > 0) {
        console.log('First raw iFlow from backend:', iflowsData[0]);
      }

      // Transform SAPIFlow to IFlow format
      const transformedIFlows: IFlow[] = iflowsData.map(sapIFlow => ({
        id: sapIFlow.id || (sapIFlow as any).Id,
        name: sapIFlow.name || (sapIFlow as any).Name,
        description: sapIFlow.description || (sapIFlow as any).Description,
        packageId: sapIFlow.packageId || (sapIFlow as any).PackageId,
        packageName: sapIFlow.packageName,
        status: sapIFlow.status,
        lastModified: sapIFlow.lastModified,
        version: sapIFlow.version || (sapIFlow as any).Version,
        author: sapIFlow.author || (sapIFlow as any).CreatedBy,
        type: sapIFlow.type as "http" | "mail" | "sftp" | "database" | "integration flow"
      }));

      // Debug: Log packageName and packageId for each iFlow before grouping
      transformedIFlows.forEach(iflow => {
        console.log('Grouping iFlow:', { id: iflow.id, packageId: iflow.packageId, packageName: iflow.packageName });
      });

      setIFlows(transformedIFlows);

      // Group iFlows by package
      const packageMap = new Map<string, PackageWithIFlows>();
      
      transformedIFlows.forEach(iflow => {
        const packageId = iflow.packageId;
        if (!packageMap.has(packageId)) {
          packageMap.set(packageId, {
            packageId,
            packageName: iflow.packageName || packageId,
            iflows: []
          });
        }
        packageMap.get(packageId)!.iflows.push(iflow);
      });

      const packagesByIFlowsArray = Array.from(packageMap.values());
      setPackagesByIFlows(packagesByIFlowsArray);

    } catch (error: any) {
      let errorMessage = "Failed to load integration flows. Please try again.";
      
      if (error.message) {
        if (error.message.includes("No registered tenant found")) {
          errorMessage = "No SAP Integration Suite tenant registered. Please register your tenant in the Administration tab first.";
        } else if (error.message.includes("Backend URL not configured")) {
          errorMessage = "Backend URL not configured. Please configure your Python FastAPI backend URL in the Administration tab.";
        } else if (error.message.includes("Cannot connect to backend")) {
          errorMessage = `Backend connection failed: ${error.message}. Please ensure your Python FastAPI backend is running and accessible.`;
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    loadIFlows();
  }, [selectedPackages]);

  return {
    iFlows,
    packagesByIFlows,
    loading,
    error,
    loadIFlows
  };
};

// IFlow Card Component
const IFlowCard: React.FC<{
  iflow: IFlow;
  isSelected: boolean;
  onToggle: (iflowId: string) => void;
}> = ({ iflow, isSelected, onToggle }) => {
  return (
    <div
      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
        isSelected
          ? "bg-blue-50 border-blue-300 shadow-sm"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
      onClick={() => onToggle(iflow.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="pt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(iflow.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* iFlow Name - retain original font size and format with LEFT ALIGNMENT */}
          <div className="font-semibold text-gray-900 mb-2 text-base text-left">
            {iflow.name}
          </div>

          {/* iFlow Description - left aligned with retained font size */}
          <div className="text-sm text-gray-600 mb-3 text-left leading-relaxed">
            {iflow.description || "No description available"}
          </div>

          {/* Clean Details Section - ALL IN SAME ROW */}
          <div className="text-sm text-gray-700 text-left">
            <span className="font-medium">Last Modified:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 cursor-help hover:text-blue-600">
                    {formatIFlowModifiedDate(iflow.lastModified)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getIFlowExactDateString(iflow.lastModified)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="ml-4 font-medium">Last Modified By:</span>
            <span className="ml-2">{iflow.author || 'Unknown User'}</span>
            <span className="ml-4 font-medium">Version: {iflow.version || '1.0.0'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Package List Component
const IFlowPackageList: React.FC<{
  packagesByIFlows: PackageWithIFlows[];
  selectedIFlows: string[];
  expandedPackages: Set<string>;
  searchTerm: string;
  onIFlowToggle: (iflowId: string) => void;
  onPackageToggle: (packageId: string) => void;
  onSelectAllInPackage: (packageId: string) => void;
}> = ({
  packagesByIFlows,
  selectedIFlows,
  expandedPackages,
  searchTerm,
  onIFlowToggle,
  onPackageToggle,
  onSelectAllInPackage,
}) => {
  const [packagePagination, setPackagePagination] = usePackageState<Record<string, {
    currentPage: number;
    itemsPerPage: number;
  }>>({});

  const updatePackagePagination = (packageId: string, updates: Partial<{ currentPage: number; itemsPerPage: number }>) => {
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

  const getPackagePagination = (packageId: string) => {
    return packagePagination[packageId] || { currentPage: 1, itemsPerPage: 10 };
  };

  // Filter helper
  const filterIFlows = (iflows: IFlow[], searchTerm: string): IFlow[] => {
    if (!searchTerm.trim()) return iflows;
    
    const term = searchTerm.toLowerCase();
    return iflows.filter(iflow =>
      iflow.name.toLowerCase().includes(term) ||
      iflow.description.toLowerCase().includes(term) ||
      iflow.id.toLowerCase().includes(term) ||
      iflow.version.toLowerCase().includes(term) ||
      iflow.author.toLowerCase().includes(term)
    );
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
        const totalPages = Math.ceil(filteredIFlows.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, filteredIFlows.length);
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
                      <Btn
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectAllInPackage(packageData.packageId)}
                      >
                        {allSelected ? "Deselect All" : "Select All"}
                      </Btn>
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
                    Showing {start + 1} to {end} of {filteredIFlows.length} iFlow{filteredIFlows.length === 1 ? '' : 's'}
                    {searchTerm && filteredIFlows.length !== packageData.iflows.length && (
                      <span> (filtered from {packageData.iflows.length} total)</span>
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
                      <Btn
                        variant="outline"
                        size="sm"
                        onClick={() => updatePackagePagination(packageData.packageId, { 
                          currentPage: Math.max(1, currentPage - 1) 
                        })}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Btn>
                      
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <Btn
                        variant="outline"
                        size="sm"
                        onClick={() => updatePackagePagination(packageData.packageId, { 
                          currentPage: Math.min(totalPages, currentPage + 1) 
                        })}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Btn>
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

const Stage2IFlowList: React.FC<Stage2Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [selectedIFlows, setSelectedIFlows] = useState<string[]>(
    data.selectedIFlows || [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());

  // Use custom hook for data management
  const {
    iFlows,
    packagesByIFlows,
    loading,
    error,
    loadIFlows
  } = useIFlowData(data.selectedPackages);

  const handleIFlowToggle = (iflowId: string) => {
    const newSelected = selectedIFlows.includes(iflowId)
      ? selectedIFlows.filter((id) => id !== iflowId)
      : [...selectedIFlows, iflowId];

    setSelectedIFlows(newSelected);
  };

  const handlePackageToggle = (packageId: string) => {
    const newExpanded = new Set(expandedPackages);
    if (newExpanded.has(packageId)) {
      newExpanded.delete(packageId);
    } else {
      newExpanded.add(packageId);
    }
    setExpandedPackages(newExpanded);
  };

  const handleSelectAllInPackage = (packageId: string) => {
    const packageData = packagesByIFlows.find(pkg => pkg.packageId === packageId);
    if (!packageData) return;

    const packageIFlowIds = packageData.iflows.map(iflow => iflow.id);
    const allSelected = packageIFlowIds.every(id => selectedIFlows.includes(id));

    if (allSelected) {
      setSelectedIFlows(selectedIFlows.filter(id => !packageIFlowIds.includes(id)));
    } else {
      const newSelected = [...new Set([...selectedIFlows, ...packageIFlowIds])];
      setSelectedIFlows(newSelected);
    }
  };

  const handleNext = () => {
    if (selectedIFlows.length === 0) {
      alert("Please select at least one integration flow before proceeding.");
      return;
    }

    const selectedIFlowDetails = iFlows.filter(iflow => selectedIFlows.includes(iflow.id));
    
    onComplete({ 
      ...data,
      selectedIFlows: selectedIFlows,
      iflowDetails: selectedIFlowDetails
    });
    onNext();
  };

  const canProceed = selectedIFlows.length > 0;

  // Filter packages and iflows based on search term
  const filteredPackagesByIFlows = packagesByIFlows
    .map(pkg => ({
      ...pkg,
      iflows: pkg.iflows.filter(iflow =>
        iflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        iflow.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter(pkg => pkg.iflows.length > 0);

  return (
    <Card className="w-full">
      {/* CardHeader removed as per new design */}

      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search integration flows by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading integration flows...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 font-semibold">Error loading integration flows</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadIFlows}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Package List with IFlows */}
        {!loading && !error && (
          <IFlowPackageList
            packagesByIFlows={filteredPackagesByIFlows}
            selectedIFlows={selectedIFlows}
            expandedPackages={expandedPackages}
            searchTerm={searchTerm}
            onIFlowToggle={handleIFlowToggle}
            onPackageToggle={handlePackageToggle}
            onSelectAllInPackage={handleSelectAllInPackage}
          />
        )}

        {/* Selection Summary */}
        {selectedIFlows.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>{selectedIFlows.length}</strong> iFlow{selectedIFlows.length === 1 ? "" : "s"} selected for CI/CD pipeline
            </p>
            <div className="text-xs text-green-600 mt-1">
              Selected: {selectedIFlows.join(", ")}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous: Packages
          </Button>
          <div className="text-sm text-gray-500 self-center">
            {iFlows.length > 0 && (
              <span>
                Total: {iFlows.length} iFlows from {packagesByIFlows.length} package{packagesByIFlows.length === 1 ? '' : 's'}
                <span className="text-green-600 ml-2">
                  (📡 Real data from SAP Integration Suite)
                </span>
              </span>
            )}
          </div>
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center space-x-2"
          >
            <span>Next: Configuration ({selectedIFlows.length} iFlow{selectedIFlows.length === 1 ? '' : 's'} selected)</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Stage2IFlowList;