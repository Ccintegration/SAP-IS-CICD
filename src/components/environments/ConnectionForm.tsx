import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

interface ConnectionFormProps {
  environment: any;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ environment }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Connection management interface will be implemented here
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This will handle system connections, URLs, and authentication
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionForm;
