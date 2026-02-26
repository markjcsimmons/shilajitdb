import { prisma } from "@/lib/db";

function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  return e !== null && typeof e === "object" && ("code" in e || "errno" in e);
}

function killProcessGroupOrPid(pid: number) {
  if (process.platform !== "win32") {
    try {
      process.kill(-pid, "SIGTERM");
      return { attempted: true, sent: true, message: `Sent SIGTERM to process group ${-pid}.` };
    } catch (e) {
      // fall through to try the pid directly
      const code = isErrnoException(e) ? String(e.code ?? "") : "";
      if (code && code !== "ESRCH") {
        // EPERM, etc: still try pid below, but keep some context
      }
    }
  }

  try {
    process.kill(pid, "SIGTERM");
    return { attempted: true, sent: true, message: `Sent SIGTERM to pid ${pid}.` };
  } catch (e) {
    const code = isErrnoException(e) ? String(e.code ?? "") : "";
    if (code === "ESRCH") return { attempted: true, sent: false, message: `Process ${pid} not found (already exited).` };
    return {
      attempted: true,
      sent: false,
      message: `Failed to SIGTERM pid ${pid}${code ? ` (${code})` : ""}.`,
    };
  }
}

export async function cancelIngestionRun(runId: string) {
  const run = await prisma.ingestionRun.findUnique({
    where: { id: runId },
    select: { id: true, status: true, pid: true },
  });
  if (!run) return { ok: false as const, status: 404 as const, message: "Run not found." };
  if (run.status !== "RUNNING") {
    return { ok: true as const, status: 200 as const, message: "Run is not RUNNING; nothing to cancel." };
  }

  const kill =
    typeof run.pid === "number" && Number.isFinite(run.pid) && run.pid > 0
      ? killProcessGroupOrPid(run.pid)
      : { attempted: false, sent: false, message: "No pid recorded for this run." };

  const update = await prisma.ingestionRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: {
      status: "CANCELED",
      finishedAt: new Date(),
      errorText: `Canceled by user. ${kill.message}`,
    },
  });

  if (update.count === 0) {
    return { ok: true as const, status: 200 as const, message: "Run finished while cancelling; no update applied." };
  }

  return { ok: true as const, status: 200 as const, message: `Canceled. ${kill.message}` };
}

