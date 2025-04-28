// Script para inserir os professores no banco de dados
const { createClient } = require("@supabase/supabase-js");

// Configuração do cliente Supabase
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
    "Exemplo: REACT_APP_SUPABASE_KEY=sua_chave_aqui node inserir-professores.cjs"
  );
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  autoRefreshToken: true,
  persistSession: true,
});

// Lista de professores com seus IDs de autenticação
const professores = [
  {
    id: "27a803e6-7ded-4a40-9829-9aadb3ee41ae",
    nome: "Alex Molina",
    // Campos email e telefone serão adicionados só se existirem na tabela
  },
  {
    id: "9c51be79-6418-40d5-91d0-18c49b8c9dce",
    nome: "Felipe Barbosa",
  },
  {
    id: "3211f123-8a12-4195-b6c7-53a4cb3d0aae",
    nome: "Pedro Pacheco",
  },
  {
    id: "cf060174-6f8f-49a6-acc4-fed7f28001af",
    nome: "Alef Guimarães",
  },
  {
    id: "ada1bd83-c338-489e-923f-cc61a6d95cab",
    nome: "Gabriel Medeiros",
  },
  {
    id: "3248a93e-7880-45dc-b5f5-c3f47a5ee3c6",
    nome: "Reinaldo Oliveira",
  },
  {
    id: "d87b563c-7a05-4785-9687-727d3b57197d",
    nome: "Filipe Florenzano",
  },
  {
    id: "39dd99bf-461a-48df-a2fc-51097b6190e8",
    nome: "Patrick Salgado",
  },
  {
    id: "7625bd7f-bafb-49a5-aade-2749caf27b64",
    nome: "Hellen Almeida",
  },
  {
    id: "2ee23275-0625-48f4-b043-c7ba81f2ec85",
    nome: "Alexia Carvalho",
  },
  {
    id: "831cf87f-3ca4-4bd6-94e6-575c576ec728",
    nome: "Flávia J",
  },
];

/**
 * Função para verificar a estrutura da tabela professores
 */
async function verificarEstrutura() {
  console.log("Verificando estrutura da tabela professores...");

  try {
    // Tentar obter os campos disponíveis na tabela professores
    const { data, error } = await supabase
      .from("professores")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Erro ao verificar estrutura:", error);
      throw error;
    }

    // Se não há registros, vamos usar uma consulta introspectiva
    if (!data || data.length === 0) {
      console.log("Tabela vazia, tentando obter estrutura via metadados...");

      try {
        // Usar função RPC para obter a definição da tabela, se disponível
        const { data: tableInfo, error: tableError } = await supabase.rpc(
          "get_table_definition",
          { table_name: "professores" }
        );

        if (tableError) {
          console.log("RPC não disponível, realizando consulta direta...");

          // Fazer uma consulta simples para forçar recarregar o cache
          await supabase.from("professores").select("id").limit(0);

          // Criar estrutura mínima com campos obrigatórios
          return {
            temId: true,
            temNome: true,
            temEmail: false,
            temTelefone: false,
          };
        }

        console.log("Definição da tabela:", tableInfo);
        return {
          temId: true, // Assumimos que ID sempre existe
          temNome: true, // Assumimos que nome sempre existe
          temEmail: false, // Vamos verificar durante a inserção
          temTelefone: false, // Vamos verificar durante a inserção
        };
      } catch (metaError) {
        console.warn("Erro ao buscar metadados:", metaError);
        return {
          temId: true,
          temNome: true,
          temEmail: false,
          temTelefone: false,
        };
      }
    }

    // Analisar os campos disponíveis no primeiro registro
    const campos = data[0] ? Object.keys(data[0]) : [];
    console.log("Campos disponíveis:", campos);

    return {
      temId: campos.includes("id"),
      temNome: campos.includes("nome"),
      temEmail: campos.includes("email"),
      temTelefone: campos.includes("telefone"),
    };
  } catch (error) {
    console.error("Erro ao verificar estrutura:", error);
    return { temId: true, temNome: true, temEmail: false, temTelefone: false };
  }
}

/**
 * Função para inserir os professores no banco de dados
 */
async function inserirProfessores() {
  console.log("Iniciando inserção de professores...");

  try {
    // Verificar a estrutura da tabela
    const estrutura = await verificarEstrutura();
    console.log("Estrutura da tabela:", estrutura);

    // Adicionar campos se estiverem disponíveis na tabela
    const dadosEmail = {
      "27a803e6-7ded-4a40-9829-9aadb3ee41ae": "alexmolina.11@hotmail.com",
      "9c51be79-6418-40d5-91d0-18c49b8c9dce": "felipe2021eg@gmail.com",
      "3211f123-8a12-4195-b6c7-53a4cb3d0aae": "pedropsr@icloud.com",
      "cf060174-6f8f-49a6-acc4-fed7f28001af": "alefmts22@gmail.com",
      "ada1bd83-c338-489e-923f-cc61a6d95cab": "gavriel.albu13@gmail.com",
      "3248a93e-7880-45dc-b5f5-c3f47a5ee3c6": "nal-dinho07@hotmail.com",
      "d87b563c-7a05-4785-9687-727d3b57197d": "lipifp17@hotmail.com",
      "39dd99bf-461a-48df-a2fc-51097b6190e8": "patrick.salgado1@gmail.com",
      "7625bd7f-bafb-49a5-aade-2749caf27b64": "hcmoura11@gmail.com",
      "2ee23275-0625-48f4-b043-c7ba81f2ec85": "alexia2811@icloud.com",
      "831cf87f-3ca4-4bd6-94e6-575c576ec728": "flavinha.fray1995@gmail.com",
    };

    if (estrutura.temEmail) {
      professores.forEach((p) => {
        p.email = dadosEmail[p.id] || "";
      });
    }

    if (estrutura.temTelefone) {
      professores.forEach((p) => {
        p.telefone = "(00) 0000-0000"; // Telefone padrão
      });
    }

    // Inserir os professores um a um para melhor controle
    let inseridos = 0;
    let erros = 0;

    for (const professor of professores) {
      console.log(`Inserindo professor: ${professor.nome}`);

      const { data, error } = await supabase
        .from("professores")
        .upsert(professor, { onConflict: "id" }) // Atualiza se o ID já existir
        .select();

      if (error) {
        console.error(`Erro ao inserir ${professor.nome}:`, error);
        erros++;
      } else {
        console.log(`Professor ${professor.nome} inserido com sucesso.`);
        inseridos++;
      }

      // Pequena pausa para evitar sobrecarga
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Resumo da operação
    console.log("\n=== RESUMO DA OPERAÇÃO ===");
    console.log(`Total de professores processados: ${professores.length}`);
    console.log(`Professores inseridos/atualizados com sucesso: ${inseridos}`);
    console.log(`Erros: ${erros}`);
  } catch (error) {
    console.error("Erro durante a inserção dos professores:", error);
  }
}

// Executa a função de inserção
inserirProfessores()
  .then(() => {
    console.log("Processo de inserção finalizado.");
    // Esperar um momento para permitir que logs sejam impressos antes de encerrar
    setTimeout(() => process.exit(0), 1000);
  })
  .catch((err) => {
    console.error("Erro no processo principal:", err);
    process.exit(1);
  });
