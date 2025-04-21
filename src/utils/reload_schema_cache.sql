-- Função para recarregar o cache do esquema do Supabase
create or replace function public.reload_schema_cache()
returns boolean
language plpgsql
security definer
as $$
begin
  notify pgrst, 'reload schema';
  return true;
end;
$$; 