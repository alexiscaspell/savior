import { api } from './client'
import type { Rule } from '../types/models'

export const rulesApi = {
  list: () => api.get<Rule[]>('/rules').then((r) => r.data),
  get: (id: number) => api.get<Rule>(`/rules/${id}`).then((r) => r.data),
  create: (rule: Rule, inferIds = false) =>
    api.post<number>('/rules', rule, { params: { infer_ids: inferIds } }).then((r) => r.data),
  update: (id: number, rule: Rule, inferIds = false) =>
    api.put<number>(`/rules/${id}`, rule, { params: { infer_ids: inferIds } }).then((r) => r.data),
  remove: (id: number) => api.delete(`/rules/${id}`).then((r) => r.data),
  linkAction: (ruleId: number, actionId: number) =>
    api.post(`/rules/${ruleId}/actions/${actionId}`).then((r) => r.data),
  unlinkAction: (ruleId: number, actionId: number) =>
    api.delete(`/rules/${ruleId}/actions/${actionId}`).then((r) => r.data),
}
