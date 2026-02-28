import { prisma } from "@/lib/db";

function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  return e !== null && typeof e === "object" && ("code" in e || "errno" in e);
}

function killProcessGroupOrPid(pid: number) {
  if (process.platform !== "win32") {
    try {
      process.kill(-pid, "SIGTERM");
      return { attempted: true, sent: true, message: `Sent SIGTERM to process group ${-pid}.` };
    } catch {
      // fall through to try the pid directly
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

export async function cancelJobRun(runId: string) {
  const run = await prisma.jobRun.findUnique({
    where: { id: runId },
    select: { id: true, status: true },
  });
  if (!run) return { ok: false as const, status: 404 as const, message: "Run not found." };
  if (run.status !== "RUNNING") {
    return { ok: true as const, status: 200 as const, message: "Run is not RUNNING; nothing to cancel." };
  }

  // Try to get pid only if the column exists (client may be stale). We still mark CANCELED either way.
  let pid: number | null = null;
  try {
    const withPid = await prisma.jobRun.findUnique({
      where: { id: runId },
      select: { pid: true },
    });
    pid = withPid?.pid ?? null;
  } catch {
    // pid column may not exist in generated client yet
  }

  const kill =
    typeof pid === "number" && Number.isFinite(pid) && pid > 0
      ? killProcessGroupOrPid(pid)
      : { attempted: false, sent: false, message: "No pid recorded for this run." };

  await prisma.jobRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: {
      status: "CANCELED",
      finishedAt: new Date(),
      errorText: `Canceled by user. ${kill.message}`,
    },
  });

  return { ok: true as const, status: 200 as const, message: `Canceled. ${kill.message}` };
}
