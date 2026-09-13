import { api } from './client'
import type { ServiceLabel } from '../types/models'

export const labelsApi = {
  list: () => api.get<ServiceLabel[]>('/labels').then((r) => r.data),
  create: (label: ServiceLabel) => api.post('/labels', label).then((r) => r.data),
  update: (label: ServiceLabel) => api.put('/labels', label).then((r) => r.data),
  remove: (label: string, serviceId?: number | null) => {
    if (serviceId != null) {
      return api
        .delete(`/labels/${serviceId}`, { params: label ? { label } : {} })
        .then((r) => r.data)
    }
    return api.delete('/labels', { params: { label } }).then((r) => r.data)
  },
}
