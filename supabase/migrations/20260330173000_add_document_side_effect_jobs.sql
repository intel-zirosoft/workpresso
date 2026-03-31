CREATE TABLE IF NOT EXISTS public.document_side_effect_jobs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    job_type VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'PENDING',
    payload JSONB DEFAULT '{}'::jsonb,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    available_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    locked_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT document_side_effect_jobs_unique_job UNIQUE (document_id, job_type)
);

CREATE INDEX IF NOT EXISTS idx_document_side_effect_jobs_status_available_at
    ON public.document_side_effect_jobs (status, available_at);

ALTER TABLE public.document_side_effect_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_side_effect_jobs FORCE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_updated_at ON public.document_side_effect_jobs;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.document_side_effect_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
