// PackageTable.tsx - Fix 2: Remove Active Badge and Change to Created By
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
      // Handle Unix timestamp (from SAP API)
      const timestamp = parseInt(dateString, 10);
      if (!isNaN(timestamp)) {
        return new Date(timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      // Handle ISO date string
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "deprecated":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
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
      {/* Table Header - ✅ FIX 6: All headers aligned left */}
      <div className="bg-gray-50 border-b">
        <div className="grid grid-cols-12 gap-4 p-3 items-center">
          {/* Select All Checkbox */}
          <div className="col-span-1 text-left">
            <Checkbox
              checked={isSelectAllChecked}
              onCheckedChange={onSelectAll}
              disabled={packages.length === 0 || isNavigationBlocked}
            />
          </div>
          
          {/* ✅ FIX 6: Left-aligned Package Name Header */}
          <div className="col-span-4 text-left">
            <SortButton field="name">Package Name</SortButton>
          </div>
          
          {/* ✅ FIX 6: Left-aligned Description Header */}
          <div className="col-span-4 text-left">
            <span className="text-sm font-medium text-gray-700">Description</span>
          </div>
          
          {/* ✅ FIX 6: Left-aligned Version Header */}
          <div className="col-span-1 text-left">
            <span className="text-sm font-medium text-gray-700">Version</span>
          </div>
          
          {/* ✅ FIX 6: Left-aligned Date Header */}
          <div className="col-span-2 text-left">
            <SortButton field="modifiedDate">Modified Date</SortButton>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {packages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-lg mb-2">No packages found</div>
            <div className="text-sm">Try adjusting your search criteria</div>
          </div>
        ) : (
          packages.map((pkg) => (
            <div key={pkg.id} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-gray-50 transition-colors">
              {/* Select Checkbox */}
              <div className="col-span-1 text-left">
                <Checkbox
                  checked={selectedPackages.includes(pkg.id)}
                  onCheckedChange={() => onPackageToggle(pkg.id)}
                  disabled={isNavigationBlocked}
                />
              </div>
              
              {/* ✅ FIX 6: Left-aligned Package Name Content */}
              <div className="col-span-4 text-left">
                <div className="font-medium text-gray-900 truncate" title={pkg.name}>
                  {pkg.name}
                </div>
                {/* ✅ FIX 2: Removed the active badge and changed "Modified by" to "Created By" */}
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                  <span>Created By: {pkg.createdBy || pkg.modifiedBy || 'Unknown'}</span>
                </div>
              </div>
              
              {/* ✅ FIX 6: Left-aligned Description Content */}
              <div className="col-span-4 text-left">
                <div 
                  className="text-sm text-gray-600 line-clamp-2" 
                  title={pkg.description}
                >
                  {pkg.description || 'No description available'}
                </div>
              </div>
              
              {/* ✅ FIX 6: Left-aligned Version Content */}
              <div className="col-span-1 text-left">
                <span className="text-sm text-gray-900">{pkg.version}</span>
              </div>
              
              {/* ✅ FIX 6: Left-aligned Date Content */}
              <div className="col-span-2 text-left">
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