CREATE TABLE IF NOT EXISTS public.document_jira_links (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    issue_key VARCHAR NOT NULL,
    issue_url VARCHAR NOT NULL,
    issue_type VARCHAR NOT NULL,
    summary VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'To Do',
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT document_jira_links_unique_issue UNIQUE (document_id, issue_key)
);

CREATE INDEX IF NOT EXISTS idx_document_jira_links_document_id
    ON public.document_jira_links (document_id);

CREATE INDEX IF NOT EXISTS idx_document_jira_links_issue_key
    ON public.document_jira_links (issue_key);

ALTER TABLE public.document_jira_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_jira_links FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'document_jira_links'
          AND policyname = 'document_jira_links_select_related'
    ) THEN
        CREATE POLICY document_jira_links_select_related
        ON public.document_jira_links
        FOR SELECT
        USING (
            deleted_at IS NULL
            AND (
                EXISTS (
                    SELECT 1
                    FROM public.documents d
                    WHERE d.id = document_id
                      AND d.deleted_at IS NULL
                      AND d.author_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.document_approval_steps s
                    WHERE s.document_id = document_id
                      AND s.deleted_at IS NULL
                      AND s.approver_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.document_cc_recipients c
                    WHERE c.document_id = document_id
                      AND c.recipient_id = auth.uid()
                      AND c.deleted_at IS NULL
                )
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'document_jira_links'
          AND policyname = 'document_jira_links_insert_author'
    ) THEN
        CREATE POLICY document_jira_links_insert_author
        ON public.document_jira_links
        FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1
                FROM public.documents d
                WHERE d.id = document_id
                  AND d.author_id = auth.uid()
                  AND d.deleted_at IS NULL
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'document_jira_links'
          AND policyname = 'document_jira_links_update_author'
    ) THEN
        CREATE POLICY document_jira_links_update_author
        ON public.document_jira_links
        FOR UPDATE
        USING (
            EXISTS (
                SELECT 1
                FROM public.documents d
                WHERE d.id = document_id
                  AND d.author_id = auth.uid()
                  AND d.deleted_at IS NULL
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1
                FROM public.documents d
                WHERE d.id = document_id
                  AND d.author_id = auth.uid()
                  AND d.deleted_at IS NULL
            )
        );
    END IF;
END $$;
