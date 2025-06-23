// File Path: src/components/pipeline/components/PackageTable.tsx
// Filename: PackageTable.tsx

import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Package } from '../types/PackageTypes';

export type SortField = 'name' | 'modifiedDate' | 'modifiedBy' | 'createdDate' | 'createdBy';
export type SortDirection = 'asc' | 'desc';

interface PackageTableProps {
  packages: Package[];
  selectedPackages: string[];
  onPackageToggle: (packageId: string) => void;
  onSelectAll: () => void;
  isSelectAllChecked: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  isNavigationBlocked?: boolean;
}

const PackageTable: React.FC<PackageTableProps> = ({
  packages,
  selectedPackages,
  onPackageToggle,
  onSelectAll,
  isSelectAllChecked,
  sortField,
  sortDirection,
  onSort,
  isNavigationBlocked = false,
}) => {
  const formatDate = (dateString: string) => {
    try {
      // Check if modifiedDate field exists and is valid
      if (!dateString || dateString === '' || dateString === 'null' || dateString === 'undefined') {
        return 'Not available';
      }

      const dateStr = String(dateString).trim();
      console.log(`🗓️ [Package] Formatting modifiedDate: "${dateStr}"`); // Debug log
      
      // Handle your specific backend format: "1707260736305" (13-digit Unix timestamp)
      if (dateStr.match(/^\d{13}$/)) {
        const timestamp = parseInt(dateStr, 10);
        const date = new Date(timestamp);
        
        console.log(`📅 [Package] Unix timestamp ${dateStr} → ${date.toISOString()}`);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('❌ [Package] Invalid timestamp:', dateStr);
          return 'Not available';
        }

        // Format for display
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      // Handle 10-digit Unix timestamp (seconds)
      else if (dateStr.match(/^\d{10}$/)) {
        const timestamp = parseInt(dateStr, 10) * 1000;
        const date = new Date(timestamp);
        
        console.log(`📅 [Package] Unix seconds ${dateStr} → ${date.toISOString()}`);
        
        if (isNaN(date.getTime())) {
          console.warn('❌ [Package] Invalid timestamp:', dateStr);
          return 'Not available';
        }

        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      // Handle ISO format as fallback
      else if (dateStr.includes('T') || dateStr.includes('Z')) {
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime())) {
          console.warn('❌ [Package] Invalid ISO date:', dateStr);
          return 'Not available';
        }

        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      // If format doesn't match expected patterns, return "Not available"
      else {
        console.warn('❌ [Package] Unexpected date format:', dateStr);
        return 'Not available';
      }

    } catch (error) {
      console.error('❌ [Package] Error formatting date:', dateString, error);
      return 'Not available';
    }
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(field)}
      className="h-auto p-1 font-medium text-left justify-start"
      disabled={isNavigationBlocked}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />
      ) : (
        <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
      )}
    </Button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Table Header - MOVED PACKAGE NAME LEFT */}
      <div className="bg-gray-50 border-b">
        <div className="grid grid-cols-12 gap-0 p-3 items-center">
          {/* Select All Checkbox */}
          <div className="col-span-1 text-left">
            <Checkbox
              checked={isSelectAllChecked}
              onCheckedChange={onSelectAll}
              disabled={packages.length === 0 || isNavigationBlocked}
            />
          </div>
          
          {/* Package Name Header - MOVED LEFT towards checkbox */}
          <div className="col-span-4 text-left -ml-9">
            <SortButton field="name">Package Name</SortButton>
          </div>
          
          {/* Description Header */}
          <div className="col-span-4 text-left ml-1">
            <span className="text-sm font-medium text-gray-700">Description</span>
          </div>
          
          {/* Version Header */}
          <div className="col-span-1 text-left ml-1">
            <span className="text-sm font-medium text-gray-700">Version</span>
          </div>
          
          {/* Date Header */}
          <div className="col-span-2 text-left ml-1">
            <SortButton field="modifiedDate">Modified Date</SortButton>
          </div>
        </div>
      </div>

      {/* Table Body - MOVED PACKAGE NAME LEFT */}
      <div className="divide-y divide-gray-200">
        {packages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-lg mb-2">No packages found</div>
            <div className="text-sm">Try adjusting your search criteria</div>
          </div>
        ) : (
          packages.map((pkg) => (
            <div key={pkg.id} className="grid grid-cols-12 gap-0 p-3 items-center hover:bg-gray-50 transition-colors">
              {/* Select Checkbox */}
              <div className="col-span-1 text-left">
                <Checkbox
                  checked={selectedPackages.includes(pkg.id)}
                  onCheckedChange={() => onPackageToggle(pkg.id)}
                  disabled={isNavigationBlocked}
                />
              </div>
              
              {/* Package Name Content - MOVED LEFT towards checkbox */}
              <div className="col-span-4 text-left -ml-9">
                <div className="font-medium text-gray-900 truncate" title={pkg.name}>
                  {pkg.name}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                  <span>Created By: {pkg.createdBy || pkg.modifiedBy || 'Unknown'}</span>
                </div>
              </div>
              
              {/* Description Content */}
              <div className="col-span-4 text-left ml-1">
                <div 
                  className="text-sm text-gray-600 line-clamp-2" 
                  title={pkg.description}
                >
                  {pkg.description || 'No description available'}
                </div>
              </div>
              
              {/* Version Content */}
              <div className="col-span-1 text-left ml-1">
                <span className="text-sm text-gray-900">{pkg.version}</span>
              </div>
              
              {/* Date Content */}
              <div className="col-span-2 text-left ml-1">
                <div className="text-sm text-gray-900">
                  {formatDate(pkg.modifiedDate)}
                </div>
                <div className="text-xs text-gray-500">
                  {pkg.modifiedBy || 'Unknown User'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PackageTable;