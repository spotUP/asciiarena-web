/**
 * Telling "the site was redeployed under this tab" apart from a real failure.
 *
 * Next names every server action with a hash of the build. Deploy a new build
 * and a page still open in someone's browser keeps calling the OLD names, which
 * the running server no longer knows:
 *
 *   Error: Failed to find Server Action "70335946...". This request might be
 *   from an older or newer deployment.
 *
 * The call rejects, so the handler that awaited it stops where it stood. Every
 * form on the site behaved the same way as a result: press the button, nothing
 * happens, no message, no clue -- which is exactly how it was reported for
 * posting a forum topic and for saving a comment edit.
 *
 * Nothing the reader did is wrong and nothing they typed is lost, so the answer
 * is to say so and ask them to reload rather than show them a hash.
 */

export const STALE_DEPLOYMENT_MESSAGE =
  "The site was updated while this page was open. Reload the page and try again -- your text is still here.";

/** Does this rejection mean the page outlived the build that served it? */
export function isStaleActionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return (
    message.includes("Failed to find Server Action") ||
    message.includes("older or newer deployment")
  );
}

/**
 * What to show the reader for a failed action: the reload notice when the build
 * moved under them, otherwise `fallback`.
 *
 * The underlying message is deliberately not shown for anything else -- a raw
 * exception string is not an explanation.
 */
export function actionErrorMessage(err: unknown, fallback: string): string {
  return isStaleActionError(err) ? STALE_DEPLOYMENT_MESSAGE : fallback;
}
