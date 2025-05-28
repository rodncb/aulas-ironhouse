const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Configuração do Supabase - ajuste as variáveis ambientais conforme necessário
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.REACT_APP_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "URLs ou chaves do Supabase não configuradas nas variáveis de ambiente!"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Script para verificar e corrigir valores ausentes na coluna 'hora' das aulas
 */
async function main() {
  try {
    console.log("Verificando aulas com campos de hora ausentes...");

    // 1. Verificar estatísticas
    const { data: stats, error: statsError } = await supabase
      .from("aulas")
      .select("id, status, hora")
      .is("hora", null);

    if (statsError) {
      console.error("Erro ao verificar aulas:", statsError);
      return;
    }

    console.log(`Total de aulas sem horário: ${stats.length}`);

    // Agrupar por status
    const porStatus = {};
    stats.forEach((aula) => {
      porStatus[aula.status] = (porStatus[aula.status] || 0) + 1;
    });

    console.log("Distribuição por status:");
    Object.entries(porStatus).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} aulas`);
    });

    // Perguntar se deseja atualizar os registros
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(
      "Deseja atualizar as aulas sem horário? (s/n): ",
      async (resposta) => {
        if (resposta.toLowerCase() === "s") {
          console.log("Atualizando aulas em andamento com hora atual...");

          // Para aulas em andamento, definir hora atual
          const agora = new Date();
          const horaAtual = `${String(agora.getHours()).padStart(
            2,
            "0"
          )}:${String(agora.getMinutes()).padStart(2, "0")}`;

          const { error: updateEmAndamentoError } = await supabase
            .from("aulas")
            .update({ hora: horaAtual })
            .is("hora", null)
            .eq("status", "em_andamento");

          if (updateEmAndamentoError) {
            console.error(
              "Erro ao atualizar aulas em andamento:",
              updateEmAndamentoError
            );
          } else {
            console.log(
              `Aulas em andamento atualizadas com horário ${horaAtual}`
            );
          }

          console.log("Atualizando aulas finalizadas com 23:59...");

          // Para aulas finalizadas, definir 23:59
          const { error: updateFinalizadasError } = await supabase
            .from("aulas")
            .update({ hora: "23:59" })
            .is("hora", null)
            .eq("status", "finalizada");

          if (updateFinalizadasError) {
            console.error(
              "Erro ao atualizar aulas finalizadas:",
              updateFinalizadasError
            );
          } else {
            console.log("Aulas finalizadas atualizadas com horário 23:59");
          }

          console.log("Verificando resultados após atualização...");
          const { data: checkAfter, error: checkError } = await supabase
            .from("aulas")
            .select("count(*)", { count: "exact" })
            .is("hora", null);

          if (checkError) {
            console.error("Erro ao verificar resultados:", checkError);
          } else {
            console.log(`Aulas restantes sem horário: ${checkAfter.count}`);

            if (checkAfter.count > 0) {
              console.log(
                "Algumas aulas ainda estão sem horário. Você pode verificar manualmente."
              );
            } else {
              console.log("Todas as aulas agora têm horários definidos!");
            }
          }
        } else {
          console.log("Operação cancelada. Nenhuma atualização foi feita.");
        }

        readline.close();
      }
    );
  } catch (error) {
    console.error("Erro no script:", error);
  }
}

main();
