// File Path: src/components/pipeline/Stage2IFlowList.tsx
// Filename: Stage2IFlowList.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ArrowRight,
  List,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Package,
  User,
  Calendar,
} from "lucide-react";
import { PipelineSAPService } from "@/lib/pipeline-sap-service";
// ✅ FIXED: Import the new iFlow date utilities
import { formatIFlowModifiedDate, getIFlowExactDateString } from "./utils/IFlowDateUtils";

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
  type: "integration flow";
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

const Stage2IFlowList: React.FC<Stage2Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [selectedIFlows, setSelectedIFlows] = useState<string[]>(
    data.selectedIFlows || [],
  );
  const [iFlows, setIFlows] = useState<IFlow[]>([]);
  const [packagesByIFlows, setPackagesByIFlows] = useState<PackageWithIFlows[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for package collapse/expand
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  
  // Pagination state per package
  const [packagePagination, setPackagePagination] = useState<Record<string, {
    currentPage: number;
    itemsPerPage: number;
  }>>({});

  
  const lastCallRef = useRef<number>(0);
  const isLoadingRef = useRef(false);
  const selectedPackagesRef = useRef<string[]>([]);

  
  const loadIFlows = async () => {
    const now = Date.now();
    const currentSelectedPackages = data.selectedPackages || [];
    
    
    if (isLoadingRef.current || (now - lastCallRef.current) < 500) {
      console.log("⚠️ Skipping iFlows API call - too recent or already loading", {
        isLoading: isLoadingRef.current,
        timeSinceLastCall: now - lastCallRef.current
      });
      return;
    }

    
    const packagesChanged = JSON.stringify(selectedPackagesRef.current) !== JSON.stringify(currentSelectedPackages);
    if (!packagesChanged && lastCallRef.current > 0) {
      console.log("⚠️ Skipping iFlows API call - selectedPackages haven't changed");
      return;
    }

    lastCallRef.current = now;
    isLoadingRef.current = true;
    selectedPackagesRef.current = [...currentSelectedPackages];
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("📡 Making iFlows API call to /api/sap/iflows", {
        timestamp: new Date().toISOString(),
        selectedPackages: currentSelectedPackages,
        packageIds: currentSelectedPackages.length > 0 ? currentSelectedPackages : ["all"]
      });

      const selectedPackageIds = currentSelectedPackages.length > 0 
        ? currentSelectedPackages 
        : ["all"]; // Fallback to all packages if none selected

      console.log("🔍 [DEBUG] Fetching iFlows for packages:", selectedPackageIds);

      const sapIFlows = await PipelineSAPService.getIntegrationFlows(selectedPackageIds);
      
      console.log("🔍 [DEBUG] Received iFlows:", sapIFlows);
      
      // Transform SAPIFlow to IFlow format with correct type
      const transformedIFlows: IFlow[] = sapIFlows.map(iflow => ({
        id: iflow.id,
        name: iflow.name,
        description: iflow.description,
        packageId: iflow.packageId,
        packageName: iflow.packageId, // SAPIFlow doesn't have packageName, use packageId as fallback
        status: iflow.status,
        lastModified: iflow.lastModified,
        version: iflow.version,
        author: iflow.author,
        type: "integration flow" as const, // Always set to "integration flow"
      }));
      
      setIFlows(transformedIFlows);

      // Group iFlows by package
      const groupedByPackage: Record<string, IFlow[]> = {};
      transformedIFlows.forEach(iflow => {
        const packageId = iflow.packageId || 'Unknown Package';
        if (!groupedByPackage[packageId]) {
          groupedByPackage[packageId] = [];
        }
        groupedByPackage[packageId].push(iflow);
      });

      // Convert to PackageWithIFlows array and sort by lastModified (latest first)
      const packagesArray: PackageWithIFlows[] = Object.entries(groupedByPackage).map(([packageId, iflows]) => {
        // Sort iflows within each package by lastModified (descending)
        const sortedIFlows = [...iflows].sort((a, b) => {
          const dateA = new Date(a.lastModified).getTime();
          const dateB = new Date(b.lastModified).getTime();
          return dateB - dateA; // Latest first
        });

        return {
          packageId,
          packageName: iflows[0]?.packageName || packageId,
          iflows: sortedIFlows,
        };
      });

      setPackagesByIFlows(packagesArray);

      // Initialize pagination for each package
      const initialPagination: Record<string, { currentPage: number; itemsPerPage: number }> = {};
      packagesArray.forEach(pkg => {
        initialPagination[pkg.packageId] = {
          currentPage: 1,
          itemsPerPage: 10, // Default 10 per page
        };
      });
      setPackagePagination(initialPagination);

      // Expand first package by default if there are packages
      if (packagesArray.length > 0) {
        setExpandedPackages(new Set([packagesArray[0].packageId]));
      }

    } catch (error) {
      console.error("Failed to load iFlows:", error);
      let errorMessage = "Failed to load integration flows from SAP tenant";

      if (error instanceof Error) {
        if (error.message.includes("No base tenant registered")) {
          errorMessage = "No SAP tenant registered. Please register your tenant in the Administration tab first.";
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

  // ✅ FIX 1: Single useEffect with proper dependency management
  useEffect(() => {
    console.log("🔄 Stage2 useEffect triggered", {
      selectedPackages: data.selectedPackages,
      hasChanged: JSON.stringify(selectedPackagesRef.current) !== JSON.stringify(data.selectedPackages || [])
    });
    
    loadIFlows();
  }, [data.selectedPackages]); // Only depend on selectedPackages

  const useIFlowCounting = (selectedPackages: string[]) => {
    const [packageIFlowCounts, setPackageIFlowCounts] = useState<Record<string, number>>({});
    const [loadingCounts, setLoadingCounts] = useState(false);

    const loadIFlowCounts = useCallback(async () => {
      if (selectedPackages.length === 0) return;

      setLoadingCounts(true);
      try {
        // Load iFlows for selected packages and count them
        const iflows = await PipelineSAPService.getIntegrationFlows(selectedPackages);
        
        // Count iFlows per package
        const counts: Record<string, number> = {};
        selectedPackages.forEach(pkgId => {
          counts[pkgId] = iflows.filter(iflow => iflow.packageId === pkgId).length;
        });
        
        setPackageIFlowCounts(counts);
      } catch (error) {
        console.error('Failed to load iFlow counts:', error);
      } finally {
        setLoadingCounts(false);
      }
    }, [selectedPackages]);

    useEffect(() => {
      loadIFlowCounts();
    }, [loadIFlowCounts]);

    return { packageIFlowCounts, loadingCounts };
  };
  const { packageIFlowCounts, loadingCounts } = useIFlowCounting(data.selectedPackages || []);
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
      // Deselect all in this package
      setSelectedIFlows(selectedIFlows.filter(id => !packageIFlowIds.includes(id)));
    } else {
      // Select all in this package
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "draft":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Play className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const updatePackagePagination = (packageId: string, updates: Partial<{ currentPage: number; itemsPerPage: number }>) => {
    setPackagePagination(prev => ({
      ...prev,
      [packageId]: {
        ...prev[packageId],
        ...updates,
      }
    }));
  };

  const getPaginationDisplayText = (currentPage: number, itemsPerPage: number, totalItems: number, isFiltered: boolean, originalTotal?: number) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    let displayText = `showing ${startItem} to ${endItem} of ${totalItems} iFlows`;
    
    if (isFiltered && originalTotal) {
      displayText += ` (filtered from ${originalTotal} total)`;
    }
    
    displayText += ` (sorted by latest updated)`;
    
    return displayText;
  };
  const getPaginatedIFlows = (packageId: string, iflows: IFlow[]) => {
    const pagination = packagePagination[packageId] || { currentPage: 1, itemsPerPage: 10 };
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return {
      currentIFlows: iflows.slice(startIndex, endIndex),
      totalPages: Math.ceil(iflows.length / pagination.itemsPerPage),
      ...pagination,
    };
  };

  const generatePageNumbers = (currentPage: number, totalPages: number) => {
    const pages = [];
    const maxVisiblePages = 10;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const canProceed = selectedIFlows.length > 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            Fetching integration flows from SAP Integration Suite...
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Frontend → Backend API → SAP Integration Suite
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <List className="w-5 h-5 text-green-600" />
          <span>Select Integration Flows</span>
          <Badge variant="outline" className="ml-auto">
            Step 2 of 8
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose the specific integration flows to include in your pipeline. You can select multiple integration flows.
          {data.selectedPackages && data.selectedPackages.length > 0 ? (
            <span className="text-blue-600 ml-1">
              Showing iFlows from {data.selectedPackages.length} selected
              package(s): {data.selectedPackages.join(", ")}.
            </span>
          ) : (
            <span className="text-amber-600 ml-1">
              Showing all available iFlows.
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Unable to load integration flows
                </h3>
                <p className="text-sm text-red-700">{error}</p>
                <div className="text-xs text-red-600 space-y-1 mt-2">
                  <p>• Check that your Python backend is running</p>
                  <p>• Verify backend URL configuration in Administration</p>
                  <p>• Ensure SAP tenant credentials are valid</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadIFlows}
                  className="mt-3"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Global Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search integration flows across all packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Packages Display - Vertical Layout */}
        <div className="space-y-4">
          {packagesByIFlows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <List className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No integration flows available</p>
              <p className="text-sm">Please ensure packages are selected in the previous stage</p>
            </div>
          ) : (
            packagesByIFlows.map((packageData) => {
              const isExpanded = expandedPackages.has(packageData.packageId);
              const filteredIFlows = packageData.iflows.filter(iflow =>
                iflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                iflow.description.toLowerCase().includes(searchTerm.toLowerCase())
              );
              const { currentIFlows, totalPages, currentPage, itemsPerPage } = getPaginatedIFlows(
                packageData.packageId, 
                filteredIFlows
              );
              const selectedInPackage = packageData.iflows.filter(iflow => selectedIFlows.includes(iflow.id)).length;

              return (
                <Card key={packageData.packageId} className="border-2">
                  <Collapsible open={isExpanded} onOpenChange={() => handlePackageToggle(packageData.packageId)}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Package className="w-5 h-5 text-blue-600" />
                            <div className="text-left">
                              <h3 className="font-semibold text-lg">{packageData.packageName}</h3>
                              <p className="text-sm text-gray-600">
                                {filteredIFlows.length} iFlow{filteredIFlows.length === 1 ? '' : 's'} available
                                {selectedInPackage > 0 && (
                                  <span className="text-green-600 ml-2">
                                    ({selectedInPackage} selected)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {packageData.packageId}
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent>
                        {/* Package Controls */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAllInPackage(packageData.packageId);
                              }}
                              disabled={filteredIFlows.length === 0}
                            >
                              {filteredIFlows.every(iflow => selectedIFlows.includes(iflow.id))
                                ? "Deselect All"
                                : "Select All"}
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
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="30">30</SelectItem>
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
                              <div
                                key={iflow.id}
                                className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                                  selectedIFlows.includes(iflow.id)
                                    ? "border-green-300 bg-green-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                                onClick={() => handleIFlowToggle(iflow.id)}
                              >
                                <div className="flex items-start space-x-3">
                                  <Checkbox
                                    checked={selectedIFlows.includes(iflow.id)}
                                    onChange={() => handleIFlowToggle(iflow.id)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium text-gray-900 truncate">
                                        {iflow.name}
                                      </h4>
                                      <div className="flex items-center space-x-2 ml-4">
                                        {getStatusIcon(iflow.status)}
                                        <Badge className={getStatusBadgeColor(iflow.status)}>
                                          {iflow.status}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          v{iflow.version}
                                        </Badge>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {iflow.description}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                      {/* ✅ FIXED: Smart date display with tooltip for iFlows */}
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center space-x-1 cursor-help">
                                              <Calendar className="w-3 h-3" />
                                              <span>
                                                {formatIFlowModifiedDate(iflow.lastModified)}
                                              </span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-sm">
                                              Last modified: {getIFlowExactDateString(iflow.lastModified)}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <div className="flex items-center space-x-1">
                                        <User className="w-3 h-3" />
                                        <span>{iflow.author}</span>
                                      </div>
                                      <span>⚙️ Integration Flow</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Pagination for this package */}
                        {totalPages > 1 && (
                          <div className="mt-6 flex items-center justify-center space-x-2">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => updatePackagePagination(packageData.packageId, { 
                                      currentPage: Math.max(1, currentPage - 1) 
                                    })}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                                
                                {generatePageNumbers(currentPage, totalPages).map((page, index) => (
                                  <PaginationItem key={index}>
                                    {page === '...' ? (
                                      <PaginationEllipsis />
                                    ) : (
                                      <PaginationLink
                                        onClick={() => updatePackagePagination(packageData.packageId, { 
                                          currentPage: page as number 
                                        })}
                                        isActive={currentPage === page}
                                        className="cursor-pointer"
                                      >
                                        {page}
                                      </PaginationLink>
                                    )}
                                  </PaginationItem>
                                ))}
                                
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => updatePackagePagination(packageData.packageId, { 
                                      currentPage: Math.min(totalPages, currentPage + 1) 
                                    })}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}

                        {/* Page info for this package */}
                        {totalPages > 1 && (
                          <div className="text-center text-sm text-gray-500 mt-2">
                            Page {currentPage} of {totalPages}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })
          )}
        </div>

        {/* Global Selection Summary */}
        {selectedIFlows.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">
              <strong>{selectedIFlows.length}</strong> integration flow
              {selectedIFlows.length === 1 ? "" : "s"} selected for CI/CD pipeline
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