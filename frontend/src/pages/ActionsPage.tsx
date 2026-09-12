import { useCallback, useEffect, useState } from 'react'
import {
  Chip,
  IconButton,
  Paper,
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
import { actionsApi } from '../api/actions'
import type { Action } from '../types/models'
import { PageHeader, useToast } from '../components/PageHeader'
import ActionFormDialog from '../components/ActionFormDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import { usePrefs } from '../i18n/PrefsContext'

export default function ActionsPage() {
  const [items, setItems] = useState<Action[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Action | null>(null)
  const [toDelete, setToDelete] = useState<Action | null>(null)
  const { showError, showSuccess } = useToast()
  const { t } = usePrefs()

  const load = useCallback(async () => {
    try {
      setItems(await actionsApi.list())
    } catch (e) {
      showError((e as Error).message)
    }
  }, [showError])

  useEffect(() => {
    load()
  }, [load])

  const save = async (action: Action) => {
    try {
      if (action.id) {
        await actionsApi.update(action.id, action)
        showSuccess(t('actions.updated'))
      } else {
        await actionsApi.create(action)
        showSuccess(t('actions.created'))
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
      await actionsApi.remove(toDelete.id)
      showSuccess(t('actions.deleted'))
      setToDelete(null)
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        title={t('actions.title')}
        subtitle={t('actions.subtitle')}
        onCreate={() => {
          setEditing(null)
          setDialogOpen(true)
        }}
        createLabel={t('actions.new')}
      />
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.id')}</TableCell>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>{t('common.type')}</TableCell>
              <TableCell>{t('actions.result')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>{a.id}</TableCell>
                <TableCell>{a.name || '—'}</TableCell>
                <TableCell>
                  <Chip label={a.type} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell sx={{ maxWidth: 280 }}>
                  <code style={{ fontSize: 12 }}>{a.result}</code>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={t('common.edit')}>
                    <IconButton
                      onClick={() => {
                        setEditing(a)
                        setDialogOpen(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton color="error" onClick={() => setToDelete(a)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {t('actions.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ActionFormDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onSave={save}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('actions.deleteTitle')}
        message={t('actions.deleteMsg', { name: String(toDelete?.name || toDelete?.id || '') })}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
