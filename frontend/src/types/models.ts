export type SourceType = 'http_request' | 'http_log' | 'ssh_log' | 'custom'
export type ActionType = 'suggest' | 'http_action' | 'set_variable' | 'ssh' | 'custom'

export interface Source {
  id?: number | null
  name?: string | null
  type: SourceType
  input: Record<string, unknown>
  variable: string
  output?: string | null
}

export interface SourceRule {
  variables?: string[]
  names?: string[]
  renames?: Record<string, string>
}

export interface Action {
  id?: number | null
  name?: string | null
  type: ActionType
  result: string
  input?: Record<string, unknown> | null
}

export interface Rule {
  id?: number | null
  name: string
  expression: string
  source: SourceRule
  actions: Action[]
  preconditions?: string[]
}

export interface Service {
  id?: number | null
  name: string
  rules: Rule[]
  sources: Source[]
  vars: Record<string, unknown>
  labels: string[]
}

export interface ServiceLabel {
  label: string
  /** Optional template service for rule/var inheritance. */
  service?: { id?: number | null; name?: string } | null
}

export interface Pray {
  service_id?: number | null
  service_name?: string | null
  source?: string | null
  fast?: boolean
  dry_run?: boolean
  params?: Record<string, unknown>
}

export interface Consequence {
  action: string
  result: unknown
}

export interface ResultRule {
  name: string
  consequences: Consequence[]
}

export interface PrayResponse {
  service: string
  rules: ResultRule[]
}
