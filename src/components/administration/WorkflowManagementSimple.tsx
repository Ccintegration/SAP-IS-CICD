import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Workflow } from "lucide-react";

const WorkflowManagementSimple: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Workflow className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-xl">Workflow Management</CardTitle>
        </div>
        <CardDescription>
          Execute and monitor SAP Integration Suite workflows on your registered
          tenants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Workflow management will be available here.
        </p>
      </CardContent>
    </Card>
  );
};

export default WorkflowManagementSimple;
