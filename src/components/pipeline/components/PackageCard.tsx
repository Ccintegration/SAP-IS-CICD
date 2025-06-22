// File Path: src/components/pipeline/components/PackageCard.tsx
// Filename: PackageCard.tsx

import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  User,
  Package as PackageIcon,
  Loader2,
} from "lucide-react";
import { Package } from '../types/PackageTypes';
import { formatModifiedDate, getExactDateString } from '../utils/DateUtils';
import { getStatusBadgeColor } from '../utils/PaginationUtils';

interface PackageCardProps {
  package: Package;
  isSelected: boolean;
  onToggle: (packageId: string) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({
  package: pkg,
  isSelected,
  onToggle,
}) => {
  return (
    <div
      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
        isSelected
          ? "border-blue-300 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => onToggle(pkg.id)}
    >
      <div className="flex items-start space-x-3">
        <Checkbox
          checked={isSelected}
          onChange={() => onToggle(pkg.id)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          {/* Header with title and badges */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate">
              {pkg.name}
            </h3>
            <div className="flex items-center space-x-2 ml-4">
              <Badge className={getStatusBadgeColor(pkg.status)}>
                {pkg.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                v{pkg.version}
              </Badge>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {pkg.description}
          </p>
          
          {/* Metadata row */}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            {/* Modified Date with Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-1 cursor-help">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatModifiedDate(pkg.modifiedDate)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    Last modified: {getExactDateString(pkg.modifiedDate)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Modified By */}
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{pkg.modifiedBy}</span>
            </div>
            
            {/* iFlow Count */}
            <div className="flex items-center space-x-1">
              <PackageIcon className="w-3 h-3" />
              {pkg.iflowCountLoading ? (
                <div className="flex items-center space-x-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : pkg.iflowCountLoaded ? (
                <span>{pkg.iflowCount} iFlows</span>
              ) : (
                <span className="text-gray-400">iFlows: --</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;