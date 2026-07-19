import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--grok-white]">Settings</h1>
          <p className="text-sm text-[--grok-gray-400]">
            Configure AI models and workspace settings
          </p>
        </div>
      </div>

      <Card className="border-[--grok-gray-700] bg-[--grok-gray-900]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[--grok-white]">
            <Settings className="size-5" />
            Workspace Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[--grok-gray-400]">
            Global application settings and configurations will go here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
