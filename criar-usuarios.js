// Este arquivo deve ser executado localmente com Node.js, não no SQL Editor do Supabase
const { createClient } = require("@supabase/supabase-js");

// Substitua estas variáveis com suas informações reais do Supabase
const supabaseUrl = "https://rnvsemzycvhuyeatjkaq.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudnNlbXp5Y3ZodXllYXRqa2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDk0NTAsImV4cCI6MjA2MDM4NTQ1MH0.d2GTmTBAUIINoL52Ylz4tXsnhPLBTynOtvKlVa5sy60"; // use a service key, não a anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarUsuarios() {
  // Criar admin
  const { data: adminData, error: adminError } =
    await supabase.auth.admin.createUser({
      email: "admin@ironhouse.com.br",
      password: "SenhaAdmin123",
      email_confirm: true,
      user_metadata: {
        nome: "Administrador IronHouse",
        role: "admin",
      },
    });

  if (adminError) {
    console.error("Erro ao criar admin:", adminError);
  } else {
    console.log("Admin criado com sucesso!", adminData);
  }

  // Criar professor
  const { data: profData, error: profError } =
    await supabase.auth.admin.createUser({
      email: "prof@ironhouse.com",
      password: "SenhaProfessor123",
      email_confirm: true,
      user_metadata: {
        nome: "Professor IronHouse",
        role: "professor",
      },
    });

  if (profError) {
    console.error("Erro ao criar professor:", profError);
  } else {
    console.log("Professor criado com sucesso!", profData);
  }
}

criarUsuarios();
