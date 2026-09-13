import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Slide,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { labelsApi } from '../api/labels'
import { servicesApi } from '../api/services'
import type { Service, ServiceLabel } from '../types/models'
import { PageHeader, useToast } from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { usePrefs } from '../i18n/PrefsContext'
import { isTemplateService, templateIdsFromLabels } from '../utils/templates'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export default function LabelsPage() {
  const [items, setItems] = useState<ServiceLabel[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [label, setLabel] = useState('')
  const [serviceId, setServiceId] = useState<number | '' | 'none'>('none')
  const [toDelete, setToDelete] = useState<ServiceLabel | null>(null)
  const [editing, setEditing] = useState<ServiceLabel | null>(null)
  const [editTemplateId, setEditTemplateId] = useState<number | '' | 'none'>('none')
  const [savingEdit, setSavingEdit] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuConsumers, setMenuConsumers] = useState<Service[]>([])
  const { showError, showSuccess } = useToast()
  const { t } = usePrefs()
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const [labels, svcs] = await Promise.all([labelsApi.list(), servicesApi.list()])
      setItems(labels || [])
      setServices(svcs)
    } catch (e) {
      showError((e as Error).message)
    }
  }, [showError])

  useEffect(() => {
    load()
  }, [load])

  const consumersByLabel = useMemo(() => {
    const map = new Map<string, Service[]>()
    for (const svc of services) {
      for (const lbl of svc.labels || []) {
        const list = map.get(lbl) || []
        list.push(svc)
        map.set(lbl, list)
      }
    }
    return map
  }, [services])

  const templateServices = useMemo(() => {
    const ids = templateIdsFromLabels(items)
    const templates = services.filter((s) => isTemplateService(s, ids))
    return templates.length > 0 ? templates : services
  }, [services, items])

  const create = async () => {
    if (!label) return
    try {
      const payload: ServiceLabel = { label }
      if (serviceId !== 'none' && serviceId !== '') {
        payload.service = { id: serviceId as number }
      }
      await labelsApi.create(payload)
      showSuccess(t('labels.created'))
      setLabel('')
      setServiceId('none')
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  const openEdit = (item: ServiceLabel) => {
    setEditing(item)
    setEditTemplateId(item.service?.id != null ? item.service.id : 'none')
  }

  const saveEdit = async () => {
    if (!editing?.label) return
    setSavingEdit(true)
    try {
      const payload: ServiceLabel = { label: editing.label, service: null }
      if (editTemplateId !== 'none' && editTemplateId !== '') {
        const tpl = templateServices.find((s) => s.id === editTemplateId)
        payload.service = { id: editTemplateId as number, name: tpl?.name || '' }
      }
      await labelsApi.update(payload)
      showSuccess(t('labels.updated'))
      setEditing(null)
      await load()
    } catch (e) {
      showError((e as Error).message)
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete?.label) return
    try {
      await labelsApi.remove(toDelete.label, toDelete.service?.id)
      showSuccess(t('labels.deleted'))
      setToDelete(null)
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  const openConsumersMenu = (event: React.MouseEvent<HTMLElement>, labelName: string) => {
    setMenuConsumers(consumersByLabel.get(labelName) || [])
    setMenuAnchor(event.currentTarget)
  }

  const closeConsumersMenu = () => {
    setMenuAnchor(null)
    setMenuConsumers([])
  }

  return (
    <>
      <PageHeader title={t('labels.title')} subtitle={t('labels.subtitle')} />

      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <TextField
            label={t('labels.label')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            sx={{ minWidth: 180 }}
          />
          <FormControl sx={{ minWidth: 220 }} size="small">
            <InputLabel>{t('labels.templateService')}</InputLabel>
            <Select
              label={t('labels.templateService')}
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value as number | 'none')}
            >
              <MenuItem value="none">{t('labels.noTemplate')}</MenuItem>
              {templateServices.map((s) => (
                <MenuItem key={s.id} value={s.id!}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={create} disabled={!label}>
            {t('labels.create')}
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('labels.label')}</TableCell>
              <TableCell>{t('labels.templateService')}</TableCell>
              <TableCell>{t('labels.servicesUsing')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => {
              const consumers = consumersByLabel.get(item.label) || []
              const templateName =
                item.service?.id == null
                  ? t('labels.noTemplate')
                  : item.service?.name ||
                    services.find((s) => s.id === item.service?.id)?.name ||
                    '—'
              return (
                <TableRow key={`${item.label}-${item.service?.id ?? 'tag'}-${idx}`} hover>
                  <TableCell>{item.label}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{templateName}</Typography>
                    {item.service?.id != null && (
                      <Typography variant="caption" color="text.secondary">
                        {t('common.id')} {item.service.id}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2">
                        {t('labels.servicesCount', { count: consumers.length })}
                      </Typography>
                      <Tooltip title={t('labels.viewServices')}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={consumers.length === 0}
                            onClick={(e) => openConsumersMenu(e, item.label)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('labels.editTemplate')}>
                      <IconButton onClick={() => openEdit(item)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton color="error" onClick={() => setToDelete(item)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {t('labels.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        TransitionComponent={Transition}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('labels.editTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label={t('labels.label')} value={editing?.label || ''} fullWidth disabled />
            <FormControl fullWidth>
              <InputLabel>{t('labels.templateService')}</InputLabel>
              <Select
                label={t('labels.templateService')}
                value={editTemplateId}
                onChange={(e) => setEditTemplateId(e.target.value as number | 'none')}
              >
                <MenuItem value="none">{t('labels.noTemplate')}</MenuItem>
                {templateServices.map((s) => (
                  <MenuItem key={s.id} value={s.id!}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={saveEdit} disabled={savingEdit}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeConsumersMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {menuConsumers.map((svc) => (
          <MenuItem
            key={svc.id}
            onClick={() => {
              closeConsumersMenu()
              if (svc.id != null) navigate(`/services/${svc.id}`)
            }}
          >
            <ListItemText
              primary={svc.name}
              secondary={`${t('common.id')} ${svc.id}`}
            />
          </MenuItem>
        ))}
        {menuConsumers.length === 0 && (
          <MenuItem disabled>
            <ListItemText primary={t('labels.noServices')} />
          </MenuItem>
        )}
      </Menu>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('labels.deleteTitle')}
        message={t('labels.deleteMsg', {
          name: toDelete?.label || '',
          id: toDelete?.service?.id ?? t('labels.noTemplate'),
        })}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
