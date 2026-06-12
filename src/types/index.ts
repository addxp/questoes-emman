// src/types/index.ts

export type Role = 'user' | 'admin'
export type Dificuldade = 'facil' | 'medio' | 'dificil'
export type Caderno = 'humanas' | 'exatas'
export type Categoria = 'humanas' | 'exatas' | 'natureza' | 'linguagens' | 'redacao'

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  role: Role
  created_at: string
}

export interface Area {
  id: number
  slug: string
  name: string
  icon: string | null
  color: string | null
  categoria: Categoria
}

export interface Vestibular {
  id: number
  slug: string
  name: string
  logo_url: string | null
  uf: string | null
}

export interface Alternativa {
  letra: 'A' | 'B' | 'C' | 'D' | 'E'
  texto: string
  correta: boolean
}

export interface Question {
  id: string
  vestibular_id: number
  area_id: number
  ano: number
  numero: number | null
  enunciado: string
  contexto: string | null
  imagem_url: string | null
  alternativas: Alternativa[]
  gabarito: 'A' | 'B' | 'C' | 'D' | 'E'
  explicacao: string | null
  dificuldade: Dificuldade
  tags: string[] | null
  ativo: boolean
  created_at: string
  // joins
  areas?: Area
  vestibulares?: Vestibular
}

export interface WeeklyExam {
  id: string
  titulo: string
  semana_inicio: string
  semana_fim: string
  descricao: string | null
  publicada: boolean
  created_at: string
  weekly_exam_questions?: WeeklyExamQuestion[]
}

export interface WeeklyExamQuestion {
  id: number
  exam_id: string
  question_id: string
  ordem: number
  caderno: Caderno
  questions?: Question
}

export interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  exam_id: string | null
  resposta: 'A' | 'B' | 'C' | 'D' | 'E' | null
  correta: boolean | null
  tempo_seg: number | null
  created_at: string
}

export interface UserStats {
  user_id: string
  total_respondidas: number
  total_corretas: number
  pct_acerto: number
  tempo_medio_seg: number
  questoes_unicas: number
}

// Filtros de questões
export interface QuestionFilters {
  vestibular?: string
  area?: string
  ano?: number
  dificuldade?: Dificuldade
  search?: string
  page?: number
  pageSize?: number
}