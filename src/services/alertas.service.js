import alunosService from "./alunos.service";
import aulasService from "./aulas.service";

const alertasService = {
  // Função para obter alertas de um aluno
  async getAlertasAluno(alunoId) {
    try {
      const alertas = [];

      // Buscar informações do aluno usando getAll e filtrando
      const alunos = await alunosService.getAll();
      const aluno = alunos.find((a) => a.id === alunoId);

      if (!aluno) {
        console.warn(`Aluno não encontrado com ID: ${alunoId}`);
        return [];
      }

      // Verificar o tipo de plano do aluno
      const plano = aluno.plano || "8 Check-in"; // Padrão se não definido

      // Determinar limite de check-ins com base no plano
      let limiteCheckIns = 0;
      switch (plano) {
        case "8 Check-in":
          limiteCheckIns = 8;
          break;
        case "12 Check-in":
          limiteCheckIns = 12;
          break;
        case "16 Check-in":
          limiteCheckIns = 16;
          break;
        case "Premium":
          limiteCheckIns = 9999; // Ilimitado para plano Premium
          break;
        default:
          limiteCheckIns = 8; // Padrão
      }

      // Contar quantos check-ins o aluno já utilizou
      // Usamos apenas aulas realizadas (não canceladas)
      const checkInsRealizados =
        aluno.historicoAulas?.filter((aula) => aula.status === "realizada")
          .length || 0;

      // Verificar se o aluno está no último check-in do plano
      if (checkInsRealizados === limiteCheckIns - 1 && plano !== "Premium") {
        alertas.push({
          tipo: "ultimo_checkin",
          mensagem: `O aluno ${aluno.nome} está utilizando seu último check-in do plano ${plano}.`,
          severidade: "aviso",
        });
      }

      // Verificar se o aluno excedeu o limite de check-ins do plano
      if (checkInsRealizados >= limiteCheckIns && plano !== "Premium") {
        alertas.push({
          tipo: "plano_excedido",
          mensagem: `O aluno ${aluno.nome} já utilizou todos os check-ins do plano ${plano}.`,
          severidade: "alto",
        });
      }

      // Buscar aulas mais recentes do aluno
      const historicoAulas = aluno.historicoAulas || [];
      const aulasRealizadas = historicoAulas.filter(
        (aula) => aula.status === "realizada"
      );
      const aulasOrdenadas = [...aulasRealizadas].sort((a, b) => {
        // Converter string de data para objeto Date para comparação
        const dataA = new Date(a.data.split("/").reverse().join("-"));
        const dataB = new Date(b.data.split("/").reverse().join("-"));
        return dataB - dataA; // Ordem decrescente
      });

      // Verificar frequência dos últimos 7 dias
      const agora = new Date();
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(agora.getDate() - 7);

      const aulasUltimosSeteDias = aulasOrdenadas.filter((aula) => {
        const dataAula = new Date(aula.data.split("/").reverse().join("-"));
        return dataAula >= seteDiasAtras && dataAula <= agora;
      });

      if (aulasUltimosSeteDias.length >= 3) {
        alertas.push({
          tipo: "frequencia_alta",
          mensagem: `O aluno ${aluno.nome} realizou ${aulasUltimosSeteDias.length} treinos nos últimos 7 dias.`,
          severidade: "aviso",
        });
      }

      // Verificar inatividade
      if (aulasOrdenadas.length > 0) {
        const ultimaAula = aulasOrdenadas[0]; // A aula mais recente
        const dataUltimaAula = new Date(
          ultimaAula.data.split("/").reverse().join("-")
        );

        // Calcular dias desde a última aula
        const diferencaDias = Math.floor(
          (agora - dataUltimaAula) / (1000 * 60 * 60 * 24)
        );

        // Se passaram 7 dias ou mais
        if (diferencaDias >= 7) {
          alertas.push({
            tipo: "inatividade",
            mensagem: `O aluno ${aluno.nome} está há ${diferencaDias} dias sem treinar.`,
            severidade: diferencaDias >= 14 ? "alto" : "medio",
          });
        }
      }

      return alertas;
    } catch (error) {
      console.error(
        `Erro ao verificar alertas para o aluno ${alunoId}:`,
        error
      );
      return [];
    }
  },

  // Função para obter todos os alertas ativos do sistema
  async getAllAlertas() {
    try {
      // Buscar todos os alunos
      const alunos = await alunosService.getAll();

      // Array para armazenar todos os alertas
      let todosAlertas = [];

      // Verificar alertas para cada aluno
      for (const aluno of alunos) {
        const alertasAluno = await this.getAlertasAluno(aluno.id);

        // Adicionar o aluno em cada alerta para identificação
        const alertasFormatados = alertasAluno.map((alerta) => ({
          ...alerta,
          alunoId: aluno.id,
          alunoNome: aluno.nome,
        }));

        todosAlertas = [...todosAlertas, ...alertasFormatados];
      }

      return todosAlertas;
    } catch (error) {
      console.error("Erro ao buscar todos os alertas:", error);
      return [];
    }
  },
};

export default alertasService;
