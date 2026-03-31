CREATE TABLE IF NOT EXISTS public.user_slack_identities (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    slack_user_id VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_slack_identities_slack_user_id
    ON public.user_slack_identities (slack_user_id);

ALTER TABLE public.user_slack_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_slack_identities FORCE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_updated_at ON public.user_slack_identities;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.user_slack_identities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
