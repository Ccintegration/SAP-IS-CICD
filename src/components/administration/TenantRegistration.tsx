// File Path: src/components/administration/TenantRegistration.tsx
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Edit,
  CheckCircle,
  Settings,
  Database,
  Users,
  Trash2,
  ExternalLink,
  Plus,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import OAuthForm from "./OAuthForm";
import JsonUpload from "./JsonUpload";
import ConnectionTest from "./ConnectionTest";
import { TenantFormData, ConnectionTestResult, SAPTenant } from "@/lib/types";
import { TenantService } from "@/lib/tenant-service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TenantRegistration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"form" | "upload">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionResult, setConnectionResult] =
    useState<ConnectionTestResult | null>(null);
  const [error, setError] = useState<string>("");
  const [registeredTenants, setRegisteredTenants] = useState<SAPTenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  
  // New state for controlling the form expansion
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  React.useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setIsLoadingTenants(true);
      const tenants = await TenantService.getAllTenants();
      setRegisteredTenants(tenants);
    } catch (err) {
      toast.error("Failed to load registered tenants");
    } finally {
      setIsLoadingTenants(false);
    }
  };

  // Enhanced error handling with timeout and better debugging
  const handleSubmit = async (data: TenantFormData) => {
    if (isLoading) {
      console.log("Form is already submitting, ignoring duplicate request");
      return; // Prevent double-clicks
    }
    
    setIsLoading(true);
    setError("");
    setConnectionResult(null);

    try {
      console.log("Starting tenant registration process...", {
        tenantName: data.name,
        baseUrl: data.baseUrl,
        hasCredentials: !!data.oauthCredentials.clientId
      });

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 45 seconds')), 45000)
      );

      // Test backend connection first
      console.log("Step 1: Testing backend connectivity...");
      const backendHealthy = await testBackendConnection();
      if (!backendHealthy) {
        throw new Error("Backend server is not accessible. Please ensure your Python FastAPI backend is running on http://localhost:8000");
      }

      console.log("Step 2: Testing SAP connection and registering tenant...");
      
      const registrationPromise = TenantService.testConnection(
        data.oauthCredentials,
        data.baseUrl,
      );
      
      const result = await Promise.race([registrationPromise, timeoutPromise]);
      
      console.log("Registration result:", result);
      setConnectionResult(result);

      if (result.success) {
        console.log("Step 3: Creating tenant in system...");
        
        // If connection is successful, create the tenant
        const newTenant = await TenantService.createTenant(data);
        await TenantService.updateTenantConnectionStatus(
          newTenant.id,
          "connected",
        );

        toast.success("Tenant registered successfully!", {
          description: `${data.name} has been added to your tenants.`,
        });

        // Reload tenants list
        await loadTenants();

        // Reset form state and collapse the form
        setConnectionResult(null);
        setIsFormExpanded(false);
        
        console.log("✅ Tenant registration completed successfully");
      } else {
        console.log("❌ Connection test failed:", result.message);
        toast.error("Connection test failed", {
          description: result.message || "Please check your credentials and try again.",
        });
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      
      let errorMessage = "Registration failed";
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Provide specific guidance for common errors
        if (err.message.includes('timeout')) {
          errorMessage = "Request timed out. This usually means the backend is not running or not accessible.";
        } else if (err.message.includes('fetch')) {
          errorMessage = "Cannot connect to backend. Please ensure your Python FastAPI backend is running on http://localhost:8000";
        }
      }
      
      setError(errorMessage);
      toast.error("Registration failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Backend connection test helper
  const testBackendConnection = async (): Promise<boolean> => {
    try {
      console.log("Testing backend connection...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Backend health check failed: HTTP ${response.status}`);
      }
      
      const health = await response.json();
      console.log("✅ Backend health check passed:", health);
      return true;
    } catch (error) {
      console.error("❌ Backend connection test failed:", error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast.error("Backend Connection Timeout", {
            description: "Backend server did not respond within 10 seconds. Please check if it's running.",
          });
        } else {
          toast.error("Backend Unavailable", {
            description: "Cannot connect to the backend service. Please ensure your Python FastAPI backend is running on http://localhost:8000",
          });
        }
      }
      
      return false;
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      await TenantService.deleteTenant(tenantId);
      toast.success("Tenant deleted successfully");
      await loadTenants();
    } catch (err) {
      toast.error("Failed to delete tenant");
    }
  };

  const handleTestConnection = async (tenant: SAPTenant) => {
    try {
      // Test backend connectivity first
      const backendHealthy = await testBackendConnection();
      if (!backendHealthy) {
        return;
      }

      const result = await TenantService.testConnection(
        tenant.oauthCredentials,
        tenant.baseUrl,
      );

      const newStatus = result.success ? "connected" : "error";
      await TenantService.updateTenantConnectionStatus(tenant.id, newStatus);
      await loadTenants();

      toast[result.success ? "success" : "error"](
        result.success ? "Connection restored" : "Connection failed",
        { description: result.message },
      );
    } catch (err) {
      await TenantService.updateTenantConnectionStatus(tenant.id, "error");
      await loadTenants();
      toast.error("Connection test failed");
    }
  };

  const getStatusBadge = (status: SAPTenant["connectionStatus"]) => {
    const variants = {
      connected: {
        variant: "default" as const,
        color: "bg-green-100 text-green-800 border-green-300",
      },
      disconnected: {
        variant: "secondary" as const,
        color: "bg-gray-100 text-gray-800 border-gray-300",
      },
      testing: {
        variant: "outline" as const,
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      error: {
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800 border-red-300",
      },
    };

    const config = variants[status];
    return (
      <Badge className={config.color}>
        {String(status).charAt(0).toUpperCase() + String(status).slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Registration Section - Minimized/Expandable */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-xl">
                Register SAP Integration Suite Tenant
              </CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="flex items-center space-x-2"
                  >
                    {isFormExpanded ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {isFormExpanded ? "Minimize" : "Register Tenant"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Register Tenant</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {!isFormExpanded && (
            <CardDescription>
              Add a new SAP Integration Suite tenant by providing OAuth
              credentials manually or uploading a configuration file.
            </CardDescription>
          )}
        </CardHeader>
        
        {/* Expandable Content */}
        {isFormExpanded && (
          <CardContent>
            <CardDescription className="mb-6">
              Add a new SAP Integration Suite tenant by providing OAuth
              credentials manually or uploading a configuration file.
            </CardDescription>
            
            {/* Backend Status Alert */}
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Backend Required:</strong> This form requires a Python FastAPI backend running on http://localhost:8000. 
                Make sure to start your backend with: <code className="bg-blue-100 px-1 rounded">cd backend && python main.py</code>
              </AlertDescription>
            </Alert>
            
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as any)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="form" className="flex items-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Manual Entry</span>
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>JSON Upload</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="mt-6">
                <OAuthForm
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  error={error}
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-6">
                <JsonUpload
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  error={error}
                />
              </TabsContent>
            </Tabs>

            <ConnectionTest
              isLoading={isLoading}
              result={connectionResult}
              error={error}
            />
          </CardContent>
        )}
      </Card>

      {/* Registered Tenants Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-xl">Registered Tenants</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTenants}
              disabled={isLoadingTenants}
            >
              Refresh
            </Button>
          </div>
          <CardDescription>
            Manage your registered SAP Integration Suite tenants and monitor
            their connection status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTenants ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-500">Loading tenants...</p>
              </div>
            </div>
          ) : registeredTenants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Tenants Registered
              </h3>
              <p className="text-gray-500 mb-4">
                Register your first SAP Integration Suite tenant using the form
                above.
              </p>
              <Button
                onClick={() => setIsFormExpanded(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Register First Tenant</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registeredTenants.map((tenant) => (
                <Card key={tenant.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">
                            {tenant.name}
                          </CardTitle>
                          {tenant.isBaseTenant && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                              Base Tenant
                            </Badge>
                          )}
                        </div>
                        {tenant.description && (
                          <CardDescription className="text-sm">
                            {tenant.description}
                          </CardDescription>
                        )}
                      </div>
                      {getStatusBadge(tenant.connectionStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">Environment:</span>
                        <Badge
                          variant="outline"
                          className={`${
                            tenant.environment === "dev"
                              ? "border-blue-300 text-blue-700"
                              : tenant.environment === "qa"
                                ? "border-yellow-300 text-yellow-700"
                                : "border-red-300 text-red-700"
                          }`}
                        >
                          {tenant.environment?.toUpperCase() || "UNKNOWN"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">Base URL:</span>
                        <span className="text-gray-600 truncate">
                          {tenant.baseUrl}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => window.open(tenant.baseUrl, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(tenant)}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Test Connection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantRegistration;