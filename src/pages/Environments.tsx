import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Server,
  Shield,
  Settings,
  Eye,
  EyeOff,
  TestTube,
  AlertTriangle,
  CheckCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import EnvironmentList from "@/components/environments/EnvironmentList";
import ConnectionForm from "@/components/environments/ConnectionForm";
import CredentialVault from "@/components/environments/CredentialVault";

const Environments = () => {
  const [activeTab, setActiveTab] = useState("environments");
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Mock environment data
  const environments = [
    {
      id: "dev",
      name: "Development",
      type: "development",
      status: "connected",
      lastTested: "2024-01-20 15:30",
      systems: [
        {
          name: "SAP S/4HANA Cloud",
          url: "https://dev-s4hana.company.com",
          status: "connected",
        },
        {
          name: "Integration Suite",
          url: "https://dev-integration.company.com",
          status: "connected",
        },
      ],
    },
    {
      id: "test",
      name: "Testing",
      type: "testing",
      status: "connected",
      lastTested: "2024-01-20 14:15",
      systems: [
        {
          name: "SAP S/4HANA Cloud",
          url: "https://test-s4hana.company.com",
          status: "connected",
        },
        {
          name: "Integration Suite",
          url: "https://test-integration.company.com",
          status: "warning",
        },
      ],
    },
    {
      id: "prod",
      name: "Production",
      type: "production",
      status: "connected",
      lastTested: "2024-01-20 16:00",
      systems: [
        {
          name: "SAP S/4HANA Cloud",
          url: "https://prod-s4hana.company.com",
          status: "connected",
        },
        {
          name: "Integration Suite",
          url: "https://prod-integration.company.com",
          status: "connected",
        },
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Server className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: "default",
      warning: "secondary",
      error: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Environment Management
          </h1>
          <p className="text-gray-600">
            Manage system connections and secure credentials
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <TestTube className="w-4 h-4 mr-2" />
            Test All Connections
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Environment
          </Button>
        </div>
      </div>

      {/* Environment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {environments.map((env) => (
          <Card
            key={env.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <CardTitle className="text-lg">{env.name}</CardTitle>
                </div>
                {getStatusBadge(env.status)}
              </div>
              <CardDescription>
                {env.systems.length} systems configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {env.systems.map((system, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(system.status)}
                      <span className="text-sm font-medium">{system.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {system.status}
                    </span>
                  </div>
                ))}

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last tested:</span>
                    <span>{env.lastTested}</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <TestTube className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Management */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="environments">Environment Details</TabsTrigger>
          <TabsTrigger value="connections">Connection Management</TabsTrigger>
          <TabsTrigger value="vault">Credential Vault</TabsTrigger>
        </TabsList>

        <TabsContent value="environments" className="space-y-4">
          <EnvironmentList
            environments={environments}
            onSelect={setSelectedEnvironment}
            onEdit={(env) => {
              setSelectedEnvironment(env);
              setShowAddForm(true);
            }}
          />
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Connections</CardTitle>
              <CardDescription>
                Configure and test connections to external systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionForm environment={selectedEnvironment} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vault" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <CardTitle>Secure Credential Vault</CardTitle>
              </div>
              <CardDescription>
                Manage encrypted credentials and API keys securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CredentialVault />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">
                Security Information
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                All credentials are encrypted using AES-256 encryption and
                stored in a secure vault. Access is logged and audited.
                Credentials are never stored in plain text or logged.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Environments;
