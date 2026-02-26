function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  return e !== null && typeof e === "object" && ("code" in e || "errno" in e);
}

export function isPidAlive(pid: number) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    const code = isErrnoException(e) ? String(e.code ?? "") : "";
    if (code === "EPERM") return true; // exists but not allowed to signal
    return false;
  }
}

