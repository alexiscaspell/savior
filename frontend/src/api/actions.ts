import { api } from './client'
import type { Action } from '../types/models'

export const actionsApi = {
  list: () => api.get<Action[]>('/actions').then((r) => r.data),
  get: (id: number) => api.get<Action>(`/actions/${id}`).then((r) => r.data),
  create: (action: Action) => api.post<number>('/actions', action).then((r) => r.data),
  update: (id: number, action: Action) =>
    api.put<number>(`/actions/${id}`, action).then((r) => r.data),
  remove: (id: number) => api.delete(`/actions/${id}`).then((r) => r.data),
}
