import { useCallback, useEffect, useState } from 'react'
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
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useNavigate } from 'react-router-dom'
import { servicesApi } from '../api/services'
import type { Service } from '../types/models'
import { PageHeader, useToast } from '../components/PageHeader'
import ServiceFormDialog from '../components/ServiceFormDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import { usePrefs } from '../i18n/PrefsContext'

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [toDelete, setToDelete] = useState<Service | null>(null)
  const { showError, showSuccess } = useToast()
  const navigate = useNavigate()
  const { t } = usePrefs()

  const load = useCallback(async () => {
    try {
      setItems(await servicesApi.list())
    } catch (e) {
      showError((e as Error).message)
    }
  }, [showError])

  useEffect(() => {
    load()
  }, [load])

  const save = async (svc: Service) => {
    try {
      if (svc.id) {
        await servicesApi.update(svc.id, svc)
        showSuccess(t('services.updated'))
      } else {
        await servicesApi.create(svc)
        showSuccess(t('services.created'))
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
      showSuccess(t('services.deleted'))
      setToDelete(null)
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        title={t('services.title')}
        subtitle={t('services.subtitle')}
        onCreate={() => {
          setEditing(null)
          setDialogOpen(true)
        }}
        createLabel={t('services.new')}
      />
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.id')}</TableCell>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>{t('nav.sources')}</TableCell>
              <TableCell>{t('nav.rules')}</TableCell>
              <TableCell>{t('nav.labels')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id} hover sx={{ transition: 'background-color 0.2s' }}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.sources?.length || 0}</TableCell>
                <TableCell>{s.rules?.length || 0}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {(s.labels || []).map((l) => (
                      <Chip key={l} label={l} size="small" color="primary" variant="outlined" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={t('common.view')}>
                    <IconButton onClick={() => navigate(`/services/${s.id}`)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.edit')}>
                    <IconButton
                      onClick={() => {
                        setEditing(s)
                        setDialogOpen(true)
                      }}
                    >
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
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {t('services.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ServiceFormDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onSave={save}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('services.deleteTitle')}
        message={t('services.deleteMsg', { name: toDelete?.name || '' })}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
