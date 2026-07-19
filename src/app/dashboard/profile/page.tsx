import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--grok-white]">Profile</h1>
          <p className="text-sm text-[--grok-gray-400]">
            Manage your personal profile and preferences
          </p>
        </div>
      </div>

      <Card className="border-[--grok-gray-700] bg-[--grok-gray-900]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[--grok-white]">
            <User className="size-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[--grok-gray-400]">
            Profile management settings will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
