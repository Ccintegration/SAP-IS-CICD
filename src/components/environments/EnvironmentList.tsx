import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, TestTube, Trash2, Server } from "lucide-react";

interface Environment {
  id: string;
  name: string;
  type: string;
  status: string;
  lastTested: string;
  systems: any[];
}

interface EnvironmentListProps {
  environments: Environment[];
  onSelect: (environment: Environment) => void;
  onEdit: (environment: Environment) => void;
}

const EnvironmentList: React.FC<EnvironmentListProps> = ({
  environments,
  onSelect,
  onEdit,
}) => {
  return (
    <div className="grid gap-4">
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
              <Badge
                variant={env.status === "connected" ? "default" : "secondary"}
              >
                {env.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Environment type:{" "}
                <span className="font-medium capitalize">{env.type}</span>
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Systems:</span>
                  <span className="ml-1 font-medium">{env.systems.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last tested:</span>
                  <span className="ml-1 font-medium">{env.lastTested}</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(env)}>
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  <TestTube className="w-3 h-3 mr-1" />
                  Test
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EnvironmentList;
