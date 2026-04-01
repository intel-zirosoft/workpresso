import type { DocumentScope, DocumentStatus } from '@/features/pod-a/services/document-schema';
import { documentScopeSchema, documentStatusSchema } from '@/features/pod-a/services/document-schema';
import type { StatusFilter } from '@/features/pod-a/components/document-workspace-shared';

export type DocumentWorkspaceViewConfig = {
  initialScope: DocumentScope;
  initialStatusFilter: StatusFilter;
  isMobileAppView: boolean;
};

function parseScope(rawValue: string | null): DocumentScope | null {
  const parsed = documentScopeSchema.safeParse(rawValue);
  return parsed.success ? parsed.data : null;
}

function parseStatusFilter(rawValue: string | null): StatusFilter | null {
  if (rawValue === 'ALL') {
    return 'ALL';
  }

  const parsed = documentStatusSchema.safeParse(rawValue);
  return parsed.success ? parsed.data : null;
}

export function getDocumentWorkspaceViewConfig(
  searchParams: URLSearchParams,
): DocumentWorkspaceViewConfig {
  const isMobileAppView = searchParams.get('mobile') === '1';
  const requestedScope = parseScope(searchParams.get('scope'));
  const requestedStatus = parseStatusFilter(searchParams.get('status'));

  if (!isMobileAppView) {
    return {
      initialScope: requestedScope ?? 'authored',
      initialStatusFilter: requestedStatus ?? 'ALL',
      isMobileAppView,
    };
  }

  return {
    initialScope: requestedScope ?? 'approvals',
    initialStatusFilter: requestedStatus ?? 'PENDING',
    isMobileAppView,
  };
}

export function getDocumentScopeOptions(isMobileAppView: boolean) {
  if (!isMobileAppView) {
    return ['authored', 'approvals', 'cc'] as const;
  }

  return ['approvals', 'cc', 'authored'] as const;
}
