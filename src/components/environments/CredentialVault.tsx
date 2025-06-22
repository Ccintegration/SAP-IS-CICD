import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

const CredentialVault = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Secure credential vault interface will be implemented here
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This will manage encrypted credentials and API keys
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CredentialVault;
