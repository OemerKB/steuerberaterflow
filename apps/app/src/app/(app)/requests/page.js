import { prisma } from "@/lib/db";
import { requireFirmContext } from "@/lib/context";
import { can } from "@/lib/permissions";
import { sendRequestReminderAction } from "@/actions/requests";
import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, EmptyState } from "@steuerberaterflow/ui";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { RequestItemRow } from "./request-item-row";
import { REQUEST_STATUS_LABELS, formatDateTime, formatDate } from "@/lib/labels";
import { requestProgress } from "@/lib/workflow";
import { relativeDueDate } from "@/lib/labels";

export const metadata = { title: "Fehlende Unterlagen" };

export default async function RequestsPage() {
  const { role, organization } = await requireFirmContext();

  const requests = await prisma.documentRequest.findMany({
    where: { organizationId: organization.id, status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: { client: { select: { id: true, name: true } }, items: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const clients = await prisma.client.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const totalMissing = requests.reduce((acc, r) => acc + requestProgress(r).missing, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fehlende Unterlagen"
        description={`${requests.length} offene Anforderung(en) · ${totalMissing} Unterlage(n) werden erwartet`}
        actions={can(role, "requests.manage") ? <NewRequestDialog clients={clients} /> : null}
      />

      {requests.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Keine offenen Anforderungen"
              description="Erstellen Sie Unterlagenpakete wie „Monatsbuchhaltung August 2026“, um gezielt Unterlagen anzufordern."
              action={can(role, "requests.manage") ? <NewRequestDialog clients={clients} trigger={<Button size="sm">Unterlagen anfordern</Button>} /> : null}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {requests.map((request) => {
            const progress = requestProgress(request);
            const due = relativeDueDate(request.dueDate);
            return (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle>{request.title}</CardTitle>
                      <CardDescription>
                        {request.client.name}
                        {request.periodLabel ? ` · ${request.periodLabel}` : ""}
                        {request.dueDate ? ` · fällig ${formatDate(request.dueDate)}` : ""}
                      </CardDescription>
                    </div>
                    <Badge tone={progress.missing === 0 ? "green" : "amber"}>
                      {progress.missing === 0 ? "vollständig" : `${progress.missing} von ${progress.total} fehlen`}
                    </Badge>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-accent/50 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${progress.percent}%` }} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {request.items.map((item) => (
                    <RequestItemRow key={item.id} item={item} canManage={can(role, "requests.manage")} />
                  ))}
                  {can(role, "requests.manage") ? (
                    <div className="flex justify-end gap-2 pt-2">
                      <ReminderButton requestId={request.id} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReminderButton({ requestId }) {
  return (
    <form action={sendRequestReminderAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit" variant="secondary" size="sm">Erinnerung senden</Button>
    </form>
  );
}
