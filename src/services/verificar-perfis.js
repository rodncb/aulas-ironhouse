import { supabase } from "./supabase";

/**
 * Script para verificar e corrigir os perfis de usuários
 * Este script verifica se todos os usuários autenticados têm seus
 * perfis corretamente configurados na tabela 'profiles'
 */

// Lista de usuários para verificar - adicione todos aqui
const usuarios = [
  {
    email: "marcovfernandes89@gmail.com",
    role: "admin",
    uid: "930b8d22-a623-48d1-a6bf-13cd8ca8e9d7",
    nome: "Marco",
  },
  {
    email: "fabioaugustogp@gmai.com",
    role: "admin",
    uid: "7318009d-8a2a-4ec8-a8fb-34d7bd74f6ba",
    nome: "Fabio Augusto",
  },
  {
    email: "fernandesrafa97@gmail.com",
    role: "admin",
    uid: "414cb5a8-1422-4bf8-bc5e-7b25f4228495",
    nome: "Rafael Fernandes",
  },
  {
    email: "alexmolina.11@hotmail.com",
    role: "professor",
    uid: "27a803e6-7ded-4a40-9829-9aadb3ee41ae",
    nome: "Alex Molina",
  },
  {
    email: "felipe2021eg@gmail.com",
    role: "professor",
    uid: "9c51be79-6418-40d5-91d0-18c49b8c9dce",
    nome: "Felipe Barbosa",
  },
  {
    email: "pedropsr@icloud.com",
    role: "professor",
    uid: "3211f123-8a12-4195-b6c7-53a4cb3d0aae",
    nome: "Pedro Pacheco",
  },
  {
    email: "alefmts22@gmail.com",
    role: "professor",
    uid: "cf060174-6f8f-49a6-acc4-fed7f28001af",
    nome: "Alef Guimarães",
  },
  {
    email: "gavriel.albu13@gmail.com",
    role: "professor",
    uid: "ada1bd83-c338-489e-923f-cc61a6d95cab",
    nome: "Gabriel Medeiros",
  },
  {
    email: "nal-dinho07@hotmail.com",
    role: "professor",
    uid: "3248a93e-7880-45dc-b5f5-c3f47a5ee3c6",
    nome: "Reinaldo Oliveira",
  },
  {
    email: "lipifp17@hotmail.com",
    role: "professor",
    uid: "d87b563c-7a05-4785-9687-727d3b57197d",
    nome: "Filipe Florenzano",
  },
  {
    email: "patrick.salgado1@gmail.com",
    role: "professor",
    uid: "39dd99bf-461a-48df-a2fc-51097b6190e8",
    nome: "Patrick Salgado",
  },
  {
    email: "hcmoura11@gmail.com",
    role: "professor",
    uid: "7625bd7f-bafb-49a5-aade-2749caf27b64",
    nome: "Hellen Almeida",
  },
  {
    email: "alexia2811@icloud.com",
    role: "professor",
    uid: "2ee23275-0625-48f4-b043-c7ba81f2ec85",
    nome: "Alexia Carvalho",
  },
  {
    email: "flavinha.fray1995@gmail.com",
    role: "professor",
    uid: "831cf87f-3ca4-4bd6-94e6-575c576ec728",
    nome: "Flávia J",
  },
];

/**
 * Verifica e atualiza o perfil de um usuário
 * @param {Object} usuario - Informações do usuário
 * @returns {Promise<Object>} - Resultado da operação
 */
async function verificarEAtualizarPerfil(usuario) {

  try {
    // Verificar se o perfil existe
    const { data: perfil, error: erroConsulta } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", usuario.uid)
      .single();

    if (erroConsulta && erroConsulta.code !== "PGRST116") {
      console.error(
        `Erro ao consultar perfil para ${usuario.email}:`,
        erroConsulta
      );
      return {
        sucesso: false,
        mensagem: `Erro ao consultar: ${erroConsulta.message}`,
      };
    }

    // Se o perfil não existe, criar um novo
    if (!perfil) {
        `Perfil não encontrado para ${usuario.email}. Criando novo...`
      );

      const { data: novoPerfil, error: erroCriacao } = await supabase
        .from("profiles")
        .insert([
          {
            id: usuario.uid,
            email: usuario.email,
            role: usuario.role,
            nome: usuario.nome,
            username: usuario.email.split("@")[0],
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (erroCriacao) {
        console.error(
          `Erro ao criar perfil para ${usuario.email}:`,
          erroCriacao
        );
        return {
          sucesso: false,
          mensagem: `Erro ao criar: ${erroCriacao.message}`,
        };
      }

      return { sucesso: true, mensagem: "Perfil criado", perfil: novoPerfil };
    }

    // Se existe, verificar se precisa atualizar
    if (
      perfil.role !== usuario.role ||
      perfil.email !== usuario.email ||
      perfil.nome !== usuario.nome
    ) {

      const { data: perfilAtualizado, error: erroAtualizacao } = await supabase
        .from("profiles")
        .update({
          email: usuario.email,
          role: usuario.role,
          nome: usuario.nome,
          updated_at: new Date().toISOString(),
        })
        .eq("id", usuario.uid)
        .select()
        .single();

      if (erroAtualizacao) {
        console.error(
          `Erro ao atualizar perfil para ${usuario.email}:`,
          erroAtualizacao
        );
        return {
          sucesso: false,
          mensagem: `Erro ao atualizar: ${erroAtualizacao.message}`,
        };
      }

      return {
        sucesso: true,
        mensagem: "Perfil atualizado",
        perfil: perfilAtualizado,
      };
    }

    return { sucesso: true, mensagem: "Perfil já está correto", perfil };
  } catch (erro) {
    console.error(`Erro inesperado para ${usuario.email}:`, erro);
    return { sucesso: false, mensagem: `Erro inesperado: ${erro.message}` };
  }
}

/**
 * Verifica todos os usuários da lista
 */
async function verificarTodosUsuarios() {

  for (const usuario of usuarios) {
    const resultado = await verificarEAtualizarPerfil(usuario);
  }

}

// Execute a função apenas se este arquivo for executado diretamente
if (typeof window !== "undefined" && window.document) {
  window.verificarPerfis = verificarTodosUsuarios;
} else if (require.main === module) {
  verificarTodosUsuarios()
    .then(() => {
      process.exit(0);
    })
    .catch((erro) => {
      console.error("Erro ao executar script:", erro);
      process.exit(1);
    });
} else {
}

export { verificarTodosUsuarios, verificarEAtualizarPerfil };
