import type { Service, ServiceLabel } from '../types/models'

/** Marker stored in service.vars when created from Service Templates. */
export const TEMPLATE_VAR = '__template'

export function templateIdsFromLabels(labels: ServiceLabel[]): Set<number> {
  const ids = new Set<number>()
  for (const item of labels || []) {
    if (item.service?.id != null) ids.add(item.service.id)
  }
  return ids
}

export function isTemplateService(svc: Service, templateIds: Set<number> = new Set()): boolean {
  if (svc.vars?.[TEMPLATE_VAR] === true) return true
  if (svc.id != null && templateIds.has(svc.id)) return true
  return false
}

export function withTemplateMarker(vars: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...vars, [TEMPLATE_VAR]: true }
}

export function labelsForTemplate(svc: Service, associations: ServiceLabel[]): string[] {
  if (svc.id == null) return []
  return associations.filter((a) => a.service?.id === svc.id).map((a) => a.label)
}
