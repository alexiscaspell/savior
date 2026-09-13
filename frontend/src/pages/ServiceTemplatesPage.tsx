import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useNavigate } from 'react-router-dom'
import { servicesApi } from '../api/services'
import { labelsApi } from '../api/labels'
import type { Service, ServiceLabel } from '../types/models'
import { PageHeader, useToast } from '../components/PageHeader'
import ServiceFormDialog from '../components/ServiceFormDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import { usePrefs } from '../i18n/PrefsContext'
import {
  isTemplateService,
  labelsForTemplate,
  templateIdsFromLabels,
  withTemplateMarker,
} from '../utils/templates'

export default function ServiceTemplatesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [associations, setAssociations] = useState<ServiceLabel[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [toDelete, setToDelete] = useState<Service | null>(null)
  const { showError, showSuccess } = useToast()
  const navigate = useNavigate()
  const { t } = usePrefs()

  const load = useCallback(async () => {
    try {
      const [svcs, labels] = await Promise.all([servicesApi.list(), labelsApi.list()])
      setServices(svcs)
      setAssociations(labels || [])
    } catch (e) {
      showError((e as Error).message)
    }
  }, [showError])

  useEffect(() => {
    load()
  }, [load])

  const templateIds = useMemo(() => templateIdsFromLabels(associations), [associations])

  const items = useMemo(
    () => services.filter((s) => isTemplateService(s, templateIds)),
    [services, templateIds],
  )

  const consumersByLabel = useMemo(() => {
    const map = new Map<string, number>()
    for (const svc of services) {
      if (isTemplateService(svc, templateIds)) continue
      for (const lbl of svc.labels || []) {
        map.set(lbl, (map.get(lbl) || 0) + 1)
      }
    }
    return map
  }, [services, templateIds])

  const save = async (svc: Service) => {
    const payload: Service = {
      ...svc,
      labels: [],
      vars: withTemplateMarker(svc.vars || {}),
    }
    try {
      if (payload.id) {
        await servicesApi.update(payload.id, payload)
        showSuccess(t('templates.updated'))
      } else {
        await servicesApi.create(payload)
        showSuccess(t('templates.created'))
      }
      await load()
    } catch (e) {
      showError((e as Error).message)
      throw e
    }
  }

  const confirmDelete = async () => {
    if (!toDelete?.id) return
    try {
      await servicesApi.remove(toDelete.id)
      showSuccess(t('templates.deleted'))
      setToDelete(null)
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        title={t('templates.title')}
        subtitle={t('templates.subtitle')}
        onCreate={() => {
          setEditing(null)
          setDialogOpen(true)
        }}
        createLabel={t('templates.new')}
      />
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.id')}</TableCell>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>{t('nav.rules')}</TableCell>
              <TableCell>{t('nav.sources')}</TableCell>
              <TableCell>{t('nav.labels')}</TableCell>
              <TableCell>{t('templates.consumers')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((s) => {
              const linkedLabels = labelsForTemplate(s, associations)
              const consumerCount = linkedLabels.reduce(
                (sum, lbl) => sum + (consumersByLabel.get(lbl) || 0),
                0,
              )
              return (
                <TableRow key={s.id} hover sx={{ transition: 'background-color 0.2s' }}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.rules?.length || 0}</TableCell>
                  <TableCell>{s.sources?.length || 0}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {linkedLabels.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">
                          {t('templates.noLabels')}
                        </Typography>
                      ) : (
                        linkedLabels.map((l) => (
                          <Chip key={l} label={l} size="small" color="primary" variant="outlined" />
                        ))
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{consumerCount}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.view')}>
                      <IconButton
                        onClick={() => {
                          setEditing(s)
                          setDialogOpen(true)
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                      <IconButton onClick={() => navigate(`/services/${s.id}`)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton color="error" onClick={() => setToDelete(s)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {t('templates.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ServiceFormDialog
        open={dialogOpen}
        initial={editing}
        mode="template"
        onClose={() => setDialogOpen(false)}
        onSave={save}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('templates.deleteTitle')}
        message={t('templates.deleteMsg', { name: toDelete?.name || '' })}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
