"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card, CardContent, Button, Input, Label, Textarea, NativeSelect, Checkbox,
  FieldError, Badge,
} from "@steuerberaterflow/ui";
import { Check, ChevronLeft, ChevronRight, Building2, User, FileText, Mail, ClipboardList, UserCheck, Landmark, Scale, Receipt } from "lucide-react";
import { createClientAction } from "@/actions/clients";
import { CLIENT_TYPE_LABELS, TAX_TYPE_LABELS } from "@/lib/labels";

const STEPS = [
  { id: 1, title: "Person oder Unternehmen", icon: User },
  { id: 2, title: "Stammdaten", icon: Building2 },
  { id: 3, title: "Rechtsform", icon: Scale },
  { id: 4, title: "Ansprechpartner", icon: UserCheck },
  { id: 5, title: "Steuerarten", icon: Landmark },
  { id: 6, title: "Benötigte Unterlagen", icon: FileText },
  { id: 7, title: "Zuständigkeit & Einladung", icon: Mail },
];

const SUGGESTED_DOCUMENTS = [
  "Gewerbeanmeldung",
  "Handelsregisterauszug",
  "Gesellschaftervertrag",
  "letzte Steuerbescheide",
  "Bankverbindung",
  "Vollmacht",
  "bestehende Auswertungen (BWA, Bilanz)",
  "Identifikationsunterlagen",
];

const TYPE_TO_LEGAL = {
  INDIVIDUAL: ["INDIVIDUAL", "PRIVATE"],
  FREELANCER: ["FREELANCER"],
  COMPANY: ["GMBH", "UG"],
  ASSOCIATION: ["ASSOCIATION"],
  LANDLORD: ["LANDLORD"],
  SOLE_TRADER: ["SOLE_TRADER"],
};

const CATEGORY_ICONS = {
  INDIVIDUAL: User,
  SOLE_TRADER: Receipt,
  FREELANCER: FileText,
  COMPANY: Building2,
  ASSOCIATION: User,
  LANDLORD: Building2,
};

const CATEGORY_LABELS = {
  INDIVIDUAL: "Privatperson",
  COMPANY: "Kapitalgesellschaft",
  SOLE_TRADER: "Einzelunternehmen",
  FREELANCER: "Freiberufler",
  ASSOCIATION: "Verein",
  LANDLORD: "Vermieter",
};

