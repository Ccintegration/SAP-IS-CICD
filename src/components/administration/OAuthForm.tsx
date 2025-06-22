// File Path: src/components/administration/OAuthForm.tsx
// Filename: OAuthForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, Globe, Shield, Server, AlertCircle } from "lucide-react";
import { TenantFormData } from "@/lib/types";

const oauthSchema = z.object({
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
    .refine((url) => url.startsWith("https://"), "Base URL must use HTTPS"),
  environment: z.enum(["dev", "qa", "production"], {
    required_error: "Please select an environment level",
  }),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  tokenUrl: z
    .string()
    .url("Please enter a valid token URL")
    .refine((url) => url.startsWith("https://"), "Token URL must use HTTPS"),
  scope: z.string().optional(),
  grantType: z.enum(["client_credentials", "authorization_code"]),
  audience: z.string().optional(),
  redirectUri: z
    .string()
    .url("Please enter a valid redirect URI")
    .optional()
    .or(z.literal("")),
  isBaseTenant: z.boolean().optional(),
});

type OAuthFormData = z.infer<typeof oauthSchema>;

interface OAuthFormProps {
  onSubmit: (data: TenantFormData) => void;
  isLoading: boolean;
  error?: string;
}

const OAuthForm: React.FC<OAuthFormProps> = ({
  onSubmit,
  isLoading,
  error,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<OAuthFormData>({
    resolver: zodResolver(oauthSchema),
    defaultValues: {
      grantType: "client_credentials",
      baseUrl: "https://",
      tokenUrl: "https://",
      environment: "dev", // Default to dev environment
    },
  });

  const grantType = watch("grantType");
  const environment = watch("environment");

  const handleFormSubmit = async (data: OAuthFormData) => {
    try {
      console.log("🚀 [Form] Submitting tenant registration:", data);
      
      const formattedData: TenantFormData = {
        name: data.name,
        description: data.description,
        baseUrl: data.baseUrl,
        environment: data.environment,
        isBaseTenant: data.isBaseTenant,
        oauthCredentials: {
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          tokenUrl: data.tokenUrl,
          scope: data.scope,
          grantType: data.grantType,
          audience: data.audience,
          redirectUri: data.redirectUri || undefined,
        },
      };
      
      console.log("🚀 [Form] Formatted data for submission:", formattedData);
      
      // Call the parent submit handler
      await onSubmit(formattedData);
      
      console.log("✅ [Form] Tenant registration completed successfully");
      
    } catch (error) {
      console.error("❌ [Form] Tenant registration failed:", error);
      // Error handling is done in the parent component
    }
  };

  const handleReset = () => {
    reset({
      grantType: "client_credentials",
      baseUrl: "https://",
      tokenUrl: "https://",
      environment: "dev",
    });
  };

  const getEnvironmentDescription = (env: string) => {
    switch (env) {
      case "dev":
        return "Development environment for testing and development";
      case "qa":
        return "Quality assurance environment for testing before production";
      case "production":
        return "Live production environment for business operations";
      default:
        return "";
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case "dev":
        return "text-blue-600";
      case "qa":
        return "text-yellow-600";
      case "production":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tenant Information Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">SAP Cloud Integration Tenant Information</CardTitle>
          </div>
          <CardDescription>
            Basic information about the SAP Cloud Integration tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Tenant Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g., Production SAP Cloud Integration"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
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

          <div>
            <Label htmlFor="baseUrl" className="text-sm font-medium">
              Base URL *
            </Label>
            <Input
              id="baseUrl"
              placeholder="https://your-tenant.it-cpi024.cfapps.eu10-002.hana.ondemand.com"
              {...register("baseUrl")}
              className={errors.baseUrl ? "border-red-500" : ""}
            />
            {errors.baseUrl && (
              <p className="text-sm text-red-600 mt-1">
                {errors.baseUrl.message}
              </p>
            )}
          </div>

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

      {/* Environment Selection Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Environment Level</CardTitle>
          </div>
          <CardDescription>
            Select the environment level for this SAP Cloud Integration tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Environment Type *
            </Label>
            <RadioGroup
              value={environment}
              onValueChange={(value) => setValue("environment", value as any)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="dev" id="env-dev" />
                <div className="flex-1">
                  <Label
                    htmlFor="env-dev"
                    className={`text-sm font-medium cursor-pointer ${getEnvironmentColor("dev")}`}
                  >
                    Development
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    For development and testing
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="qa" id="env-qa" />
                <div className="flex-1">
                  <Label
                    htmlFor="env-qa"
                    className={`text-sm font-medium cursor-pointer ${getEnvironmentColor("qa")}`}
                  >
                    QA/Testing
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    For quality assurance
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="production" id="env-production" />
                <div className="flex-1">
                  <Label
                    htmlFor="env-production"
                    className={`text-sm font-medium cursor-pointer ${getEnvironmentColor("production")}`}
                  >
                    Production
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    For live business operations
                  </p>
                </div>
              </div>
            </RadioGroup>
            
            {errors.environment && (
              <p className="text-sm text-red-600 mt-1">
                {errors.environment.message}
              </p>
            )}
            
            {environment && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Selected:</strong> {environment.charAt(0).toUpperCase() + environment.slice(1)} - {getEnvironmentDescription(environment)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OAuth Configuration Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">OAuth Configuration</CardTitle>
          </div>
          <CardDescription>
            OAuth 2.0 credentials for authenticating with the SAP Cloud Integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientId" className="text-sm font-medium">
                Client ID *
              </Label>
              <Input
                id="clientId"
                placeholder="Your OAuth client ID"
                {...register("clientId")}
                className={errors.clientId ? "border-red-500" : ""}
              />
              {errors.clientId && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.clientId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="clientSecret" className="text-sm font-medium">
                Client Secret *
              </Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="Your OAuth client secret"
                {...register("clientSecret")}
                className={errors.clientSecret ? "border-red-500" : ""}
              />
              {errors.clientSecret && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.clientSecret.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="tokenUrl" className="text-sm font-medium">
              Token URL *
            </Label>
            <Input
              id="tokenUrl"
              placeholder="https://your-tenant.authentication.eu10.hana.ondemand.com/oauth/token"
              {...register("tokenUrl")}
              className={errors.tokenUrl ? "border-red-500" : ""}
            />
            {errors.tokenUrl && (
              <p className="text-sm text-red-600 mt-1">
                {errors.tokenUrl.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="grantType" className="text-sm font-medium">
              Grant Type *
            </Label>
            <Select
              value={grantType}
              onValueChange={(value) => setValue("grantType", value as any)}
            >
              <SelectTrigger
                className={errors.grantType ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select grant type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client_credentials">
                  Client Credentials
                </SelectItem>
                <SelectItem value="authorization_code">
                  Authorization Code
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.grantType && (
              <p className="text-sm text-red-600 mt-1">
                {errors.grantType.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scope" className="text-sm font-medium">
                Scope
              </Label>
              <Input
                id="scope"
                placeholder="e.g., read write admin"
                {...register("scope")}
                className={errors.scope ? "border-red-500" : ""}
              />
              {errors.scope && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.scope.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="audience" className="text-sm font-medium">
                Audience
              </Label>
              <Input
                id="audience"
                placeholder="OAuth audience (optional)"
                {...register("audience")}
                className={errors.audience ? "border-red-500" : ""}
              />
              {errors.audience && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.audience.message}
                </p>
              )}
            </div>
          </div>

          {grantType === "authorization_code" && (
            <div>
              <Label htmlFor="redirectUri" className="text-sm font-medium">
                Redirect URI
              </Label>
              <Input
                id="redirectUri"
                placeholder="https://your-app.com/callback"
                {...register("redirectUri")}
                className={errors.redirectUri ? "border-red-500" : ""}
              />
              {errors.redirectUri && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.redirectUri.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isLoading || isSubmitting}
        >
          Reset Form
        </Button>

        <div className="flex items-center space-x-3">
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing & Registering...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Test & Register Tenant
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default OAuthForm;