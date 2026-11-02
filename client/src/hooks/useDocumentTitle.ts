import { useEffect } from 'react';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/constants';

export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  }, [title]);
}
