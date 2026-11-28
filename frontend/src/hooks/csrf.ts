/**
 * Temporary compatibility helper.
 *
 * CSRF protection is disabled because authentication
 * now uses JWT Bearer tokens.
 *
 * This function can be removed after its callers
 * have been cleaned up.
 */
export const getCsrfHeaders = async (): Promise<Record<string, string>> => {
    return {};
};
