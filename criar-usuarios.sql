-- Este é um script SQL que pode ser executado diretamente no Editor SQL do Supabase
-- Para criar um usuário administrador
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  (SELECT id FROM auth.instances LIMIT 1),
  uuid_generate_v4(),
  'admin@ironhouse.com.br',
  crypt('SenhaAdmin123', gen_salt('bf')),
  now(),
  '{"role": "admin", "nome": "Administrador IronHouse"}'::jsonb
);

-- Para criar um usuário professor
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  (SELECT id FROM auth.instances LIMIT 1),
  uuid_generate_v4(),
  'prof@ironhouse.com',
  crypt('SenhaProfessor123', gen_salt('bf')),
  now(),
  '{"role": "professor", "nome": "Professor IronHouse"}'::jsonb
);