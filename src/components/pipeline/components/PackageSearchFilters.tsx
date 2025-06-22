// File Path: src/components/pipeline/components/PackageSearchFilters.tsx
// Filename: PackageSearchFilters.tsx

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface PackageSearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  packagesPerPage: number;
  onPackagesPerPageChange: (value: string) => void;
  currentPackagesCount: number;
  onSelectAll: () => void;
  isSelectAllChecked: boolean;
  isLoadingCounts?: boolean;
  isNavigationBlocked?: boolean; // ✅ FIXED: Add navigation blocking prop
}

const PackageSearchFilters: React.FC<PackageSearchFiltersProps> = ({
  searchTerm,
  onSearchChange,
  packagesPerPage,
  onPackagesPerPageChange,
  currentPackagesCount,
  onSelectAll,
  isSelectAllChecked,
  isLoadingCounts = false,
  isNavigationBlocked = false, // ✅ FIXED: Default value for navigation blocking
}) => {
  return (
    <div className="flex items-center justify-between space-x-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search packages..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          disabled={isNavigationBlocked} // ✅ FIXED: Disable during navigation blocking
        />
      </div>
      
      {/* Packages per page selector */}
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600">Show:</label>
        <Select 
          value={packagesPerPage.toString()} 
          onValueChange={onPackagesPerPageChange}
          disabled={isNavigationBlocked} // ✅ FIXED: Disable during navigation blocking
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="30">30</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600">per page</span>
      </div>

      {/* Select All Button */}
      <Button
        variant="outline"
        onClick={onSelectAll}
        disabled={currentPackagesCount === 0 || isLoadingCounts || isNavigationBlocked} // ✅ FIXED: Also disable during navigation blocking
      >
        {isSelectAllChecked ? "Deselect Page" : "Select Page"}
      </Button>
    </div>
  );
};

export default PackageSearchFilters;