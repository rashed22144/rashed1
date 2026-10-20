// Maps raw backend/database errors to friendly, translated UI messages.
// Raw error text (Postgres codes, RLS details, URLs) must never reach the UI.
export function getFriendlyErrorMessage(error, t) {
    const raw = `${error?.code || ''} ${error?.message || error?.original?.message || ''} ${error?.original?.code || ''}`.toLowerCase();

    if (!error) return t('errGeneric');
    if (raw.includes('not logged in') || raw.includes('jwt') || raw.includes('auth session missing')) {
        return t('errLoginRequired');
    }
    if (raw.includes('banned') || raw.includes('banned_until')) {
        return t('errBanned');
    }
    if (raw.includes('duplicate') || raw.includes('23505') || raw.includes('unique')) {
        return t('errDuplicateReview');
    }
    if (raw.includes('permission denied') || raw.includes('row-level security') || raw.includes('42501') || raw.includes('violates row-level')) {
        return t('errPermission');
    }
    if (raw.includes('limit') || raw.includes('too many') || raw.includes('max') && raw.includes('comment')) {
        return t('errLimitReached');
    }
    if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('load failed')) {
        return t('errNetwork');
    }
    return t('errGeneric');
}
