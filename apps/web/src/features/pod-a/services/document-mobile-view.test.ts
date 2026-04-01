import { describe, expect, it } from 'vitest';

import {
  getDocumentScopeOptions,
  getDocumentStatusFilterOptions,
  getDocumentWorkspaceViewConfig,
} from '@/features/pod-a/services/document-mobile-view';

describe('getDocumentWorkspaceViewConfig', () => {
  it('uses authored/all defaults for web view', () => {
    const config = getDocumentWorkspaceViewConfig(new URLSearchParams());

    expect(config).toEqual({
      initialScope: 'authored',
      initialStatusFilter: 'ALL',
      isMobileAppView: false,
    });
  });

  it('uses approvals/pending defaults for mobile app view', () => {
    const config = getDocumentWorkspaceViewConfig(
      new URLSearchParams('mobile=1'),
    );

    expect(config).toEqual({
      initialScope: 'approvals',
      initialStatusFilter: 'PENDING',
      isMobileAppView: true,
    });
  });

  it('accepts valid explicit scope and status overrides', () => {
    const config = getDocumentWorkspaceViewConfig(
      new URLSearchParams('mobile=1&scope=cc&status=APPROVED'),
    );

    expect(config).toEqual({
      initialScope: 'cc',
      initialStatusFilter: 'APPROVED',
      isMobileAppView: true,
    });
  });

  it('ignores invalid params and falls back safely', () => {
    const config = getDocumentWorkspaceViewConfig(
      new URLSearchParams('mobile=1&scope=invalid&status=WRONG'),
    );

    expect(config).toEqual({
      initialScope: 'approvals',
      initialStatusFilter: 'PENDING',
      isMobileAppView: true,
    });
  });
});

describe('getDocumentScopeOptions', () => {
  it('prioritizes approvals for mobile app view', () => {
    expect(getDocumentScopeOptions(true)).toEqual(['approvals', 'cc', 'authored']);
  });

  it('keeps authored-first ordering for web view', () => {
    expect(getDocumentScopeOptions(false)).toEqual(['authored', 'approvals', 'cc']);
  });
});

describe('getDocumentStatusFilterOptions', () => {
  it('hides draft-first filtering in mobile app view', () => {
    expect(getDocumentStatusFilterOptions(true)).toEqual([
      'PENDING',
      'ALL',
      'APPROVED',
      'REJECTED',
    ]);
  });

  it('keeps all filters in web view', () => {
    expect(getDocumentStatusFilterOptions(false)).toEqual([
      'ALL',
      'DRAFT',
      'PENDING',
      'APPROVED',
      'REJECTED',
    ]);
  });
});
