import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
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
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useNavigate } from 'react-router-dom'
import { labelsApi } from '../api/labels'
import { servicesApi } from '../api/services'
import type { Service, ServiceLabel } from '../types/models'
import { PageHeader, useToast } from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { usePrefs } from '../i18n/PrefsContext'

export default function LabelsPage() {
  const [items, setItems] = useState<ServiceLabel[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [label, setLabel] = useState('')
  const [serviceId, setServiceId] = useState<number | ''>('')
  const [toDelete, setToDelete] = useState<ServiceLabel | null>(null)
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

  const create = async () => {
    if (!label || !serviceId) return
    try {
      await labelsApi.create({
        label,
        service: { id: serviceId as number },
      })
      showSuccess(t('labels.created'))
      setLabel('')
      setServiceId('')
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete?.service?.id) return
    try {
      await labelsApi.remove(toDelete.service.id, toDelete.label)
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
              onChange={(e) => setServiceId(e.target.value as number)}
            >
              {services.map((s) => (
                <MenuItem key={s.id} value={s.id!}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={create} disabled={!label || !serviceId}>
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
                item.service?.name ||
                services.find((s) => s.id === item.service?.id)?.name ||
                '—'
              return (
                <TableRow key={`${item.label}-${item.service?.id}-${idx}`} hover>
                  <TableCell>{item.label}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{templateName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('common.id')} {item.service?.id ?? '—'}
                    </Typography>
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
          id: toDelete?.service?.id || '',
        })}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
