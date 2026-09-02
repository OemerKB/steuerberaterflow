"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, Input, Label, NativeSelect, Checkbox, Button, FieldHint } from "@steuerberaterflow/ui";
import { updateOrgSettingsAction } from "@/actions/settings";

export function OrgSettingsForm({ organization, settings, emailConfigured, aiMode }) {
  const [state, formAction, pending] = useActionState(updateOrgSettingsAction, {});
  const router = useRouter();
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      router.refresh();
    } else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Kanzleistammdaten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="st-name">Kanzleiname *</Label>
            <Input id="st-name" name="name" required defaultValue={organization.name} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-4 sm:col-span-2">
              <Label htmlFor="st-street">Straße</Label>
              <Input id="st-street" name="street" defaultValue={settings.street} />
            </div>
            <div>
              <Label htmlFor="st-plz">PLZ</Label>
              <Input id="st-plz" name="postalCode" defaultValue={settings.postalCode} />
            </div>
            <div>
              <Label htmlFor="st-city">Ort</Label>
              <Input id="st-city" name="city" defaultValue={settings.city} />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="st-phone">Telefon</Label>
              <Input id="st-phone" name="phone" defaultValue={settings.phone} />
            </div>
            <div>
              <Label htmlFor="st-email">E-Mail</Label>
              <Input id="st-email" name="email" type="email" defaultValue={settings.email} />
            </div>
            <div>
              <Label htmlFor="st-web">Website</Label>
              <Input id="st-web" name="website" defaultValue={settings.website} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sprache &amp; Zeit</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="st-tz">Zeitzone</Label>
            <NativeSelect id="st-tz" name="timezone" defaultValue={settings.timezone}>
              <option value="Europe/Berlin">Europa/Berlin</option>
              <option value="Europe/Vienna">Europa/Wien</option>
              <option value="Europe/Zurich">Europa/Zürich</option>
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="st-locale">Sprache</Label>
            <NativeSelect id="st-locale" name="locale" defaultValue="de-DE" disabled>
              <option value="de-DE">Deutsch (DE)</option>
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>E-Mail-Versand</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="st-from">Absendername</Label>
            <Input id="st-from" name="emailFromName" defaultValue={settings.emailFromName} placeholder="Faber & Partner Steuerberatung" />
          </div>
          <FieldHint>
            {emailConfigured
              ? "E-Mail-Versand ist konfiguriert (Resend)."
              : "Demo-Modus: Ohne RESEND_API_KEY werden E-Mails nur protokolliert und als Portal-Benachrichtigung erzeugt."}
          </FieldHint>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KI-Assistent</CardTitle>
          <FieldHint>
            KI-Ausgaben sind immer Entwürfe und müssen bestätigt werden. Aktueller Modus: {aiMode === "mock" ? "Mock (Demo)" : "OpenAI"}. Pro Kanzlei deaktivierbar.
          </FieldHint>
        </CardHeader>
        <CardContent className="space-y-2">
          <Checkbox name="aiEnabled" label="KI-Funktionen für diese Kanzlei aktivieren (Metadaten-Vorschläge, Duplikat-Hinweise)" defaultChecked={settings.aiEnabled} />
          <Checkbox name="aiSummaryEnabled" label="Zusammenfassungen in einfacher Sprache erlauben (Steuerbescheide)" defaultChecked={settings.aiSummaryEnabled} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Einstellungen speichern"}</Button>
      </div>
    </form>
  );
}
