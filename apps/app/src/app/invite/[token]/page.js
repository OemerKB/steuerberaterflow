import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, Input, Label, Button } from "@steuerberaterflow/ui";
import { AcceptInviteForm } from "./accept-form";
import { ROLE_LABELS } from "@/lib/labels";

export const metadata = { title: "Einladung annehmen" };

export default async function InvitePage({ params }) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true },
  });

  const invalid = !invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date();

  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-6 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <h1 className="text-lg font-semibold">Einladung annehmen</h1>
          {invalid ? (
            <div className="mt-3">
              <p className="text-sm text-muted">
                Diese Einladung ist nicht (mehr) gültig. Bitte wenden Sie sich an Ihre Kanzlei.
              </p>
              <Link href="/login" className="sf-link text-sm mt-3 inline-block">Zur Anmeldung</Link>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">
                Sie wurden als <strong>{ROLE_LABELS[invitation.role]}</strong> zu{" "}
                <strong>{invitation.organization.name}</strong> eingeladen ({invitation.email}).
              </p>
              <div className="mt-5">
                <AcceptInviteForm token={token} initialName={invitation.name} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
