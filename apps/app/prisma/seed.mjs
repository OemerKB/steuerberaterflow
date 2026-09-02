/**
 * Seed: Demo-Kanzlei „Faber & Partner Steuerberatung" mit realistischen Demo-Daten.
 * Keine echten personenbezogenen Daten. Alle Passwörter: demo1234!
 *
 * Ausführen: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

const PASSWORD = "demo1234!";

function hashPassword(password) {
  const N = 16384, r = 8, p = 1;
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Minimaler, gültiger PDF-Platzhalter (Demo-Inhalt). */
function makePdf(title) {
  const content = `BT /F1 14 Tf 72 720 Td (${title}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

const days = (n) => new Date(Date.now() + n * 864e5);
const day = (n, h = 10, m = 0) => {
  const d = days(n);
  d.setHours(h, m, 0, 0);
  return d;
};

async function main() {
  console.log("Reset …");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "AuditLog","Notification","SupportCase","FeatureFlag","Subscription","Report","ApprovalDecision","ApprovalRequest","MeetingRoom","Appointment","MessageRead","Message","Conversation","Deadline","TaskChecklistItem","Task","RequestItem","DocumentRequest","DocumentComment","DocumentVersion","Document","ClientNote","ClientAssignment","ClientContact","Client","Invitation","Session","Membership","Permission","RolePermission","OrganizationSettings","Organization","User" CASCADE`
  );

  console.log("Berechtigungskatalog …");
  const CATALOG = [
    ["clients.read", "Mandanten lesen"], ["clients.create", "Mandanten anlegen"], ["clients.update", "Mandanten bearbeiten"],
    ["clients.archive", "Mandanten archivieren"], ["clients.invite", "Mandanten einladen"],
    ["documents.read", "Dokumente lesen"], ["documents.create", "Dokumente hochladen"], ["documents.update", "Dokumente bearbeiten"], ["documents.status", "Dokumentstatus ändern"],
    ["requests.read", "Fehlende Unterlagen lesen"], ["requests.manage", "Unterlagen anfordern"],
    ["tasks.read", "Aufgaben lesen"], ["tasks.create", "Aufgaben anlegen"], ["tasks.update", "Aufgaben bearbeiten"],
    ["deadlines.read", "Fristen lesen"], ["deadlines.manage", "Fristen verwalten"],
    ["messages.read", "Nachrichten lesen"], ["messages.send", "Nachrichten senden"],
    ["appointments.read", "Termine lesen"], ["appointments.manage", "Termine verwalten"],
    ["approvals.read", "Freigaben lesen"], ["approvals.request", "Freigaben anfordern"],
    ["reports.read", "Auswertungen lesen"], ["reports.manage", "Auswertungen verwalten"],
    ["team.manage", "Team verwalten"], ["settings.manage", "Einstellungen verwalten"], ["audit.view", "Protokoll einsehen"],
    ["portal.documents.upload", "Portal: Dokumente hochladen"], ["portal.requests.read", "Portal: Unterlagen sehen"],
    ["portal.tasks.read", "Portal: Aufgaben sehen"], ["portal.messages.read", "Portal: Nachrichten lesen"],
    ["portal.messages.send", "Portal: Nachrichten senden"], ["portal.appointments.read", "Portal: Termine sehen"],
    ["portal.appointments.book", "Portal: Termine buchen"], ["portal.approvals.decide", "Portal: Freigaben entscheiden"],
    ["portal.reports.read", "Portal: Auswertungen lesen"],
  ];
  for (const [key, description] of CATALOG) {
    const perm = await prisma.permission.create({ data: { key, description } });
    const roleMatrix = {
      "clients.read": ["OWNER", "STAFF", "ACCOUNTANT"], "clients.create": ["OWNER", "STAFF"],
      "clients.update": ["OWNER", "STAFF"], "clients.archive": ["OWNER"], "clients.invite": ["OWNER", "STAFF"],
      "documents.read": ["OWNER", "STAFF", "ACCOUNTANT"], "documents.create": ["OWNER", "STAFF", "ACCOUNTANT"],
      "documents.update": ["OWNER", "STAFF"], "documents.status": ["OWNER", "STAFF"],
      "requests.read": ["OWNER", "STAFF", "ACCOUNTANT"], "requests.manage": ["OWNER", "STAFF"],
      "tasks.read": ["OWNER", "STAFF", "ACCOUNTANT"], "tasks.create": ["OWNER", "STAFF"], "tasks.update": ["OWNER", "STAFF", "ACCOUNTANT"],
      "deadlines.read": ["OWNER", "STAFF"], "deadlines.manage": ["OWNER", "STAFF"],
      "messages.read": ["OWNER", "STAFF", "ACCOUNTANT"], "messages.send": ["OWNER", "STAFF", "ACCOUNTANT"],
      "appointments.read": ["OWNER", "STAFF", "ACCOUNTANT"], "appointments.manage": ["OWNER", "STAFF"],
      "approvals.read": ["OWNER", "STAFF"], "approvals.request": ["OWNER", "STAFF"],
      "reports.read": ["OWNER", "STAFF"], "reports.manage": ["OWNER", "STAFF"],
      "team.manage": ["OWNER"], "settings.manage": ["OWNER"], "audit.view": ["OWNER", "STAFF"],
      "portal.documents.upload": ["CLIENT"], "portal.requests.read": ["CLIENT"], "portal.tasks.read": ["CLIENT"],
      "portal.messages.read": ["CLIENT"], "portal.messages.send": ["CLIENT"], "portal.appointments.read": ["CLIENT"],
      "portal.appointments.book": ["CLIENT"], "portal.approvals.decide": ["CLIENT"], "portal.reports.read": ["CLIENT"],
    };
    for (const role of roleMatrix[key] || []) {
      await prisma.rolePermission.create({ data: { permissionId: perm.id, role } });
    }
  }

  console.log("Organisation …");
  const org = await prisma.organization.create({
    data: {
      slug: "faber-partner",
      name: "Faber & Partner Steuerberatung",
      settings: {
        create: {
          street: "Kanzleistraße 12",
          postalCode: "20095",
          city: "Hamburg",
          phone: "+49 40 123456-0",
          email: "kanzlei@faber-partner.demo",
          website: "https://faber-partner.demo",
          emailFromName: "Faber & Partner Steuerberatung",
          aiEnabled: true,
          aiSummaryEnabled: true,
        },
      },
      subscriptions: { create: { plan: "KANZLEI", status: "ACTIVE", seats: 3 } },
    },
  });

  console.log("Benutzer …");
  const pwHash = hashPassword(PASSWORD);

  const admin = await prisma.user.create({
    data: { email: "admin@steuerberaterflow.demo", name: "Systemadministration", passwordHash: pwHash, isPlatformAdmin: true },
  });

  const julia = await prisma.user.create({
    data: { email: "julia.faber@faber-partner.demo", name: "Julia Faber", passwordHash: pwHash },
  });
  const daniel = await prisma.user.create({
    data: { email: "daniel.weber@faber-partner.demo", name: "Daniel Weber", passwordHash: pwHash },
  });
  const lisa = await prisma.user.create({
    data: { email: "lisa.koenig@faber-partner.demo", name: "Lisa König", passwordHash: pwHash },
  });

  const mJulia = await prisma.membership.create({
    data: { organizationId: org.id, userId: julia.id, role: "OWNER", title: "Kanzleiinhaberin" },
  });
  const mDaniel = await prisma.membership.create({
    data: { organizationId: org.id, userId: daniel.id, role: "STAFF", title: "Steuerberater" },
  });
  const mLisa = await prisma.membership.create({
    data: { organizationId: org.id, userId: lisa.id, role: "ACCOUNTANT", title: "Sachbearbeiterin" },
  });

  console.log("Mandanten …");
  const clientDefs = [
    { key: "nordstern", type: "GMBH", name: "Nordstern Bau GmbH", company: "Nordstern Bau GmbH", email: "mandant@nordstern-bau.demo", contact: "Metin Kaya", responsible: daniel.id, taxTypes: ["UST", "GEW", "LOHN"], city: "Hamburg" },
    { key: "kaya", type: "LANDLORD", name: "Kaya Immobilienverwaltung", company: "Kaya Immobilienverwaltung", email: "mandant@kaya.demo", contact: "Metin Kaya", responsible: daniel.id, taxTypes: ["UST", "EINK"], city: "Hamburg" },
    { key: "studio", type: "GMBH", name: "Studio Form GmbH", company: "Studio Form GmbH", email: "mandant@studio-form.demo", contact: "Anna Brandt", responsible: julia.id, taxTypes: ["UST", "GEW"], city: "Hamburg" },
    { key: "cafe", type: "SOLE_TRADER", name: "Café Morgenrot", company: "Café Morgenrot – Inhaber: J. Peters", email: "mandant@cafe-morgenrot.demo", contact: "Jana Peters", responsible: lisa.id, taxTypes: ["UST"], city: "Hamburg" },
    { key: "fotografie", type: "FREELANCER", name: "Lena Hoffmann Fotografie", company: "", email: "mandant@lena-hoffmann.demo", contact: "Lena Hoffmann", responsible: julia.id, taxTypes: ["EINK", "UST"], city: "Hamburg" },
    { key: "gruenwerk", type: "SOLE_TRADER", name: "Grünwerk Landschaftsbau", company: "Grünwerk – Inhaber: T. Berger", email: "mandant@gruenwerk.demo", contact: "Tobias Berger", responsible: daniel.id, taxTypes: ["UST", "GEW"], city: "Hamburg" },
  ];

  const clients = {};
  for (const [i, def] of clientDefs.entries()) {
    const portalUser = await prisma.user.create({
      data: { email: def.email, name: def.contact, passwordHash: pwHash },
    });
    clients[def.key] = await prisma.client.create({
      data: {
        organizationId: org.id,
        type: def.type,
        name: def.name,
        company: def.company,
        email: def.email,
        phone: `+49 40 22${i}456-0`,
        street: `Musterstraße ${10 + i}`,
        postalCode: "20095",
        city: def.city,
        taxNumber: `24/65${i}/09876`,
        taxTypes: def.taxTypes,
        responsibleUserId: def.responsible,
        portalUserId: portalUser.id,
        onboardingPercent: 100,
      },
    });
    await prisma.membership.create({
      data: { organizationId: org.id, userId: portalUser.id, role: "CLIENT" },
    });
    await prisma.clientContact.create({
      data: { clientId: clients[def.key].id, name: def.contact, role: "Geschäftsführung/Inhaber", email: def.email, phone: `+49 40 22${i}456-1`, isPrimary: true },
    });
  }

  console.log("Dokumente …");
  async function createDocument({ clientKey, category, title, taxYear, month, status, byUser, byClient = false, daysAgo = 5, description = "" }) {
    const pdf = makePdf(title);
    return prisma.document.create({
      data: {
        organizationId: org.id,
        clientId: clientKey ? clients[clientKey].id : null,
        category, title, status, taxYear, month, description,
        uploadedById: byClient ? null : byUser.id,
        createdAt: days(-daysAgo),
        versions: {
          create: {
            version: 1,
            fileName: `${title.replace(/[^a-zA-Z0-9äöüÄÖÜß -]/g, "")}.pdf`,
            mimeType: "application/pdf",
            sizeBytes: pdf.length,
            checksum: createHash("sha256").update(pdf).digest("hex"),
            data: pdf,
            uploadedById: byClient ? null : byUser.id,
            createdAt: days(-daysAgo),
          },
        },
      },
    });
  }

  await createDocument({ clientKey: "nordstern", category: "BANK", title: "Kontoauszug Geschäftskonto Juli 2026", taxYear: 2026, month: 7, status: "ACCEPTED", byUser: lisa, daysAgo: 12 });
  await createDocument({ clientKey: "nordstern", category: "INVOICE_IN", title: "Eingangsrechnung Baustoff Händler", taxYear: 2026, month: 8, status: "REVIEW", byClient: true, daysAgo: 3 });
  await createDocument({ clientKey: "nordstern", category: "BWA", title: "BWA Juni 2026", taxYear: 2026, month: 6, status: "ACCEPTED", byUser: daniel, daysAgo: 20 });
  await createDocument({ clientKey: "kaya", category: "TAX_ASSESSMENT", title: "Grundsteuerbescheid 2026", taxYear: 2026, status: "QUESTION", byClient: true, daysAgo: 6 });
  await createDocument({ clientKey: "kaya", category: "CONTRACT", title: "Mietvertrag Wohnung 4b", taxYear: 2026, status: "ACCEPTED", byClient: true, daysAgo: 30 });
  await createDocument({ clientKey: "studio", category: "INVOICE_OUT", title: "Ausgangsrechnung Kampagne Q3", taxYear: 2026, month: 8, status: "NEW", byClient: true, daysAgo: 2 });
  await createDocument({ clientKey: "studio", category: "BANK", title: "Kontoauszug Geschäftskonto Juli 2026", taxYear: 2026, month: 7, status: "REVIEW", byClient: true, daysAgo: 8 });
  await createDocument({ clientKey: "cafe", category: "CASH", title: "Kassenbericht August 2026", taxYear: 2026, month: 8, status: "NEW", byClient: true, daysAgo: 1 });
  await createDocument({ clientKey: "fotografie", category: "INVOICE_OUT", title: "Rechnung Hochzeit Meyer", taxYear: 2026, month: 7, status: "ACCEPTED", byClient: true, daysAgo: 15 });
  await createDocument({ clientKey: "gruenwerk", category: "PAYROLL", title: "Lohnabrechnung Juli 2026", taxYear: 2026, month: 7, status: "ACCEPTED", byUser: daniel, daysAgo: 10 });
  const powerDoc = await createDocument({ clientKey: "nordstern", category: "POWER_OF_ATTORNEY", title: "Steuerberatungsvollmacht Nordstern Bau GmbH", taxYear: 2026, status: "REVIEW", byUser: julia, daysAgo: 4 });

  console.log("Fehlende Unterlagen …");
  const reqNordstern = await prisma.documentRequest.create({
    data: {
      organizationId: org.id,
      clientId: clients.nordstern.id,
      title: "Monatsbuchhaltung August 2026",
      periodLabel: "08 / 2026",
      dueDate: day(10),
      description: "Bitte die folgenden Belege für die August-Buchhaltung hochladen.",
      createdById: daniel.id,
      items: {
        create: [
          { title: "Kontoauszug Geschäftskonto", dueDate: day(10) },
          { title: "Kreditkartenabrechnung", dueDate: day(10) },
          { title: "Eingangsrechnungen", dueDate: day(12) },
          { title: "Ausgangsrechnungen", dueDate: day(12) },
          { title: "Kassenbericht", dueDate: day(12) },
        ],
      },
    },
  });
  // 3 von 5 bereits geliefert
  const reqItems = await prisma.requestItem.findMany({ where: { requestId: reqNordstern.id } });
  await prisma.requestItem.update({ where: { id: reqItems[0].id }, data: { status: "UPLOADED" } });
  await prisma.requestItem.update({ where: { id: reqItems[1].id }, data: { status: "UPLOADED" } });
  await prisma.requestItem.update({ where: { id: reqItems[2].id }, data: { status: "UPLOADED" } });
  await prisma.documentRequest.update({ where: { id: reqNordstern.id }, data: { status: "IN_PROGRESS" } });

  await prisma.documentRequest.create({
    data: {
      organizationId: org.id,
      clientId: clients.cafe.id,
      title: "Monatsbuchhaltung August 2026",
      periodLabel: "08 / 2026",
      dueDate: day(14),
      createdById: lisa.id,
      items: {
        create: [
          { title: "Kassenbericht", status: "UPLOADED" },
          { title: "Kontoauszug Geschäftskonto", dueDate: day(14) },
          { title: "Eingangsrechnungen (Lieferanten)", dueDate: day(14) },
          { title: "Bewirtungsbelege", dueDate: day(14) },
        ],
      },
    },
  });

  await prisma.documentRequest.create({
    data: {
      organizationId: org.id,
      clientId: clients.gruenwerk.id,
      title: "Unterlagen Gewerbeanmeldung & Vollmacht",
      description: "Für das Onboarding benötigen wir noch diese Unterlagen.",
      dueDate: day(21),
      createdById: daniel.id,
      items: {
        create: [
          { title: "Gewerbeanmeldung", dueDate: day(21) },
          { title: "Handelsregisterauszug", dueDate: day(21), status: "UPLOADED" },
          { title: "Bankverbindung bestätigen", dueDate: day(21) },
        ],
      },
    },
  });

  console.log("Aufgaben …");
  const tasks = [
    { title: "Belege August prüfen und buchen", clientKey: "nordstern", assignee: daniel.id, creator: daniel.id, priority: "HIGH", status: "IN_PROGRESS", due: day(3), tags: ["buchhaltung", "august"] },
    { title: "Rückfrage Kreditkartenabrechnung klären", clientKey: "nordstern", assignee: daniel.id, creator: julia.id, priority: "MEDIUM", status: "WAITING_CLIENT", due: day(5), tags: ["rückfrage"] },
    { title: "Umsatzsteuervoranmeldung Juli vorbereiten", clientKey: "studio", assignee: julia.id, creator: julia.id, priority: "URGENT", status: "OPEN", due: day(-1), tags: ["ust"] },
    { title: "Jahresabschluss 2025 – Belege vervollständigen", clientKey: "kaya", assignee: julia.id, creator: julia.id, priority: "HIGH", status: "OPEN", due: day(12), tags: ["jahresabschluss"] },
    { title: "Kassenbuch mit Vorlage einrichten", clientKey: "cafe", assignee: lisa.id, creator: lisa.id, priority: "LOW", status: "OPEN", due: day(8), tags: ["kasse"] },
    { title: "Onboarding Vollmacht einscannen", clientKey: "nordstern", assignee: lisa.id, creator: julia.id, priority: "MEDIUM", status: "DONE", due: day(-2), tags: ["onboarding"] },
    { title: "Einkommensteuerunterlagen 2025 sammeln", clientKey: "fotografie", assignee: julia.id, creator: julia.id, priority: "MEDIUM", status: "WAITING_FIRM", due: day(20), tags: ["est"] },
  ];
  for (const t of tasks) {
    await prisma.task.create({
      data: {
        organizationId: org.id,
        title: t.title,
        clientId: t.clientKey ? clients[t.clientKey].id : null,
        assigneeId: t.assignee,
        creatorId: t.creator,
        priority: t.priority,
        status: t.status,
        dueDate: t.due,
        tags: t.tags,
        completedAt: t.status === "DONE" ? day(-1) : null,
      },
    });
  }

  console.log("Fristen …");
  await prisma.deadline.createMany({
    data: [
      { organizationId: org.id, title: "Umsatzsteuervoranmeldung August 2026", clientId: clients.nordstern.id, assigneeId: daniel.id, dueDate: day(9), priority: "HIGH", recurrence: "MONTHLY", reminderDays: 7, notes: "Vorlage – Frist durch Kanzlei prüfen (§18 UStG)." },
      { organizationId: org.id, title: "Umsatzsteuervoranmeldung Q3", clientId: clients.studio.id, assigneeId: julia.id, dueDate: day(25), priority: "URGENT", recurrence: "NONE", reminderDays: 10 },
      { organizationId: org.id, title: "Handelsregister-Nachweis erneuern", clientId: clients.kaya.id, assigneeId: julia.id, dueDate: day(-2), priority: "MEDIUM", status: "MISSED", recurrence: "NONE", reminderDays: 14 },
      { organizationId: org.id, title: "Lohnsteuer-Anmeldung Juli 2026", clientId: clients.nordstern.id, assigneeId: daniel.id, dueDate: day(2), priority: "HIGH", recurrence: "MONTHLY", reminderDays: 5 },
      { organizationId: org.id, title: "Jahresabschluss 2025 finalisieren", clientId: clients.kaya.id, assigneeId: julia.id, dueDate: day(40), priority: "MEDIUM", status: "IN_PROGRESS", recurrence: "YEARLY", reminderDays: 30 },
    ],
  });

  console.log("Nachrichten …");
  const conv1 = await prisma.conversation.create({
    data: {
      organizationId: org.id,
      clientId: clients.nordstern.id,
      type: "CLIENT",
      subject: "Rückfrage zur Kreditkartenabrechnung",
      createdById: daniel.id,
      lastMessageAt: day(-1, 14, 30),
    },
  });
  await prisma.message.create({
    data: { conversationId: conv1.id, senderId: daniel.id, authorName: "Daniel Weber", content: "Guten Tag Herr Kaya,\n\nin der Kreditkartenabrechnung vom 12.08. fehlt der Beleg zur Buchung über 248,90 €. Können Sie uns den Beleg bitte im Portal hochladen?\n\nViele Grüße\nDaniel Weber", isInternal: false, createdAt: day(-2, 9, 0) },
  });
  await prisma.message.create({
    data: { conversationId: conv1.id, senderId: null, authorName: "Metin Kaya", content: "Hallo Herr Weber,\n\nder Beleg war auf der gemeinsamen Reisebuchung. Ich lade heute Nachmittag ein Foto hoch.\n\nViele Grüße", isInternal: false, createdAt: day(-1, 14, 30) },
  });
  await prisma.message.create({
    data: { conversationId: conv1.id, senderId: daniel.id, authorName: "Daniel Weber", content: "Interne Notiz: Beleg 248,90 € noch offen – an Reisebuchung erinnern. Kassenstands-Diskussion mit Julia am Freitag.", isInternal: true, createdAt: day(-1, 15, 0) },
  });
  await prisma.messageRead.create({ data: { conversationId: conv1.id, userId: daniel.id, lastReadAt: day(-1, 15, 0) } });

  const conv2 = await prisma.conversation.create({
    data: {
      organizationId: org.id,
      clientId: clients.studio.id,
      type: "CLIENT",
      subject: "Umsatzsteuervoranmeldung Juli 2026",
      createdById: julia.id,
      lastMessageAt: day(-3, 11, 0),
    },
  });
  await prisma.message.create({
    data: { conversationId: conv2.id, senderId: julia.id, authorName: "Julia Faber", content: "Guten Tag Frau Brandt,\n\ndie USt-Voranmeldung für Juli ist vorbereitet. Zur Freigabe finden Sie das Dokument im Portal unter „Freigaben“.\n\nFreundliche Grüße\nJulia Faber", isInternal: false, createdAt: day(-3, 11, 0) },
  });
  await prisma.messageRead.create({ data: { conversationId: conv2.id, userId: julia.id } });

  const conv3 = await prisma.conversation.create({
    data: {
      organizationId: org.id,
      clientId: clients.kaya.id,
      type: "INTERNAL",
      subject: "Grundsteuerbescheid – Vorgehen",
      createdById: julia.id,
      lastMessageAt: day(-5, 16, 0),
    },
  });
  await prisma.message.create({
    data: { conversationId: conv3.id, senderId: julia.id, authorName: "Julia Faber", content: "Daniel: Der Grundsteuerbescheid wirkt zu hoch. Bitte Erhebungszeitraum und Flurstück prüfen, bevor wir dem Mandanten antworten.", isInternal: true, createdAt: day(-5, 16, 0) },
  });

  console.log("Termine …");
  const room1 = await prisma.meetingRoom.create({
    data: { organizationId: org.id, provider: "demo", externalId: `demo-faber-bwa-${Date.now()}`, url: "/meeting/demo-faber-bwa", isDemo: true },
  });
  const room2 = await prisma.meetingRoom.create({
    data: { organizationId: org.id, provider: "demo", externalId: `demo-faber-ja-${Date.now()}`, url: "/meeting/demo-faber-ja", isDemo: true },
  });
  await prisma.appointment.create({
    data: {
      organizationId: org.id, clientId: clients.nordstern.id, type: "BWA_REVIEW",
      title: "BWA-Besprechung August", startsAt: day(1, 10, 0), durationMinutes: 45,
      consultantId: daniel.id, status: "CONFIRMED", meetingRoomId: room1.id,
      notes: "Schwerpunkte: Materialaufwand, Nachträge Baustelle 2.",
    },
  });
  await prisma.appointment.create({
    data: {
      organizationId: org.id, clientId: clients.kaya.id, type: "ANNUAL_STATEMENT",
      title: "Jahresabschluss 2025 – Abschlussbesprechung", startsAt: day(6, 14, 0), durationMinutes: 60,
      consultantId: julia.id, status: "CONFIRMED", meetingRoomId: room2.id,
    },
  });
  await prisma.appointment.create({
    data: {
      organizationId: org.id, clientId: clients.fotografie.id, type: "INITIAL",
      title: "Erstgespräch Steueroptimierung", startsAt: day(-14, 9, 30), durationMinutes: 30,
      consultantId: julia.id, status: "COMPLETED", notes: "Onboarding abgeschlossen, Unterlagen angefordert.",
    },
  });

  console.log("Freigaben …");
  const approvalDoc = await prisma.document.create({
    data: {
      organizationId: org.id,
      clientId: clients.studio.id,
      category: "OTHER",
      title: "Umsatzsteuervoranmeldung Juli 2026",
      description: "Vorbereitete Voranmeldung zur Kenntnisnahme.",
      status: "REVIEW",
      taxYear: 2026,
      month: 7,
      uploadedById: julia.id,
      versions: {
        create: {
          version: 1, fileName: "ust-va-juli-2026.pdf", mimeType: "application/pdf",
          sizeBytes: 1024, checksum: createHash("sha256").update("ust-va-juli").digest("hex"),
          data: makePdf("Umsatzsteuervoranmeldung Juli 2026"), uploadedById: julia.id,
        },
      },
    },
  });
  await prisma.approvalRequest.create({
    data: {
      organizationId: org.id, clientId: clients.studio.id, documentId: approvalDoc.id,
      kind: "DOCUMENT", title: "Umsatzsteuervoranmeldung Juli 2026 zur Kenntnisnahme",
      message: "Bitte prüfen Sie die zusammengefassten Umsätze und geben Sie die Anmeldung frei.",
      dueDate: day(4), requestedById: julia.id, status: "PENDING",
    },
  });
  const approvalPower = await prisma.approvalRequest.create({
    data: {
      organizationId: org.id, clientId: clients.nordstern.id, documentId: powerDoc.id,
      kind: "DOCUMENT", title: "Steuerberatungsvollmacht bestätigen",
      message: "Bitte bestätigen Sie, dass die hinterlegte Vollmacht korrekt ist.",
      dueDate: day(7), requestedById: julia.id, status: "PENDING",
    },
  });
  const doneApproval = await prisma.approvalRequest.create({
    data: {
      organizationId: org.id, clientId: clients.fotografie.id,
      kind: "GENERAL", title: "Onboarding-Checkliste bestätigen",
      message: "Alle Unterlagen liegen vollständig vor.",
      requestedById: julia.id, status: "APPROVED", decidedAt: day(-10),
    },
  });
  await prisma.approvalDecision.create({
    data: { requestId: doneApproval.id, decidedById: (await prisma.user.findUnique({ where: { email: "mandant@lena-hoffmann.demo" } })).id, decision: "APPROVED", comment: "Alles vollständig, danke!", createdAt: day(-10) },
  });

  console.log("Auswertungen …");
  const monthlyData = [
    { month: "Mär", einnahmen: 41200, ausgaben: 28700 },
    { month: "Apr", einnahmen: 44800, ausgaben: 30100 },
    { month: "Mai", einnahmen: 39500, ausgaben: 27900 },
    { month: "Jun", einnahmen: 47200, ausgaben: 32600 },
    { month: "Jul", einnahmen: 50100, ausgaben: 34200 },
    { month: "Aug", einnahmen: 46500, ausgaben: 31800 },
  ];
  const costData = [
    { name: "Material", value: 98000 },
    { name: "Löhne", value: 64000 },
    { name: "Miete", value: 21000 },
    { name: "Fahrzeuge", value: 12500 },
    { name: "Versicherungen", value: 6400 },
  ];
  await prisma.report.create({
    data: {
      organizationId: org.id,
      clientId: clients.nordstern.id,
      kind: "SUMMARY",
      title: "Ihre Zahlen im Überblick – August 2026",
      periodLabel: "08 / 2026",
      isDemoData: true,
      content:
        "Sehr geehrte Damen und Herren,\n\nim August lag Ihr vorläufiges Ergebnis über den Niveaus der Vormonate. " +
        "Die Einnahmen betrugen 46.500 €, die Ausgaben 31.800 € (Beispielwerte).\n\n" +
        "Größte Kostenblöcke bleiben Material und Löhne. Die Kasse wurde regelmäßig geführt – sehr gut.\n\n" +
        "Hinweis der Kanzlei: Für die Baustelle 2 fehlen noch Nachtragsrechnungen.\n\n" +
        "Diese Auswertung ist eine Beispielauswertung – keine steuerliche Berechnung.",
      data: { monthly: monthlyData, costs: costData },
      createdById: daniel.id,
    },
  });
  await prisma.report.create({
    data: {
      organizationId: org.id,
      clientId: clients.studio.id,
      kind: "BWA_NOTE",
      title: "Ihre BWA Juli 2026 – kurz erklärt",
      periodLabel: "07 / 2026",
      isDemoData: false,
      content:
        "Die BWA zeigt im Juli stabil fixe Kosten bei steigendem Agenturumsatz.\n\n" +
        "Was bedeutet das? Pro 100 € Umsatz bleiben nach Kosten rund 22 € – im Juni waren es 19 €.\n\n" +
        "Empfehlung der Kanzlei: Rücklagen für die IHK-Jahresgebühr einplanen.\n\n" +
        "Hinweis: verständliche Aufbereitung, keine steuerliche Beratung im Einzelfall.",
      data: { monthly: [ { month: "Jun", einnahmen: 38200, ausgaben: 30900 }, { month: "Jul", einnahmen: 41200, ausgaben: 32100 } ], costs: [ { name: "Personal", value: 16400 }, { name: "Miete", value: 5800 }, { name: "Software", value: 2400 } ] },
      createdById: julia.id,
    },
  });

  console.log("Benachrichtigungen …");
  await prisma.notification.createMany({
    data: [
      { organizationId: org.id, userId: daniel.id, type: "document", title: "Mandant hat Dokumente hochgeladen", body: "Nordstern Bau GmbH: 1 Datei(en).", link: "/clients", createdAt: day(-3, 10, 0) },
      { organizationId: org.id, userId: julia.id, type: "approval", title: "Freigabe angefordert", body: "Steuerberatungsvollmacht bestätigen", link: "/approvals", createdAt: day(-4, 9, 0) },
      { organizationId: org.id, userId: julia.id, type: "deadline", title: "Frist überfällig", body: "Handelsregister-Nachweis erneuern", link: "/deadlines", createdAt: day(-1, 8, 0) },
      { organizationId: org.id, userId: (await prisma.user.findUnique({ where: { email: "mandant@nordstern-bau.demo" } })).id, type: "request", title: "Fehlende Unterlagen", body: "Monatsbuchhaltung August 2026 – 2 Unterlagen fehlen.", link: "/portal/requests", createdAt: day(-2, 9, 0) },
      { organizationId: org.id, userId: (await prisma.user.findUnique({ where: { email: "mandant@studio-form.demo" } })).id, type: "approval", title: "Freigabe angefordert", body: "Umsatzsteuervoranmeldung Juli 2026 zur Kenntnisnahme", link: "/portal/approvals", createdAt: day(-3, 11, 0) },
    ],
  });

  console.log("Audit-Log …");
  await prisma.auditLog.createMany({
    data: [
      { organizationId: org.id, actorId: julia.id, actorName: "Julia Faber", action: "client.created", entityType: "Client", entityId: clients.nordstern.id, createdAt: day(-60) },
      { organizationId: org.id, actorId: daniel.id, actorName: "Daniel Weber", action: "request.created", entityType: "DocumentRequest", entityId: reqNordstern.id, metadata: { title: "Monatsbuchhaltung August 2026", items: 5 }, createdAt: day(-6) },
      { organizationId: org.id, actorName: "Metin Kaya", action: "document.uploaded_by_client", entityType: "Document", entityId: "demo", metadata: { fileName: "Eingangsrechnung Baustoff Händler.pdf" }, createdAt: day(-3) },
      { organizationId: org.id, actorName: "Jana Peters", action: "document.uploaded_by_client", entityType: "Document", entityId: "demo", metadata: { fileName: "Kassenbericht August 2026.pdf" }, createdAt: day(-1) },
      { organizationId: org.id, actorId: julia.id, actorName: "Julia Faber", action: "approval.requested", entityType: "ApprovalRequest", entityId: approvalPower.id, createdAt: day(-4) },
      { organizationId: org.id, actorId: daniel.id, actorName: "Daniel Weber", action: "document.status_changed", entityType: "Document", entityId: "demo", metadata: { from: "REVIEW", to: "ACCEPTED" }, createdAt: day(-8) },
    ],
  });

  console.log("Feature Flags …");
  await prisma.featureFlag.createMany({
    data: [
      { key: "ai_assistant", description: "KI-Assistent (Mock/Provider)", enabled: true },
      { key: "datev_export", description: "DATEV-CSV-Export (Vorbereitung)", enabled: true },
      { key: "stripe_billing", description: "Abrechnung über Stripe (Phase 3)", enabled: false },
      { key: "client_native_app", description: "Mandanten-App (Phase 3)", enabled: false },
    ],
  });

  console.log("\n✅ Seed abgeschlossen.\n");
  console.log("Demo-Zugänge (Passwort: demo1234!):");
  console.log("  Kanzleiinhaberin: julia.faber@faber-partner.demo");
  console.log("  Steuerberater:    daniel.weber@faber-partner.demo");
  console.log("  Sachbearbeiterin: lisa.koenig@faber-partner.demo");
  console.log("  Mandant (Nordstern): mandant@nordstern-bau.demo");
  console.log("  Plattform-Admin:  admin@steuerberaterflow.demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
