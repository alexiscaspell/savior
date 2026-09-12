import { api } from './client'
import type { Source } from '../types/models'

export const sourcesApi = {
  list: (name?: string) =>
    api.get<Source[]>('/sources', { params: name ? { name } : {} }).then((r) => r.data),
  get: (id: number) => api.get<Source>(`/sources/${id}`).then((r) => r.data),
  create: (source: Source) => api.post<number>('/sources', source).then((r) => r.data),
  update: (id: number, source: Source) =>
    api.put<number>(`/sources/${id}`, source).then((r) => r.data),
  remove: (id: number) => api.delete(`/sources/${id}`).then((r) => r.data),
  eval: (id: number, params: Record<string, unknown> = {}) =>
    api.post(`/sources/${id}/eval`, params).then((r) => r.data),
}
