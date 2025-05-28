import aulasService from "./aulas.service";

/**
 * Scheduler para finalização automática de aulas
 */
class AulaScheduler {
  constructor() {
    this.timer = null;
    this.isRunning = false;
  }

  /**
   * Inicia o agendamento para finalizar aulas em andamento
   */
  iniciarAgendamento() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Configurar a verificação para rodar a cada minuto
    this.timer = setInterval(() => {
      this.verificarHorarioFinalizacao();
    }, 60000); // 60000ms = 1 minuto

    // Executar uma primeira verificação imediatamente
    this.verificarHorarioFinalizacao();
  }

  /**
   * Verifica se é horário de finalizar aulas (23:59h) e executa a finalização
   */
  verificarHorarioFinalizacao() {
    const agora = new Date();
    const horas = agora.getHours();
    const minutos = agora.getMinutes();

    // Se for 23:59h, finaliza todas as aulas em andamento
    if (horas === 23 && minutos === 59) {
      this.finalizarAulasEmAndamento();
    }
  }

  /**
   * Finaliza todas as aulas em andamento
   */
  async finalizarAulasEmAndamento() {
    try {
      const resultado = await aulasService.finalizarAulasEmAndamento();
      if (resultado.success) {
      } else {
        console.error("Erro na finalização automática:", resultado.error);
      }
    } catch (error) {
      console.error("Erro ao executar finalização automática:", error);
    }
  }

  /**
   * Para o agendamento
   */
  pararAgendamento() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.isRunning = false;
    }
  }
}

// Criar instância única (mantida internamente)
const aulaScheduler = new AulaScheduler();

/**
 * Função para iniciar o scheduler e retornar a função de parada.
 * Garante que o scheduler seja iniciado apenas uma vez.
 */
const startAutoEndScheduler = () => {
  if (!aulaScheduler.isRunning) {
    aulaScheduler.iniciarAgendamento();
  }
  // Retorna a função de parada vinculada à instância correta
  return aulaScheduler.pararAgendamento.bind(aulaScheduler);
};

// Exportar a função de inicialização como padrão
export default startAutoEndScheduler;
