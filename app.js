const express = require("express");
const app = express();

app.use(express.json());

// Estado em memória
const cursos = [];
const alunos = [];

let proximoCursoId = 1;
let proximoAlunoId = 1;

// Função para resetar estado (para testes)
function resetData() {
  cursos.length = 0;
  alunos.length = 0;
  proximoCursoId = 1;
  proximoAlunoId = 1;
}

// Validação para dados obrigatórios
function validarDadosCurso(nome, cargaHoraria) {
  if (!nome || !cargaHoraria || typeof cargaHoraria !== "number" || cargaHoraria <= 0) {
    return "Nome e cargaHoraria (número positivo) são obrigatórios.";
  }
  return null;
}

function validarDadosAluno(nome, email) {
  if (!nome || !email) {
    return "Nome e email são obrigatórios.";
  }
  return null;
}

// Rotas de cursos
app.get("/cursos", (req, res) => {
  res.json({ message: "Lista de cursos cadastrados.", cursos });
});

app.get("/cursos/:id", (req, res) => {
  const curso = cursos.find((c) => c.id === parseInt(req.params.id));
  if (!curso) return res.status(404).json({ message: "Curso não encontrado." });
  res.json(curso);
});

app.post("/cursos", (req, res) => {
  const { nome, cargaHoraria } = req.body;
  const erro = validarDadosCurso(nome, cargaHoraria);
  if (erro) return res.status(400).json({ message: erro });

  const duplicado = cursos.find((c) => c.nome.toLowerCase() === nome.toLowerCase());
  if (duplicado) return res.status(409).json({ message: "Já existe um curso com este nome." });

  const novoCurso = { id: proximoCursoId++, nome, cargaHoraria };
  cursos.push(novoCurso);
  res.status(201).json(novoCurso);
});

app.put("/cursos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const curso = cursos.find((c) => c.id === id);
  if (!curso) return res.status(404).json({ message: "Curso não encontrado." });

  const { nome, cargaHoraria } = req.body;
  const erro = validarDadosCurso(nome, cargaHoraria);
  if (erro) return res.status(400).json({ message: erro });

  curso.nome = nome;
  curso.cargaHoraria = cargaHoraria;
  res.json(curso);
});

app.delete("/cursos/:id", (req, res) => {
  const index = cursos.findIndex((c) => c.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Curso não encontrado." });
  cursos.splice(index, 1);
  res.json({ message: "Curso excluído com sucesso." });
});

// Rotas de alunos
app.get("/alunos", (req, res) => {
  // Mapear os alunos, substituindo o ID do curso pelos nomes dos cursos
  const alunosComCursos = alunos.map((aluno) => {
    const cursosMatriculados = aluno.cursos.map((cursoId) => {
      const curso = cursos.find((c) => c.id === cursoId);
      return curso ? curso.nome : "Curso não encontrado"; // Caso o curso não exista
    });

    // Se o aluno não tem cursos matriculados, apresentar a mensagem
    const mensagemCursos = cursosMatriculados.length === 0 ? "Aluno não matriculado em nenhum curso" : cursosMatriculados;

    return {
      ...aluno,
      cursos: mensagemCursos, // Substituímos o ID do curso pelos nomes ou mensagem de "não matriculado"
    };
  });

  res.json({ message: "Lista de alunos cadastrados.", alunos: alunosComCursos });
});

app.post("/alunos", (req, res) => {
  const { nome, email } = req.body;
  const erro = validarDadosAluno(nome, email);
  if (erro) return res.status(400).json({ message: erro });

  const alunoExistente = alunos.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (alunoExistente) return res.status(409).json({ message: "Já existe um aluno com este email." });

  const novoAluno = { id: proximoAlunoId++, nome, email, cursos: [] };
  alunos.push(novoAluno);
  res.status(201).json(novoAluno);
});

app.put("/alunos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const aluno = alunos.find((a) => a.id === id);
  if (!aluno) return res.status(404).json({ message: "Aluno não encontrado." });

  const { nome, email } = req.body;
  const erro = validarDadosAluno(nome, email);
  if (erro) return res.status(400).json({ message: erro });

  aluno.nome = nome;
  aluno.email = email;
  res.json(aluno);
});

app.delete("/alunos/:id", (req, res) => {
  const index = alunos.findIndex((a) => a.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Aluno não encontrado." });
  alunos.splice(index, 1);
  res.json({ message: "Aluno excluído com sucesso." });
});

// Matrícula de aluno
app.post("/alunos/:id/matricular", (req, res) => {
  const aluno = alunos.find((a) => a.id === parseInt(req.params.id));
  if (!aluno) return res.status(404).json({ message: "Aluno não encontrado." });

  const { cursoId } = req.body;
  const curso = cursos.find((c) => c.id === cursoId);
  if (!curso) return res.status(404).json({ message: "Curso não encontrado." });

  if (aluno.cursos.includes(cursoId)) {
    return res.status(400).json({ message: "Aluno já está matriculado neste curso." });
  }

  aluno.cursos.push(cursoId);
  res.json({ message: "Aluno matriculado com sucesso!", aluno });
});

// Remoção de matrícula de um curso por aluno
app.delete("/alunos/:id/remover-matricula", (req, res) => {
  const alunoId = parseInt(req.params.id);
  const { cursoId } = req.body;

  const aluno = alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ message: "Aluno não encontrado." });

  const curso = cursos.find((c) => c.id === cursoId);
  if (!curso) return res.status(404).json({ message: "Curso não encontrado." });

  const index = aluno.cursos.indexOf(cursoId);
  if (index === -1) {
    return res.status(400).json({ message: "Aluno não está matriculado neste curso." });
  }

  aluno.cursos.splice(index, 1);
  res.json({ message: "Matrícula removida com sucesso.", aluno });
});


module.exports = { app, resetData };
