import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import { SortField, SortDirection } from './PackageTable';

interface PackageSearchAndSortProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: SortField) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  packagesPerPage: number;
  onPackagesPerPageChange: (value: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  isNavigationBlocked?: boolean;
}

const PackageSearchAndSort: React.FC<PackageSearchAndSortProps> = ({
  searchTerm,
  onSearchChange,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  packagesPerPage,
  onPackagesPerPageChange,
  onRefresh,
  isLoading = false,
  isNavigationBlocked = false,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Search and Refresh Row */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search packages by name or description..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            disabled={isNavigationBlocked}
          />
        </div>
        
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading || isNavigationBlocked}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Sort and Pagination Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Sort Field */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
          <Select 
            value={sortField} 
            onValueChange={(value: SortField) => onSortFieldChange(value)}
            disabled={isNavigationBlocked}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Package Name</SelectItem>
              <SelectItem value="modifiedDate">Modified Date</SelectItem>
              <SelectItem value="modifiedBy">Modified By</SelectItem>
              <SelectItem value="createdDate">Created Date</SelectItem>
              <SelectItem value="createdBy">Created By</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Direction */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Order:</label>
          <Select 
            value={sortDirection} 
            onValueChange={(value: SortDirection) => onSortDirectionChange(value)}
            disabled={isNavigationBlocked}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page Size */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-gray-600 whitespace-nowrap">Show:</label>
          <Select 
            value={packagesPerPage.toString()} 
            onValueChange={onPackagesPerPageChange}
            disabled={isNavigationBlocked}
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
          <span className="text-sm text-gray-600 whitespace-nowrap">per page</span>
        </div>
      </div>
    </div>
  );
};

export default PackageSearchAndSort;