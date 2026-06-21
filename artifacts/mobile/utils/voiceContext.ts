let _pendingVoice: { duration: number } | null = null;

export function setPendingVoice(duration: number): void {
  _pendingVoice = { duration };
}

export function takePendingVoice(): { duration: number } | null {
  const v = _pendingVoice;
  _pendingVoice = null;
  return v;
}
