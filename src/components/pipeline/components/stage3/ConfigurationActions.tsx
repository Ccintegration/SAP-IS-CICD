// File Path: src/components/pipeline/components/stage3/ConfigurationActions.tsx
// Filename: ConfigurationActions.tsx

import React from "react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Upload,
} from "lucide-react";

// Types
interface IFlowConfiguration {
  iflowId: string;
  iflowName: string;
  packageId: string;
  packageName: string;
  version: string;
  parameters: any[];
}

interface ConfigurationActionsProps {
  saving: boolean;
  saveSuccess: boolean;
  error: string | null;
  selectedIFlow: IFlowConfiguration | null;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const ConfigurationActions: React.FC<ConfigurationActionsProps> = ({
  saving,
  saveSuccess,
  error,
  selectedIFlow,
  onSave,
  onExport,
  onImport,
  onReset,
  onPrevious,
  onNext,
}) => {
  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExport}
            className="flex items-center space-x-2"
            disabled={!selectedIFlow}
          >
            <Download className="w-4 h-4" />
            <span>Export Config</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onImport}
            className="flex items-center space-x-2"
            disabled={!selectedIFlow}
          >
            <Upload className="w-4 h-4" />
            <span>Import Config</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onReset}
            disabled={!selectedIFlow}
          >
            Reset All to Default
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          {selectedIFlow ? `${selectedIFlow.parameters.length} parameters available` : '0 parameters'}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={onPrevious}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous: iFlow Selection</span>
        </Button>

        <div className="flex items-center space-x-4">
          <Button
            onClick={onSave}
            disabled={saving || !selectedIFlow}
            className="flex items-center space-x-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Saving..." : "Save Configuration"}</span>
          </Button>

          <Button onClick={onNext} className="flex items-center space-x-2">
            <span>Next: Design Validation</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      <div className="min-h-[24px]">
        {/* Success Notification */}
        {saveSuccess && (
          <div className="flex items-center space-x-2 text-green-600 text-sm animate-in fade-in duration-300">
            <CheckCircle className="w-4 h-4" />
            <span>✅ Configuration saved successfully!</span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4" />
            <span>❌ {error}</span>
          </div>
        )}
      </div>
    </div>
  );
};