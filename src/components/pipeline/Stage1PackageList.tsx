// Stage1PackageList.tsx - Fix 1: Prevent Double API Call
// Key changes to prevent the API from being called twice on page load

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Package as PackageIcon } from "lucide-react";

// Import new components and services
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
  const [packagesPerPage, setPackagesPerPage] = useState(10); // ✅ FIX 4: Default packages per page set to 10
  const [sortField, setSortField] = useState<SortField>('modifiedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Pagination state
  const [paginationData, setPaginationData] = useState<PackagePaginationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX 1: More robust approach - track calls with timestamp
  const lastCallRef = useRef<number>(0);
  const isLoadingRef = useRef(false);

  // Load packages with pagination - removed from useCallback to break dependency cycle
  const loadPackages = async () => {
    const now = Date.now();
    
    // ✅ FIX 1: Prevent calls within 500ms of each other
    if (isLoadingRef.current || (now - lastCallRef.current) < 500) {
      console.log("⚠️ Skipping API call - too recent or already loading", {
        isLoading: isLoadingRef.current,
        timeSinceLastCall: now - lastCallRef.current
      });
      return;
    }

    lastCallRef.current = now;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log("📡 Making API call to /api/sap/packages", {
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

  // ✅ FIX 1: Separate useEffects with careful dependency management
  
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

  // ✅ FIX 1: Remove the separate useEffect that was causing double calls
  // This was the problematic useEffect:
  // useEffect(() => {
  //   if (currentPage !== 1) {
  //     setCurrentPage(1);
  //   }
  // }, [searchTerm, sortField, sortDirection, packagesPerPage]);

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
    // currentPage will be reset to 1 in the main useEffect
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
    // Reset the timestamp to allow immediate refresh
    lastCallRef.current = 0;
    loadPackages();
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

  // Loading state
  if (loading && !paginationData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            Loading packages from SAP Integration Suite...
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Optimized for fast loading with pagination
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
          <div className="text-red-600 mb-4">
            <PackageIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="font-medium">Failed to load packages</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PackageIcon className="w-5 h-5 text-blue-600" />
          <span>Select Integration Packages</span>
          <Badge variant="outline" className="ml-auto">
            Step 1 of 8
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose the integration packages you want to include in your CI/CD pipeline. 
          Package data loads incrementally for optimal performance.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search and Sort Controls */}
        <PackageSearchAndSort
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
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
                Updating package list...
              </span>
            </div>
          </div>
        )}

        {/* Package Table */}
        {paginationData && (
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
        {paginationData && (
          <>
            {/* ✅ FIX 5: Updated pagination info format with proper "showing packages x to y from z" */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                showing packages {((paginationData.currentPage - 1) * paginationData.pageSize) + 1} to{' '}
                {Math.min(paginationData.currentPage * paginationData.pageSize, paginationData.totalCount)} from{' '}
                {paginationData.totalCount} packages
              </div>
              <div className="flex items-center gap-4">
                <span>Show 10/20/50 per page</span>
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