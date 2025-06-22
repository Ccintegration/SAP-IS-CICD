import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { TenantFormData, JsonUploadData } from "@/lib/types";
import { TenantService } from "@/lib/tenant-service";

const jsonUploadSchema = z.object({
  name: z
    .string()
    .min(1, "Tenant name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  baseUrl: z
    .string()
    .url("Please enter a valid URL")
    .refine((url) => url.startsWith("https://"), "Base URL must use HTTPS")
    .optional(),
  isBaseTenant: z.boolean().optional(),
});

type JsonUploadFormData = z.infer<typeof jsonUploadSchema>;

interface JsonUploadProps {
  onSubmit: (data: TenantFormData) => void;
  isLoading: boolean;
  error?: string;
}

const JsonUpload: React.FC<JsonUploadProps> = ({
  onSubmit,
  isLoading,
  error,
}) => {
  const [uploadedData, setUploadedData] = useState<JsonUploadData | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<JsonUploadFormData>({
    resolver: zodResolver(jsonUploadSchema),
  });

  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploadError("");
      setValidationErrors([]);

      if (!file.type.includes("json") && !file.name.endsWith(".json")) {
        setUploadError("Please upload a valid JSON file");
        return;
      }

      if (file.size > 1024 * 1024) {
        // 1MB limit
        setUploadError("File size must be less than 1MB");
        return;
      }

      try {
        const text = await file.text();
        const rawData = JSON.parse(text);

        const validation = TenantService.validateJsonUpload(rawData);
        if (!validation.isValid) {
          setValidationErrors(validation.errors);
          setUploadError("Invalid JSON format or missing required fields");
          return;
        }

        // Convert to internal format
        const convertedData =
          TenantService.convertSAPOAuthConfigToJsonUpload(rawData);
        setUploadedData(convertedData);

        // Auto-fill form fields if they exist in the JSON
        if (convertedData.name) setValue("name", convertedData.name);
        if (convertedData.description)
          setValue("description", convertedData.description);
        if (convertedData.baseUrl) setValue("baseUrl", convertedData.baseUrl);
      } catch (err) {
        setUploadError("Invalid JSON file. Please check the file format.");
      }
    },
    [setValue],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  const handleFormSubmit = (formData: JsonUploadFormData) => {
    if (!uploadedData) {
      setUploadError("Please upload a JSON file with OAuth credentials");
      return;
    }

    const tenantData: TenantFormData = {
      name: formData.name,
      description: formData.description,
      baseUrl: formData.baseUrl || uploadedData.baseUrl || "",
      isBaseTenant: formData.isBaseTenant,
      oauthCredentials: {
        clientId: uploadedData.clientId,
        clientSecret: uploadedData.clientSecret,
        tokenUrl: uploadedData.tokenUrl,
        scope: uploadedData.scope,
        grantType: (uploadedData.grantType as any) || "client_credentials",
        audience: uploadedData.audience,
        redirectUri: uploadedData.redirectUri,
      },
    };

    onSubmit(tenantData);
  };

  const downloadSampleJson = () => {
    const sampleData = {
      oauth: {
        createdate: "2025-02-25T00:29:18.059Z",
        clientid: "sb-4d88ec4d-cf00-4e40-b9a3-bf20640f4941!b236015|it!b182722",
        clientsecret:
          "68998671-12de-4a2c-ab02-8968d571b4cd$1hejXEfNv1qrX8raaVfuD_x-6PtP1xub7uRFmr55gaI=",
        tokenurl:
          "https://your-tenant.authentication.eu10.hana.ondemand.com/oauth/token",
        url: "https://your-tenant.it-cpi024.cfapps.eu10-002.hana.ondemand.com",
      },
    };

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sap-oauth-config-sample.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearUpload = () => {
    setUploadedData(null);
    setUploadError("");
    setValidationErrors([]);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">
                Upload OAuth Configuration
              </CardTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadSampleJson}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Sample JSON
            </Button>
          </div>
          <CardDescription>
            Upload a JSON file containing OAuth credentials for the SAP
            Integration Suite. Supports both SAP OAuth export format and legacy
            formats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"}
              ${uploadedData ? "border-green-500 bg-green-50" : ""}
              ${uploadError ? "border-red-500 bg-red-50" : ""}
            `}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {uploadedData ? (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-green-800">
                    File uploaded successfully!
                  </p>
                  <p className="text-sm text-green-600">
                    OAuth credentials detected and validated
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearUpload}
                >
                  Upload Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText
                  className={`w-12 h-12 mx-auto ${uploadError ? "text-red-500" : "text-gray-400"}`}
                />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    {isDragOver
                      ? "Drop your JSON file here"
                      : "Upload OAuth Configuration"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Drag and drop a SAP OAuth config file, or click to browse
                  </p>
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="w-4 h-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Validation errors:</p>
                  <ul className="list-disc list-inside text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Data Preview */}
      {uploadedData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Uploaded Configuration</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCredentials(!showCredentials)}
              >
                {showCredentials ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show Details
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Client ID
                </Label>
                <p className="text-sm bg-gray-50 p-2 rounded border">
                  {showCredentials ? uploadedData.clientId : "••••••••••••••••"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Grant Type
                </Label>
                <Badge variant="secondary" className="mt-1">
                  {uploadedData.grantType || "client_credentials"}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-600">
                  Token URL
                </Label>
                <p className="text-sm bg-gray-50 p-2 rounded border break-all">
                  {uploadedData.tokenUrl}
                </p>
              </div>
              {uploadedData.scope && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Scope
                  </Label>
                  <p className="text-sm bg-gray-50 p-2 rounded border">
                    {uploadedData.scope}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Fields */}
      {uploadedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tenant Details</CardTitle>
            <CardDescription>
              Complete the tenant information and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Tenant Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g., Production SAP IS"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Optional description of this tenant"
                rows={3}
                {...register("description")}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {!uploadedData.baseUrl && (
              <div>
                <Label htmlFor="baseUrl" className="text-sm font-medium">
                  Base URL *
                </Label>
                <Input
                  id="baseUrl"
                  placeholder="https://your-tenant.sap.com"
                  {...register("baseUrl")}
                  className={errors.baseUrl ? "border-red-500" : ""}
                />
                {errors.baseUrl && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.baseUrl.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox id="isBaseTenant" {...register("isBaseTenant")} />
              <div className="space-y-1">
                <Label
                  htmlFor="isBaseTenant"
                  className="text-sm font-medium text-blue-900"
                >
                  Base Tenant
                </Label>
                <p className="text-xs text-blue-700">
                  Mark this tenant as a base tenant to automatically display its
                  packages and iFlows in the CI/CD Pipeline
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {uploadedData && (
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={clearUpload}
            disabled={isLoading}
          >
            Clear & Start Over
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Test & Register Tenant
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
};

export default JsonUpload;