/** Geführtes digitales Mandanten-Onboarding mit Fortschritt in Prozent. */
export function OnboardingWizard({ staff, backHref = "/clients" }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createClientAction, {});
  const [step, setStep] = useState(1);
  const [taxTypes, setTaxTypes] = useState([]);
  const [requiredDocs, setRequiredDocs] = useState([...SUGGESTED_DOCUMENTS]);
  const [category, setCategory] = useState("COMPANY");

  useEffect(() => {
    if (state?.success) {
      toast.success("Mandant angelegt.");
      router.push(`/clients/${state.clientId}`);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const progress = Math.round(((step - 1) / STEPS.length) * 100);

  return (
    <div>
      {/* Fortschritt */}
      <Card className="mb-4">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted">Onboarding-Fortschritt</p>
            <span className="text-xs font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-accent/50 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <ol className="mt-3 flex flex-wrap gap-1.5">
            {STEPS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium cursor-pointer ${
                    step === s.id ? "bg-accent text-accent-foreground" : step > s.id ? "text-primary" : "text-muted"
                  }`}
                >
                  {step > s.id ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                  {s.id}. {s.title}
                </button>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <form action={formAction}>
        <Card>
          <CardContent className="pt-5 space-y-4">
            {/* Schritt 1 */}
            <div className={step === 1 ? "" : "hidden"}>
              <h2 className="text-sm font-semibold mb-3">Person oder Unternehmen auswählen</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.keys(TYPE_TO_LEGAL).map((cat) => {
                  const Icon = CATEGORY_ICONS[cat] || User;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { setCategory(cat); setStep(2); }}
                      className={`rounded-lg border p-3 text-left hover:border-primary transition-colors cursor-pointer ${
                        category === cat ? "border-primary bg-accent/40" : "border-border"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-primary mb-1.5" />
                      <p className="text-sm font-medium">{CATEGORY_LABELS[cat]}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schritt 2 */}
            <div className={step === 2 ? "" : "hidden"}>
              <h2 className="text-sm font-semibold mb-3">Stammdaten erfassen</h2>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ob-name">Name / Firmierung *</Label>
                  <Input id="ob-name" name="name" required minLength={2} placeholder="z. B. Nordstern Bau GmbH" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ob-email">E-Mail</Label>
                    <Input id="ob-email" name="email" type="email" placeholder="info@unternehmen.de" />
                  </div>
                  <div>
                    <Label htmlFor="ob-phone">Telefon</Label>
                    <Input id="ob-phone" name="phone" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-4 sm:col-span-2">
                    <Label htmlFor="ob-street">Straße &amp; Nr.</Label>
                    <Input id="ob-street" name="street" />
                  </div>
                  <div>
                    <Label htmlFor="ob-plz">PLZ</Label>
                    <Input id="ob-plz" name="postalCode" />
                  </div>
                  <div>
                    <Label htmlFor="ob-city">Ort</Label>
                    <Input id="ob-city" name="city" />
                  </div>
                </div>
              </div>
            </div>

            {/* Schritt 3 */}
            <div className={step === 3 ? "" : "hidden"}>
              <h2 className="text-sm font-semibold mb-3">Rechtsform bestimmen</h2>
              <div>
                <Label htmlFor="ob-type">Rechtsform *</Label>
                <NativeSelect
                  id="ob-type"
                  name="type"
                  defaultValue={TYPE_TO_LEGAL[category]?.[0] || "GMBH"}
                  key={category}
                >
                  {(TYPE_TO_LEGAL[category] || ["GMBH"]).map((t) => (
                    <option key={t} value={t}>{CLIENT_TYPE_LABELS[t]}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label htmlFor="ob-taxnumber">Steuernummer</Label>
                  <Input id="ob-taxnumber" name="taxNumber" />
                </div>
                <div>
                  <Label htmlFor="ob-vat">USt-IdNr.</Label>
                  <Input id="ob-vat" name="vatId" />
                </div>
              </div>
              <p className="text-xs text-muted mt-2">Angaben optional – können später in den Stammdaten ergänzt werden.</p>
            </div>

            {/* Schritt 4 */}
            <div className={step === 4 ? "" : "hidden"}>
              <h2 className="text-sm font-semibold mb-3">Ansprechpartner hinzufügen</h2>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ob-contact-name">Name</Label>
                  <Input id="ob-contact-name" name="contactName" placeholder="z. B. Metin Kaya" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ob-contact-email">E-Mail (Portal-Zugang)</Label>
                    <Input id="ob-contact-email" name="contactEmail" type="email" />
                  </div>
                  <div>
                    <Label htmlFor="ob-contact-phone">Telefon</Label>
                    <Input id="ob-contact-phone" name="contactPhone" />
                  </div>
                </div>
                <p className="text-xs text-muted">Die E-Mail des Ansprechpartners wird für den Mandantenportal-Zugang verwendet.</p>
              </div>
            </div>

            {/* Schritt 5 */}
            <div className={step === 5 ? "" : "hidden"}>
              <h2 className="text-sm font-semibold mb-3">Steuerarten auswählen</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TAX_TYPE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTaxTypes(taxTypes.includes(key) ? taxTypes.filter((t) => t !== key) : [...taxTypes, key])}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                      taxTypes.includes(key) ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted hover:border-primary/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {taxTypes.map((t) => <input key={t} type="hidden" name="taxTypes" value={t} />)}
            </div>

            {/* Schritt 6 */}
            <div className={step === 6 ? "" : "hidden"}>
              <h2 className="text-sm font-semibold mb-3">Benötigte Unterlagen festlegen</h2>
              <p className="text-xs text-muted mb-2">Wählbare Vorlagen – erscheinen als Checkliste im Mandantenportal.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {SUGGESTED_DOCUMENTS.map((doc) => (
                  <label key={doc} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm cursor-pointer hover:border-primary/50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={requiredDocs.includes(doc)}
                      onChange={() =>
                        setRequiredDocs(requiredDocs.includes(doc) ? requiredDocs.filter((d) => d !== doc) : [...requiredDocs, doc])
                      }
                    />
                    {doc}
                  </label>
                ))}
              </div>
              {requiredDocs.map((d) => <input key={d} type="hidden" name="requiredDocuments" value={d} />)}
            </div>

            {/* Schritt 7 */}
            <div className={step === 7 ? "" : "hidden"}>
              <h2 className="text-sm font-semibold mb-3">Zuständigkeit &amp; Einladung</h2>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ob-responsible">Zuständiger Mitarbeiter</Label>
                  <NativeSelect id="ob-responsible" name="responsibleUserId" defaultValue="">
                    <option value="">– mir selbst –</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </NativeSelect>
                </div>
                <Checkbox name="sendInvite" label="Mandanten-Portal-Einladung per E-Mail versenden" defaultChecked />
              </div>
            </div>

            <FieldError>{state?.error}</FieldError>

            {/* Navigation */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="flex gap-2">
                {step > 1 ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => setStep(step - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" /> Zurück
                  </Button>
                ) : (
                  <Link href={backHref}><Button type="button" variant="ghost" size="sm">Abbrechen</Button></Link>
                )}
              </div>
              <div className="flex gap-2">
                {step < 7 ? (
                  <Button type="button" size="sm" onClick={() => setStep(step + 1)} disabled={step === 1}>
                    Weiter <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button type="submit" size="sm" disabled={pending}>
                    {pending ? "Wird angelegt…" : "Mandant anlegen"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
