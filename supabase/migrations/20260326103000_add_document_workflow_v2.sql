DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_step_status') THEN
        CREATE TYPE public.APPROVAL_STEP_STATUS AS ENUM ('WAITING', 'PENDING', 'APPROVED', 'REJECTED');
    END IF;
END $$;

ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS final_approved_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS public.document_approval_steps (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_label VARCHAR NOT NULL,
    approver_id UUID NOT NULL REFERENCES public.users(id),
    status public.APPROVAL_STEP_STATUS NOT NULL DEFAULT 'WAITING'::public.APPROVAL_STEP_STATUS,
    acted_at TIMESTAMP WITH TIME ZONE,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT document_approval_steps_unique_order UNIQUE (document_id, step_order)
);

CREATE TABLE IF NOT EXISTS public.document_cc_recipients (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT document_cc_recipients_unique_recipient UNIQUE (document_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_document_approval_steps_document_id
    ON public.document_approval_steps (document_id);

CREATE INDEX IF NOT EXISTS idx_document_approval_steps_approver_status
    ON public.document_approval_steps (approver_id, status);

CREATE INDEX IF NOT EXISTS idx_document_cc_recipients_document_id
    ON public.document_cc_recipients (document_id);

CREATE INDEX IF NOT EXISTS idx_document_cc_recipients_recipient_id
    ON public.document_cc_recipients (recipient_id);

ALTER TABLE public.document_approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approval_steps FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_cc_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_cc_recipients FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'document_approval_steps'
          AND policyname = 'document_approval_steps_select_related'
    ) THEN
        CREATE POLICY document_approval_steps_select_related
        ON public.document_approval_steps
        FOR SELECT
        USING (
            deleted_at IS NULL
            AND EXISTS (
                SELECT 1
                FROM public.documents d
                WHERE d.id = document_id
                  AND d.deleted_at IS NULL
                  AND (
                    d.author_id = auth.uid()
                    OR approver_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM public.document_cc_recipients c
                        WHERE c.document_id = document_id
                          AND c.recipient_id = auth.uid()
                          AND c.deleted_at IS NULL
                    )
                  )
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'document_approval_steps'
          AND policyname = 'document_approval_steps_insert_author'
    ) THEN
        CREATE POLICY document_approval_steps_insert_author
        ON public.document_approval_steps
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
          AND tablename = 'document_approval_steps'
          AND policyname = 'document_approval_steps_update_related'
    ) THEN
        CREATE POLICY document_approval_steps_update_related
        ON public.document_approval_steps
        FOR UPDATE
        USING (
            EXISTS (
                SELECT 1
                FROM public.documents d
                WHERE d.id = document_id
                  AND d.deleted_at IS NULL
                  AND (d.author_id = auth.uid() OR approver_id = auth.uid())
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1
                FROM public.documents d
                WHERE d.id = document_id
                  AND d.deleted_at IS NULL
                  AND (d.author_id = auth.uid() OR approver_id = auth.uid())
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'document_cc_recipients'
          AND policyname = 'document_cc_recipients_select_related'
    ) THEN
        CREATE POLICY document_cc_recipients_select_related
        ON public.document_cc_recipients
        FOR SELECT
        USING (
            deleted_at IS NULL
            AND (
                recipient_id = auth.uid()
                OR EXISTS (
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
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'document_cc_recipients'
          AND policyname = 'document_cc_recipients_insert_author'
    ) THEN
        CREATE POLICY document_cc_recipients_insert_author
        ON public.document_cc_recipients
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
          AND tablename = 'document_cc_recipients'
          AND policyname = 'document_cc_recipients_update_author'
    ) THEN
        CREATE POLICY document_cc_recipients_update_author
        ON public.document_cc_recipients
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
