import { api } from './client'
import type { ServiceLabel } from '../types/models'

export const labelsApi = {
  list: () => api.get<ServiceLabel[]>('/labels').then((r) => r.data),
  create: (label: ServiceLabel) => api.post('/labels', label).then((r) => r.data),
  // Prefer PUT; fall back to POST upsert if the backend image lacks PUT yet.
  update: async (label: ServiceLabel) => {
    try {
      return (await api.put('/labels', label)).data
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 405) {
        return (await api.post('/labels', label)).data
      }
      throw e
    }
  },
  remove: (label: string, serviceId?: number | null) => {
    if (serviceId != null) {
      return api
        .delete(`/labels/${serviceId}`, { params: label ? { label } : {} })
        .then((r) => r.data)
    }
    return api.delete('/labels', { params: { label } }).then((r) => r.data)
  },
}
