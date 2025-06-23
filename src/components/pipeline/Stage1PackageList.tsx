// File Path: src/components/pipeline/Stage1PackageList.tsx
// Filename: Stage1PackageList.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, Package as PackageIcon } from "lucide-react";

// Import components and services
import { Package, Stage1Props } from './types/PackageTypes';
import { SortField, SortDirection } from './components/PackageTable';
import { PackagePaginationService, PackagePaginationRequest, PackagePaginationResponse } from '@/lib/package-pagination-service';
import PackageTable from './components/PackageTable';
import PackageSearchAndSort from './components/PackageSearchAndSort';
import PackagePagination from './components/PackagePagination';

const Stage1PackageList: React.FC<Stage1Props> = ({
  data,
  onComplete,
  onNext,
}) => {
  // State management
  const [selectedPackages, setSelectedPackages] = useState<string[]>(
    data.selectedPackages || [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [packagesPerPage, setPackagesPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('modifiedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Pagination state
  const [paginationData, setPaginationData] = useState<PackagePaginationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate API calls
  const lastCallRef = useRef<number>(0);
  const isLoadingRef = useRef(false);

  // Load packages with pagination
  const loadPackages = async () => {
    const now = Date.now();
    
    // Prevent calls within 500ms of each other
    if (isLoadingRef.current || (now - lastCallRef.current) < 500) {
      console.log("⚠️ Skipping API call - too recent or already loading");
      return;
    }

    lastCallRef.current = now;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log("📡 Making API call for packages", {
        timestamp: new Date().toISOString(),
        page: currentPage,
        pageSize: packagesPerPage,
        searchTerm: searchTerm || undefined,
        sortField,
        sortDirection,
      });

      const request: PackagePaginationRequest = {
        page: currentPage,
        pageSize: packagesPerPage,
        searchTerm: searchTerm || undefined,
        sortField,
        sortDirection,
      };
      
      const response = await PackagePaginationService.getPaginatedPackages(request);
      setPaginationData(response);
      
      // Prefetch next page for better UX
      if (response.hasNextPage) {
        PackagePaginationService.prefetchNextPage(request);
      }
      
    } catch (error) {
      console.error("Failed to load packages:", error);
      setError(error instanceof Error ? error.message : "Failed to load packages");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Initial load only
  useEffect(() => {
    console.log("🚀 Initial load useEffect");
    loadPackages();
  }, []); // Empty dependency array for initial load only

  // Handle search/sort/pagination changes
  useEffect(() => {
    // Skip if this is the initial render
    if (lastCallRef.current === 0) {
      return;
    }

    console.log("🔄 Search/Sort/Pagination change useEffect", {
      currentPage, 
      packagesPerPage, 
      searchTerm, 
      sortField, 
      sortDirection 
    });

    loadPackages();
  }, [currentPage, packagesPerPage, searchTerm, sortField, sortDirection]);

  // IMPROVED: Reset to page 1 when search term, sort, or page size changes
  useEffect(() => {
    if (lastCallRef.current > 0 && currentPage !== 1) {
      console.log("🔄 Resetting to page 1 due to search/sort/pageSize change");
      setCurrentPage(1);
    }
  }, [searchTerm, sortField, sortDirection, packagesPerPage]);

  // Event handlers
  const handlePackageToggle = useCallback((packageId: string) => {
    setSelectedPackages(prev => {
      const newSelected = prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId];
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!paginationData) return;
    
    const currentPageIds = paginationData.packages.map(pkg => pkg.id);
    const allCurrentSelected = currentPageIds.every(id => selectedPackages.includes(id));
    
    if (allCurrentSelected) {
      setSelectedPackages(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedPackages(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  }, [paginationData?.packages, selectedPackages]);

  const handlePageChange = useCallback((page: number) => {
    if (!paginationData) return;
    if (page < 1 || page > paginationData.totalPages || page === currentPage) return;
    
    setCurrentPage(page);
  }, [currentPage, paginationData?.totalPages]);

  const handlePackagesPerPageChange = useCallback((value: string) => {
    const newPerPage = parseInt(value, 10);
    setPackagesPerPage(newPerPage);
  }, []);

  const handleSortFieldChange = useCallback((field: SortField) => {
    setSortField(field);
  }, []);

  const handleSortDirectionChange = useCallback((direction: SortDirection) => {
    setSortDirection(direction);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleRefresh = useCallback(() => {
    PackagePaginationService.clearCache();
    lastCallRef.current = 0;
    loadPackages();
  }, []);

  // IMPROVED: Enhanced search handler with immediate feedback
  const handleSearchChange = useCallback((value: string) => {
    console.log(`🔍 Search term changed: "${value}"`);
    setSearchTerm(value);
  }, []);

  const handleNext = useCallback(() => {
    if (selectedPackages.length === 0) {
      alert("Please select at least one package before proceeding.");
      return;
    }

    onComplete({ 
      ...data,
      selectedPackages: selectedPackages 
    });
    onNext();
  }, [selectedPackages, data, onComplete, onNext]);

  // Check if all current packages are selected
  const isSelectAllChecked = paginationData ? 
    paginationData.packages.length > 0 && 
    paginationData.packages.every(pkg => selectedPackages.includes(pkg.id)) : false;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PackageIcon className="w-5 h-5" />
          <span>Stage 1: Package Selection</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Select integration packages from your SAP Integration Suite tenant.
          Package data loads incrementally for optimal performance.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search and Sort Controls */}
        <PackageSearchAndSort
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortFieldChange={handleSortFieldChange}
          onSortDirectionChange={handleSortDirectionChange}
          packagesPerPage={packagesPerPage}
          onPackagesPerPageChange={handlePackagesPerPageChange}
          onRefresh={handleRefresh}
          isLoading={loading}
        />

        {/* Loading indicator for search/sort */}
        {loading && paginationData && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-800">
                {searchTerm ? `Searching for "${searchTerm}"...` : "Updating package list..."}
              </span>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {!loading && paginationData && paginationData.packages.length === 0 && searchTerm && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
            <h3 className="text-yellow-800 font-medium">No packages found</h3>
            <p className="text-yellow-600 text-sm mt-1">
              No packages match your search term "<strong>{searchTerm}</strong>". 
              Try adjusting your search criteria or clear the search to see all packages.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSearchTerm("")}
              className="mt-2"
            >
              Clear Search
            </Button>
          </div>
        )}

        {/* Package Table */}
        {paginationData && paginationData.packages.length > 0 && (
          <PackageTable
            packages={paginationData.packages}
            selectedPackages={selectedPackages}
            onPackageToggle={handlePackageToggle}
            onSelectAll={handleSelectAll}
            isSelectAllChecked={isSelectAllChecked}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}

        {/* Pagination Info and Controls */}
        {paginationData && paginationData.packages.length > 0 && (
          <>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                showing packages {((paginationData.currentPage - 1) * paginationData.pageSize) + 1} to{' '}
                {Math.min(paginationData.currentPage * paginationData.pageSize, paginationData.totalCount)} from{' '}
                {paginationData.totalCount} packages
                {searchTerm && (
                  <span className="text-blue-600 ml-2">
                    (filtered by "{searchTerm}")
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Show</span>
                  <Select
                    value={packagesPerPage.toString()}
                    onValueChange={handlePackagesPerPageChange}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm">per page</span>
                </div>
                {selectedPackages.length > 0 && (
                  <div className="text-blue-600">
                    {selectedPackages.length} package{selectedPackages.length === 1 ? '' : 's'} selected
                  </div>
                )}
              </div>
            </div>

            <PackagePagination
              currentPage={paginationData.currentPage}
              totalPages={paginationData.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* Selection Summary */}
        {selectedPackages.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>{selectedPackages.length}</strong> package{selectedPackages.length === 1 ? "" : "s"} selected for CI/CD pipeline
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <div className="text-sm text-gray-500">
            {paginationData && (
              <span>
                Page {paginationData.currentPage} of {paginationData.totalPages} 
                • {paginationData.totalCount} total packages
              </span>
            )}
          </div>
          <Button
            onClick={handleNext}
            disabled={selectedPackages.length === 0}
            className="flex items-center space-x-2"
          >
            <span>Next: Select iFlows ({selectedPackages.length} package{selectedPackages.length === 1 ? '' : 's'} selected)</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Stage1PackageList;