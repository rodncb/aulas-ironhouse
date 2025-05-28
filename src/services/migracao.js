import { supabase } from "./supabase";

const migracaoService = {
  async migrarTodosDados() {
    // Log inicial mantido para indicar o início do processo

    try {
      // Executar todas as migrações em sequência
      await this.migrarProfessores();
      await this.migrarAlunos();
      await this.migrarExercicios();
      await this.migrarAulas();

      return { success: true };
    } catch (error) {
      console.error("Erro ao migrar dados para o Supabase:", error);
      return { success: false, error: error.message };
    }
  },

  async migrarProfessores() {
    try {
      // Obter professores do localStorage
      const professoresSalvos = localStorage.getItem("todosProfessores");
      if (!professoresSalvos) {
        return { success: true, count: 0 };
      }

      const professores = JSON.parse(professoresSalvos);
      let contMigrados = 0;

      // Verificar professores existentes no Supabase
      const { data: professoresExistentes } = await supabase
        .from("professores")
        .select("nome");

      const nomesExistentes = new Set(
        (professoresExistentes || []).map((p) => p.nome.toLowerCase())
      );

      // Inserir cada professor no Supabase
      for (const professor of professores) {
        // Pular se já existir
        if (nomesExistentes.has(professor.nome.toLowerCase())) {
          continue;
        }

        const { error } = await supabase.from("professores").insert({
          nome: professor.nome,
          idade: professor.idade,
          especialidade: professor.especialidade || "",
          experiencia: professor.experiencia || "",
          formacao: professor.formacao || "",
          created_at: new Date().toISOString(),
        });

        if (!error) {
          contMigrados++;
        } else {
          console.warn(`Erro ao migrar professor ${professor.nome}:`, error);
        }
      }

      return { success: true, count: contMigrados };
    } catch (error) {
      console.error("Erro ao migrar professores:", error);
      return { success: false, error: error.message };
    }
  },

  async migrarAlunos() {
    try {
      // Obter alunos do localStorage
      const alunosSalvos = localStorage.getItem("alunos");
      if (!alunosSalvos) {
        return { success: true, count: 0 };
      }

      const alunos = JSON.parse(alunosSalvos);
      let contMigrados = 0;

      // Verificar alunos existentes no Supabase
      const { data: alunosExistentes } = await supabase
        .from("alunos")
        .select("nome");

      const nomesExistentes = new Set(
        (alunosExistentes || []).map((a) => a.nome.toLowerCase())
      );

      // Inserir cada aluno no Supabase
      for (const aluno of alunos) {
        // Pular se já existir
        if (nomesExistentes.has(aluno.nome.toLowerCase())) {
          continue;
        }

        const { error } = await supabase.from("alunos").insert({
          nome: aluno.nome,
          idade: aluno.idade,
          lesao: aluno.lesao || "Não",
          tipo_lesao: aluno.tipoLesao || "",
          objetivo: aluno.objetivo || "",
          created_at: new Date().toISOString(),
        });

        if (!error) {
          contMigrados++;
        } else {
          console.warn(`Erro ao migrar aluno ${aluno.nome}:`, error);
        }
      }

      return { success: true, count: contMigrados };
    } catch (error) {
      console.error("Erro ao migrar alunos:", error);
      return { success: false, error: error.message };
    }
  },

  async migrarExercicios() {
    try {
      // Obter exercícios do localStorage
      const exerciciosSalvos = localStorage.getItem("exercicios");
      if (!exerciciosSalvos) {
        return { success: true, count: 0 };
      }

      const exercicios = JSON.parse(exerciciosSalvos);
      let contMigrados = 0;

      // Verificar exercícios existentes no Supabase
      const { data: exerciciosExistentes } = await supabase
        .from("exercicios")
        .select("nome");

      const nomesExistentes = new Set(
        (exerciciosExistentes || []).map((e) => e.nome.toLowerCase())
      );

      // Inserir cada exercício no Supabase
      for (const exercicio of exercicios) {
        // Pular se já existir
        if (nomesExistentes.has(exercicio.nome.toLowerCase())) {
          continue;
        }

        const { error } = await supabase.from("exercicios").insert({
          nome: exercicio.nome,
          musculatura: exercicio.musculatura || "",
          created_at: new Date().toISOString(),
        });

        if (!error) {
          contMigrados++;
        } else {
          console.warn(`Erro ao migrar exercício ${exercicio.nome}:`, error);
        }
      }

      return { success: true, count: contMigrados };
    } catch (error) {
      console.error("Erro ao migrar exercícios:", error);
      return { success: false, error: error.message };
    }
  },

  async migrarAulas() {
    try {
      // Obter aulas do localStorage
      const aulasSalvas = localStorage.getItem("historicoAulas");
      if (!aulasSalvas) {
        return { success: true, count: 0 };
      }

      // Obter mapeamento de professores e alunos
      const { data: professores } = await supabase
        .from("professores")
        .select("id, nome");
      const { data: alunos } = await supabase.from("alunos").select("id, nome");

      // Criar mapas de nome para ID
      const mapaProfessores = {};
      const mapaAlunos = {};

      if (professores) {
        professores.forEach((p) => {
          mapaProfessores[p.nome.toLowerCase()] = p.id;
        });
      }

      if (alunos) {
        alunos.forEach((a) => {
          mapaAlunos[a.nome.toLowerCase()] = a.id;
        });
      }

      const aulas = JSON.parse(aulasSalvas);
      let contMigrados = 0;

      for (const aula of aulas) {
        try {
          // Calcular professor_id
          let professorId = null;
          if (aula.professor) {
            if (aula.professor.id) {
              professorId = aula.professor.id;
            } else if (aula.professor.nome) {
              professorId = mapaProfessores[aula.professor.nome.toLowerCase()];
            }
          }

          // Formatar data se necessário
          let dataFormatada = aula.data;
          if (dataFormatada && !dataFormatada.includes("-")) {
            const partes = dataFormatada.split("/");
            if (partes.length === 3) {
              dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
            }
          }

          // Inserir a aula no Supabase
          const { data: novaAula, error } = await supabase
            .from("aulas")
            .insert({
              data: dataFormatada,
              status: aula.status || "realizada",
              anotacoes: aula.anotacoes || "",
              lesoes: aula.lesoes || "",
              professor_id: professorId,
              total_alunos: aula.alunos?.length || 0,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            console.warn(`Erro ao inserir aula (data: ${aula.data}):`, error);
            continue;
          }

          // Adicionar relações aula-alunos
          if (novaAula && aula.alunos && aula.alunos.length > 0) {
            for (const aluno of aula.alunos) {
              let alunoId = aluno.id;

              // Se não tiver id, tentar buscar pelo nome
              if (!alunoId && aluno.nome) {
                alunoId = mapaAlunos[aluno.nome.toLowerCase()];
              }

              if (alunoId) {
                await supabase.from("aula_alunos").insert({
                  aula_id: novaAula.id,
                  aluno_id: alunoId,
                  created_at: new Date().toISOString(),
                });
              }
            }
          }

          contMigrados++;
        } catch (error) {
          console.error(`Erro ao processar aula:`, error);
        }
      }

      return { success: true, count: contMigrados };
    } catch (error) {
      console.error("Erro ao migrar aulas:", error);
      return { success: false, error: error.message };
    }
  },
};

export default migracaoService;
