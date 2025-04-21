import React, { useState } from "react";
import "../styles/Cadastros.css";
import {
  criarProfessorCorreto,
  verificarProfessor,
} from "../services/resetProfessor";

export default function Configuracoes() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetProfessor = async () => {
    try {
      setIsLoading(true);
      setMessage("Verificando se o professor já existe...");

      // Primeiro verificar se o professor já existe
      const verificacao = await verificarProfessor();

      if (verificacao.success) {
        setMessage(
          "O usuário professor já existe! Você pode fazer login com prof@ironhouse.com e a senha padrão."
        );
        return;
      }

      // Se não existir, criar um novo
      setMessage("Criando novo usuário professor...");
      const resultado = await criarProfessorCorreto();

      if (resultado.success) {
        setMessage(
          `Usuário professor criado com sucesso!\n` +
            `Email: ${resultado.data.email}\n` +
            `Senha: ${resultado.data.senha}\n` +
            `IMPORTANTE: Faça login com estas credenciais e altere a senha após o primeiro acesso.`
        );
      } else {
        setMessage(`Erro ao criar usuário: ${resultado.error}`);
      }
    } catch (error) {
      setMessage(`Erro inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-cadastro">
      <h2>Configurações de Usuários</h2>

      {message && (
        <div className={isLoading ? "message loading" : "message"}>
          {message.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      <div className="actions">
        <button
          onClick={handleResetProfessor}
          className="btn-resetar"
          disabled={isLoading}
        >
          {isLoading ? "Processando..." : "Resetar Usuário Professor"}
        </button>
      </div>

      <h3>Gerenciamento de Usuários</h3>
      <p className="info-text">
        Os usuários agora são gerenciados diretamente através do Supabase:
      </p>
      <ol className="info-list">
        <li>Acesse o dashboard do Supabase do projeto</li>
        <li>Navegue até a seção "Authentication" para criar novos usuários</li>
        <li>
          Após criar um usuário, configure seu perfil na tabela "profiles"
        </li>
        <li>
          Configure a função (role) como "admin" ou "professor" conforme
          necessário
        </li>
      </ol>

      <p className="info-text">
        <strong>Nota:</strong> Usuários criados no antigo sistema local não
        funcionarão com o novo sistema de autenticação.
      </p>
    </div>
  );
}
