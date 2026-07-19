import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--grok-white]">Subscription</h1>
          <p className="text-sm text-[--grok-gray-400]">
            Manage your billing and subscription plan
          </p>
        </div>
      </div>

      <Card className="border-[--grok-gray-700] bg-[--grok-gray-900]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[--grok-white]">
            <CreditCard className="size-5" />
            Current Plan
            <Badge className="ml-2 bg-[--grok-accent]/10 text-[--grok-accent] border-[--grok-accent]/20">PRO</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[--grok-gray-400]">
            Billing details and plan upgrading options will be shown here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
