// Script para sincronizar os IDs dos professores com os IDs do Supabase Auth
const { createClient } = require("@supabase/supabase-js");

// Configuração do cliente Supabase (mesma do projeto)
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://rnvsemzycvhuyeatjkaq.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

// Verificar se a chave do Supabase está definida
if (!supabaseAnonKey) {
  console.error(
    "ERRO: A variável de ambiente REACT_APP_SUPABASE_KEY não está definida."
  );
  console.error(
    "Por favor, defina esta variável de ambiente com sua chave do Supabase antes de executar este script."
  );
  console.error(
    "Exemplo: REACT_APP_SUPABASE_KEY=sua_chave_aqui node sincronizar-professores.cjs"
  );
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  autoRefreshToken: true,
  persistSession: true,
});

// Lista de correspondência entre emails e UUIDs do Supabase Auth
const professoresAuth = [
  {
    email: "alexmolina.11@hotmail.com",
    authId: "27a803e6-7ded-4a40-9829-9aadb3ee41ae",
  },
  {
    email: "felipe2021eg@gmail.com",
    authId: "9c51be79-6418-40d5-91d0-18c49b8c9dce",
  },
  {
    email: "pedropsr@icloud.com",
    authId: "3211f123-8a12-4195-b6c7-53a4cb3d0aae",
  },
  {
    email: "alefmts22@gmail.com",
    authId: "cf060174-6f8f-49a6-acc4-fed7f28001af",
  },
  {
    email: "gavriel.albu13@gmail.com",
    authId: "ada1bd83-c338-489e-923f-cc61a6d95cab",
  },
  {
    email: "nal-dinho07@hotmail.com",
    authId: "3248a93e-7880-45dc-b5f5-c3f47a5ee3c6",
  },
  {
    email: "lipifp17@hotmail.com",
    authId: "d87b563c-7a05-4785-9687-727d3b57197d",
  },
  {
    email: "patrick.salgado1@gmail.com",
    authId: "39dd99bf-461a-48df-a2fc-51097b6190e8",
  },
  {
    email: "hcmoura11@gmail.com",
    authId: "7625bd7f-bafb-49a5-aade-2749caf27b64",
  },
  {
    email: "alexia2811@icloud.com",
    authId: "2ee23275-0625-48f4-b043-c7ba81f2ec85",
  },
  {
    email: "flavinha.fray1995@gmail.com",
    authId: "831cf87f-3ca4-4bd6-94e6-575c576ec728",
  },
];

/**
 * Função principal para sincronizar os IDs dos professores
 */
async function sincronizarProfessores() {
  console.log("Iniciando sincronização de IDs de professores...");

  try {
    // 1. Buscar todos os professores no banco de dados
    console.log("Buscando todos os professores no banco de dados...");
    const { data: professoresBD, error: errorBD } = await supabase
      .from("professores")
      .select("*");

    if (errorBD) {
      console.error("Erro ao buscar professores:", errorBD);
      return;
    }

    console.log(`Encontrados ${professoresBD.length} professores na tabela.`);

    // 2. Para cada professor no banco, verificar se há correspondência com um ID de autenticação
    let atualizados = 0;
    let naoEncontrados = [];

    for (const professor of professoresBD) {
      const email = professor.email?.toLowerCase();
      if (!email) {
        console.warn(`Professor ID ${professor.id} não tem email definido.`);
        continue;
      }

      // Buscar correspondência na lista de professores autenticados
      const professorAuth = professoresAuth.find(
        (p) => p.email.toLowerCase() === email
      );

      if (professorAuth) {
        console.log(
          `Encontrada correspondência para ${email}: ${professorAuth.authId}`
        );

        // 3. Atualizar o ID do professor para corresponder ao ID de autenticação
        const { error: updateError } = await supabase
          .from("professores")
          .update({ id: professorAuth.authId })
          .eq("id", professor.id);

        if (updateError) {
          console.error(`Erro ao atualizar professor ${email}:`, updateError);
        } else {
          console.log(`Professor ${email} atualizado com sucesso!`);
          atualizados++;

          // 4. Atualizar também as referências na tabela aulas (professor_id)
          const { error: aulasError } = await supabase
            .from("aulas")
            .update({ professor_id: professorAuth.authId })
            .eq("professor_id", professor.id);

          if (aulasError) {
            console.error(
              `Erro ao atualizar aulas do professor ${email}:`,
              aulasError
            );
          } else {
            console.log(`Aulas do professor ${email} atualizadas.`);
          }
        }
      } else {
        console.warn(`Não foi encontrada correspondência para ${email}`);
        naoEncontrados.push(email);
      }
    }

    // Resumo da operação
    console.log("\n=== RESUMO DA SINCRONIZAÇÃO ===");
    console.log(`Total de professores processados: ${professoresBD.length}`);
    console.log(`Professores sincronizados com sucesso: ${atualizados}`);
    console.log(`Professores sem correspondência: ${naoEncontrados.length}`);
    if (naoEncontrados.length > 0) {
      console.log("Lista de emails sem correspondência:");
      naoEncontrados.forEach((email) => console.log(`- ${email}`));
    }
  } catch (error) {
    console.error("Erro durante a sincronização dos professores:", error);
  }
}

// Executa a função de sincronização
sincronizarProfessores()
  .then(() => {
    console.log("Processo de sincronização finalizado.");
    // Esperar um momento para permitir que logs sejam impressos antes de encerrar
    setTimeout(() => process.exit(0), 1000);
  })
  .catch((err) => {
    console.error("Erro no processo principal:", err);
    process.exit(1);
  });
