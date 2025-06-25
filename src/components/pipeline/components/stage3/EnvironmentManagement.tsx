// File Path: src/components/pipeline/components/stage3/EnvironmentManagement.tsx
// Filename: EnvironmentManagement.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Database,
  GitCompare,
  ArrowRight,
} from "lucide-react";

// Types
interface EnvironmentStatus {
  id: string;
  name: string;
  configured: number;
  pending: number;
  total: number;
  health: 'healthy' | 'warning' | 'error';
  isLive?: boolean;
}

interface EnvironmentManagementProps {
  environments: EnvironmentStatus[];
  selectedEnvironment: string;
  onEnvironmentChange: (environmentId: string) => void;
}

export const EnvironmentManagement: React.FC<EnvironmentManagementProps> = ({
  environments,
  selectedEnvironment,
  onEnvironmentChange,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <CardTitle>Environments</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <GitCompare className="w-4 h-4" />
              <span>Compare Environments</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowRight className="w-4 h-4" />
              <span>Sync to Production</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {environments.map((env) => (
            <div
              key={env.id}
              onClick={() => onEnvironmentChange(env.id)}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedEnvironment === env.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-sm">{env.name}</span>
                  {env.isLive && (
                    <Badge variant="destructive" className="text-xs">
                      Live
                    </Badge>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  env.health === 'healthy' ? 
                    'bg-green-500' : 
                    env.health === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                }`}></div>
              </div>
              <div className="text-xs text-gray-500">
                {env.configured} configured, {env.pending} pending
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};