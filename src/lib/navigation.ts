/**
 * Safely navigates back if history exists, otherwise navigates to fallback path.
 * Prevents "The action 'GO_BACK' was not handled by any navigator" error.
 */
export function safeGoBack(router: any, fallback: string = '/(tabs)/dashboard') {
  try {
    if (router && typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
    } else if (router && typeof router.replace === 'function') {
      router.replace(fallback);
    }
  } catch (e) {
    try {
      if (router && typeof router.replace === 'function') {
        router.replace(fallback);
      }
    } catch {
      // ignore
    }
  }
}
