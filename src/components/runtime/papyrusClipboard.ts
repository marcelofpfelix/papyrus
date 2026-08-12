export async function copyPapyrusText(text: string, promptLabel = "Copy text"): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  window.prompt(promptLabel, text);
  return false;
}
