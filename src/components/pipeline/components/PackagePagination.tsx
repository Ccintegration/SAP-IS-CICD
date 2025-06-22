// File Path: src/components/pipeline/components/PackagePagination.tsx
// Filename: PackagePagination.tsx

import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { generatePageNumbers } from '../utils/PaginationUtils';

interface PackagePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loadingPackageCount?: number;
  isNavigationBlocked?: boolean; // ✅ FIXED: Add navigation blocking prop
}

const PackagePagination: React.FC<PackagePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loadingPackageCount = 0,
  isNavigationBlocked = false, // ✅ FIXED: Default value for navigation blocking
}) => {
  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Navigation Blocking Indicator */}
      {isNavigationBlocked && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">
              Loading package details... Navigation is temporarily disabled.
            </span>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isNavigationBlocked} // ✅ FIXED: Disable during navigation blocking
        >
          Previous
        </Button>
        
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span key={index} className="px-2 text-gray-500">...</span>
          ) : (
            <Button
              key={index}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              disabled={isNavigationBlocked} // ✅ FIXED: Disable during navigation blocking
              className={`w-10 h-10 ${
                isNavigationBlocked && currentPage !== page 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              {page}
            </Button>
          )
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isNavigationBlocked} // ✅ FIXED: Disable during navigation blocking
        >
          Next
        </Button>
      </div>

      {/* Page Info */}
      <div className="text-center text-sm text-gray-500">
        Page {currentPage} of {totalPages}
        {loadingPackageCount > 0 && !isNavigationBlocked && (
          <span className="text-blue-600 ml-2">
            (Loading {loadingPackageCount} package{loadingPackageCount === 1 ? '' : 's'}...)
          </span>
        )}
        {isNavigationBlocked && (
          <span className="text-orange-600 ml-2 font-medium">
            (Please wait for loading to complete)
          </span>
        )}
      </div>
    </div>
  );
};

export default PackagePagination;