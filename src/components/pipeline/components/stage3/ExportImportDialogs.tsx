// File Path: src/components/pipeline/components/stage3/ExportImportDialogs.tsx
// Filename: ExportImportDialogs.tsx

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface IFlowConfiguration {
  iflowId: string;
  iflowName: string;
  packageId: string;
  packageName: string;
  version: string;
  parameters: any[];
}

interface ExportImportDialogsProps {
  exportDialogOpen: boolean;
  importDialogOpen: boolean;
  exportFormat: 'json' | 'csv' | 'xml';
  importFile: File | null;
  selectedIFlow: IFlowConfiguration | null;
  selectedEnvironment: string;
  onExportDialogChange: (open: boolean) => void;
  onImportDialogChange: (open: boolean) => void;
  onExportFormatChange: (format: 'json' | 'csv' | 'xml') => void;
  onImportFileChange: (file: File | null) => void;
  onExport: () => void;
  onImport: () => void;
}

export const ExportImportDialogs: React.FC<ExportImportDialogsProps> = ({
  exportDialogOpen,
  importDialogOpen,
  exportFormat,
  importFile,
  selectedIFlow,
  selectedEnvironment,
  onExportDialogChange,
  onImportDialogChange,
  onExportFormatChange,
  onImportFileChange,
  onExport,
  onImport,
}) => {
  return (
    <>
      {/* EXPORT DIALOG */}
      <Dialog open={exportDialogOpen} onOpenChange={onExportDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Configuration</DialogTitle>
            <DialogDescription>
              Export the current configuration for{" "}
              <strong>{selectedIFlow?.iflowName || "selected iFlow"}</strong> in{" "}
              <strong>{selectedEnvironment}</strong> environment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <Select 
                value={exportFormat} 
                onValueChange={(value: 'json' | 'csv' | 'xml') => onExportFormatChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    JSON - Structured data format
                  </SelectItem>
                  <SelectItem value="csv">
                    CSV - Spreadsheet compatible
                  </SelectItem>
                  <SelectItem value="xml">
                    XML - Markup language format
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedIFlow && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Export Details:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><strong>Package:</strong> {selectedIFlow.packageName}</div>
                  <div><strong>iFlow:</strong> {selectedIFlow.iflowName}</div>
                  <div><strong>Version:</strong> {selectedIFlow.version}</div>
                  <div><strong>Parameters:</strong> {selectedIFlow.parameters.length}</div>
                  <div><strong>Environment:</strong> {selectedEnvironment}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onExportDialogChange(false)}>
              Cancel
            </Button>
            <Button onClick={onExport} disabled={!selectedIFlow}>
              Export Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMPORT DIALOG */}
      <Dialog open={importDialogOpen} onOpenChange={onImportDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Configuration</DialogTitle>
            <DialogDescription>
              Import configuration for{" "}
              <strong>{selectedIFlow?.iflowName || "selected iFlow"}</strong>.{" "}
              Supported formats: JSON, CSV.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Configuration File</Label>
              <Input
                type="file"
                accept=".json,.csv"
                onChange={(e) => onImportFileChange(e.target.files?.[0] || null)}
              />
            </div>
            {importFile && (
              <div className="text-sm text-gray-600">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">File Details:</h4>
                  <div><strong>Name:</strong> {importFile.name}</div>
                  <div><strong>Size:</strong> {(importFile.size / 1024).toFixed(1)} KB</div>
                  <div><strong>Type:</strong> {importFile.type || 'Unknown'}</div>
                </div>
              </div>
            )}
            
            {selectedIFlow && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Import Target:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><strong>Package:</strong> {selectedIFlow.packageName}</div>
                  <div><strong>iFlow:</strong> {selectedIFlow.iflowName}</div>
                  <div><strong>Current Parameters:</strong> {selectedIFlow.parameters.length}</div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  ⚠️ Importing will overwrite existing parameter values
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { 
                onImportDialogChange(false); 
                onImportFileChange(null); 
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={onImport} 
              disabled={!importFile || !selectedIFlow}
            >
              Import Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};