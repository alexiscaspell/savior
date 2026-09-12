import { api } from './client'
import type { Pray, PrayResponse } from '../types/models'

export const prayApi = {
  pray: (pray: Pray) => api.post<PrayResponse>('/savior/pray', pray).then((r) => r.data),
}
