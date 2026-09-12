import { api } from './client'
import type { Service } from '../types/models'

export const servicesApi = {
  list: (name?: string) =>
    api.get<Service[]>('/services', { params: name ? { name } : {} }).then((r) => r.data),
  get: (id: number) => api.get<Service>(`/services/${id}`).then((r) => r.data),
  create: (svc: Service, inferIds = false) =>
    api.post<number>('/services', svc, { params: { infer_ids: inferIds } }).then((r) => r.data),
  update: (id: number, svc: Service, inferIds = false) =>
    api.put<number>(`/services/${id}`, svc, { params: { infer_ids: inferIds } }).then((r) => r.data),
  remove: (id: number) => api.delete(`/services/${id}`).then((r) => r.data),
  linkSource: (serviceId: number, sourceId: number) =>
    api.post(`/services/${serviceId}/sources/${sourceId}`).then((r) => r.data),
  unlinkSource: (serviceId: number, sourceId: number) =>
    api.delete(`/services/${serviceId}/sources/${sourceId}`).then((r) => r.data),
  linkRule: (serviceId: number, ruleId: number) =>
    api.post(`/services/${serviceId}/rules/${ruleId}`).then((r) => r.data),
  unlinkRule: (serviceId: number, ruleId: number) =>
    api.delete(`/services/${serviceId}/rules/${ruleId}`).then((r) => r.data),
}
