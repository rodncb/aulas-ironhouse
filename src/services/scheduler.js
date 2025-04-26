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
      console.log("Agendamento já está em execução");
      return;
    }

    console.log("Iniciando agendamento para finalização automática de aulas");
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
      console.log("Executando finalização automática de aulas às 23:59h");
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
        console.log(
          `Finalização automática concluída. ${resultado.count} aulas finalizadas.`
        );
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
      console.log("Agendamento de finalização automática parado");
    }
  }
}

// Criar instância única
const aulaScheduler = new AulaScheduler();

export default aulaScheduler;
