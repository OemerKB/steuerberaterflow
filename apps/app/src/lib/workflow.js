/**
 * Reine Workflow-Logik (unit-testbar, ohne DB).
 */

/* ------------------------------ Aufgaben ---------------------------------- */

export const TASK_TRANSITIONS = {
  OPEN: ["IN_PROGRESS", "WAITING_CLIENT", "WAITING_FIRM", "DONE", "ARCHIVED"],
  IN_PROGRESS: ["OPEN", "WAITING_CLIENT", "WAITING_FIRM", "DONE", "ARCHIVED"],
  WAITING_CLIENT: ["OPEN", "IN_PROGRESS", "DONE", "ARCHIVED"],
  WAITING_FIRM: ["OPEN", "IN_PROGRESS", "DONE", "ARCHIVED"],
  DONE: ["OPEN", "ARCHIVED"],
  ARCHIVED: ["OPEN"],
};

export function canTransitionTask(from, to) {
  return (TASK_TRANSITIONS[from] || []).includes(to);
}

export function isTaskOverdue(task, now = new Date()) {
  if (!task || !task.dueDate) return false;
  if (task.status === "DONE" || task.status === "ARCHIVED") return false;
  return new Date(task.dueDate) < now;
}

/* -------------------------------- Fristen ---------------------------------- */

export function isDeadlineOverdue(deadline, now = new Date()) {
  if (!deadline || !deadline.dueDate) return false;
  if (deadline.status === "DONE") return false;
  return new Date(deadline.dueDate) < now;
}

/** Effektiver Status: gespeicherter Status + abgeleiteter Überfälligkeits-Flag. */
export function deadlineView(deadline, now = new Date()) {
  return { ...deadline, isOverdue: isDeadlineOverdue(deadline, now) };
}

/** Nächste Wiederholung einer Frist (rechnerische Vorlage – keine rechtsverbindliche Fristberechnung). */
export function nextRecurrenceDate(dueDate, recurrence) {
  const d = new Date(dueDate);
  switch (recurrence) {
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      return d;
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3);
      return d;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      return d;
    default:
      return null;
  }
}

/* --------------------------- Fehlende Unterlagen --------------------------- */

export function requestProgress(request) {
  const items = request?.items || [];
  const total = items.length;
  const provided = items.filter((i) => i.status === "UPLOADED" || i.status === "ACCEPTED").length;
  const missing = total - provided;
  return {
    total,
    provided,
    missing,
    percent: total === 0 ? 100 : Math.round((provided / total) * 100),
  };
}

/* ------------------------ Bearbeitungsstatus Mandant ----------------------- */

/**
 * Berechnet den verständlichen Bearbeitungsstatus einer Mandantenakte.
 * @param {object} aggregates { openTasks, missingItems, openQuestions, pendingApprovals, openRequests }
 */
export function clientProcessStatus(aggregates) {
  const { missingItems = 0, openQuestions = 0, pendingApprovals = 0, inProgress = 0, openTasks = 0 } = aggregates;
  if (pendingApprovals > 0) return "WAITING_APPROVAL";
  if (openQuestions > 0) return "OPEN_QUESTION";
  if (missingItems > 0) return "MISSING_DOCS";
  if (inProgress > 0 || openTasks > 0) return "IN_PROGRESS";
  return "COMPLETE";
}

/* -------------------------------- Dokumente -------------------------------- */

const EXT_TO_MIME = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
};

export function extensionOf(fileName) {
  const m = /\.([a-z0-9]{1,5})$/i.exec(fileName || "");
  return m ? `.${m[1].toLowerCase()}` : "";
}

/**
 * Datei-Validierung: Typ, Größe, Name.
 * @returns {{ok: boolean, errors: string[]}}
 */
export function validateUpload({ fileName, mimeType, sizeBytes, maxBytes, allowedMimeTypes, allowedExtensions }) {
  const errors = [];
  if (!fileName || fileName.length > 200) errors.push("Ungültiger Dateiname.");
  const ext = extensionOf(fileName);
  if (allowedExtensions && !allowedExtensions.includes(ext)) {
    errors.push(`Dateityp „${ext || "unbekannt"}" ist nicht erlaubt.`);
  }
  if (mimeType && allowedMimeTypes && !allowedMimeTypes.includes(mimeType)) {
    errors.push(`Dateiformat „${mimeType}" ist nicht erlaubt.`);
  }
  // Tarnungs-Schutz: bekannte Extension und bekannter MIME-Typ müssen zusammenpassen
  const expectedMime = EXT_TO_MIME[ext];
  if (expectedMime && mimeType && expectedMime !== mimeType) {
    errors.push("Dateiendung und Dateiformat passen nicht zusammen.");
  }
  if (!sizeBytes || sizeBytes <= 0) errors.push("Die Datei ist leer.");
  if (sizeBytes > maxBytes) {
    errors.push(`Die Datei ist zu groß (max. ${Math.round(maxBytes / (1024 * 1024))} MB).`);
  }
  return { ok: errors.length === 0, errors };
}

export function isPreviewable(mimeType) {
  return ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(mimeType);
}
