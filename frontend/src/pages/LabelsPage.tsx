import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
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
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
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
  const { showError, showSuccess } = useToast()
  const { t } = usePrefs()

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
              <TableCell>{t('labels.serviceId')}</TableCell>
              <TableCell>{t('labels.service')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={`${item.label}-${item.service?.id}-${idx}`} hover>
                <TableCell>{item.label}</TableCell>
                <TableCell>{item.service?.id}</TableCell>
                <TableCell>{item.service?.name || '—'}</TableCell>
                <TableCell align="right">
                  <Tooltip title={t('common.delete')}>
                    <IconButton color="error" onClick={() => setToDelete(item)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
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
