import { api } from './client'
import type { ServiceLabel } from '../types/models'

export const labelsApi = {
  list: () => api.get<ServiceLabel[]>('/labels').then((r) => r.data),
  create: (label: ServiceLabel) => api.post('/labels', label).then((r) => r.data),
  remove: (serviceId: number, label?: string) =>
    api.delete(`/labels/${serviceId}`, { params: label ? { label } : {} }).then((r) => r.data),
}
