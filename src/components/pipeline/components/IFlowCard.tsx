// File Path: src/components/pipeline/components/IFlowCard.tsx
// Filename: IFlowCard.tsx

import { Checkbox } from "@/components/ui/checkbox";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { IFlowCardProps } from '../types/IFlowTypes';
import { 
  formatIFlowModifiedDate, 
  getIFlowExactDateString, 
  formatVersion, 
  formatAuthor 
} from '../utils/IFlowHelpers';

export const IFlowCard: React.FC<IFlowCardProps> = ({
  iflow,
  isSelected,
  onToggle,
  showPackageName = false
}) => {
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
        {/* Selection Checkbox */}
        <div className="pt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(iflow.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* iFlow Details */}
        <div className="flex-1 min-w-0">
          {/* iFlow Name - retain original font size and format */}
          <div className="font-semibold text-gray-900 mb-2 text-base">
            {iflow.name}
          </div>

          {/* iFlow Description - left aligned with retained font size */}
          <div className="text-sm text-gray-600 mb-3 text-left leading-relaxed">
            {iflow.description || "No description available"}
          </div>

          {/* Clean Details Section */}
          <div className="space-y-1 text-sm">
            {/* Last Modified with smart date */}
            <div className="flex items-center text-gray-700">
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
            </div>

            {/* Last Modified By */}
            <div className="flex items-center text-gray-700">
              <span className="font-medium">Last Modified By:</span>
              <span className="ml-2">{formatAuthor(iflow.author)}</span>
            </div>

            {/* Version */}
            <div className="flex items-center text-gray-700">
              <span className="font-medium">{formatVersion(iflow.version)}</span>
            </div>

            {/* Optional: Show package name if requested */}
            {showPackageName && iflow.packageName && (
              <div className="flex items-center text-gray-500 text-xs">
                <span className="font-medium">Package:</span>
                <span className="ml-2">{iflow.packageName}</span>
              </div>
            )}

            {/* Optional: Show parameter count if available (for Configuration Tab) */}
            {iflow.parameterCount !== undefined && (
              <div className="flex items-center justify-between">
                <div></div>
                <div className="text-right text-gray-600 text-sm">
                  <span className="font-medium">{iflow.parameterCount} parameters</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};