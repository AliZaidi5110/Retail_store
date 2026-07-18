import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/actions/settings";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import { decimalToNumber } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await auth();
  const settings = await getSettings();

  return (
    <AppShell title="Settings" userName={session?.user?.name} userEmail={session?.user?.email}>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Store settings</CardTitle>
          <CardDescription>Store info, tax/GST, and account password</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            initial={{
              storeName: settings.storeName,
              logo: settings.logo,
              address: settings.address,
              phone: settings.phone,
              currency: settings.currency,
              taxRate: decimalToNumber(settings.taxRate),
              gstEnabled: settings.gstEnabled,
            }}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
