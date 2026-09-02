import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent, Input, Label, NativeSelect, Button, Checkbox, FieldHint } from "@steuerberaterflow/ui";
import { updateClientAction, archiveClientAction } from "@/actions/clients";
import { CLIENT_TYPE_LABELS, TAX_TYPE_LABELS } from "@/lib/labels";

export const metadata = { title: "Stammdaten" };

export default async function ClientMasterDataPage({ params }) {
  const { clientId } = await params;
  const { role, organization } = await requireFirmContext();

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: organization.id },
  });
  if (!client) notFound();

  const staff = await prisma.membership.findMany({
    where: { organizationId: organization.id, role: { in: ["OWNER", "STAFF"] } },
    include: { user: { select: { name: true } } },
  });
  const canEdit = role === "OWNER" || role === "STAFF";

  return (
    <div className="max-w-2xl space-y-5">
      <Card>
        <CardHeader><CardTitle>Stammdaten</CardTitle></CardHeader>
        <CardContent>
          <form action={updateClientAction} className="space-y-4">
            <input type="hidden" name="clientId" value={client.id} />
            <fieldset disabled={!canEdit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cd-name">Name / Firmierung *</Label>
                  <Input id="cd-name" name="name" defaultValue={client.name} required minLength={2} />
                </div>
                <div>
                  <Label htmlFor="cd-company">Unternehmen (zusätzlich)</Label>
                  <Input id="cd-company" name="company" defaultValue={client.company} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cd-type">Rechtsform</Label>
                  <NativeSelect id="cd-type" name="type" defaultValue={client.type}>
                    {Object.entries(CLIENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <Label htmlFor="cd-responsible">Zuständiger Mitarbeiter</Label>
                  <NativeSelect id="cd-responsible" name="responsibleUserId" defaultValue={client.responsibleUserId || ""}>
                    <option value="">– nicht zugewiesen –</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </NativeSelect>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cd-taxnumber">Steuernummer</Label>
                  <Input id="cd-taxnumber" name="taxNumber" defaultValue={client.taxNumber} />
                </div>
                <div>
                  <Label htmlFor="cd-vat">USt-IdNr.</Label>
                  <Input id="cd-vat" name="vatId" defaultValue={client.vatId} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cd-email">E-Mail</Label>
                  <Input id="cd-email" name="email" type="email" defaultValue={client.email} />
                </div>
                <div>
                  <Label htmlFor="cd-phone">Telefon</Label>
                  <Input id="cd-phone" defaultValue={client.phone} name="phone" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-4 sm:col-span-2">
                  <Label htmlFor="cd-street">Straße &amp; Nr.</Label>
                  <Input id="cd-street" name="street" defaultValue={client.street} />
                </div>
                <div>
                  <Label htmlFor="cd-plz">PLZ</Label>
                  <Input id="cd-plz" name="postalCode" defaultValue={client.postalCode} />
                </div>
                <div>
                  <Label htmlFor="cd-city">Ort</Label>
                  <Input id="cd-city" name="city" defaultValue={client.city} />
                </div>
              </div>
              <div>
                <Label>Steuerarten</Label>
                <div className="flex flex-wrap gap-3 pt-1">
                  {Object.entries(TAX_TYPE_LABELS).map(([key, label]) => (
                    <Checkbox key={key} name="taxTypes" value={key} label={label} defaultChecked={client.taxTypes.includes(key)} />
                  ))}
                </div>
                <FieldHint>Mehrere Steuerarten wählbar.</FieldHint>
              </div>
            </fieldset>
            {canEdit ? (
              <div className="flex justify-end pt-2">
                <Button type="submit">Speichern</Button>
              </div>
            ) : (
              <FieldHint>Sie haben keine Berechtigung, Stammdaten zu ändern.</FieldHint>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
