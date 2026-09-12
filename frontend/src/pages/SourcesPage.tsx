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
import { sourcesApi } from '../api/sources'
import type { Source } from '../types/models'
import { PageHeader, useToast } from '../components/PageHeader'
import SourceFormDialog from '../components/SourceFormDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import { usePrefs } from '../i18n/PrefsContext'

export default function SourcesPage() {
  const [items, setItems] = useState<Source[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Source | null>(null)
  const [toDelete, setToDelete] = useState<Source | null>(null)
  const { showError, showSuccess } = useToast()
  const { t } = usePrefs()

  const load = useCallback(async () => {
    try {
      setItems(await sourcesApi.list())
    } catch (e) {
      showError((e as Error).message)
    }
  }, [showError])

  useEffect(() => {
    load()
  }, [load])

  const save = async (source: Source) => {
    try {
      if (source.id) {
        await sourcesApi.update(source.id, source)
        showSuccess(t('sources.updated'))
      } else {
        await sourcesApi.create(source)
        showSuccess(t('sources.created'))
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
      await sourcesApi.remove(toDelete.id)
      showSuccess(t('sources.deleted'))
      setToDelete(null)
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        title={t('sources.title')}
        subtitle={t('sources.subtitle')}
        onCreate={() => {
          setEditing(null)
          setDialogOpen(true)
        }}
        createLabel={t('sources.new')}
      />
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.id')}</TableCell>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>{t('common.type')}</TableCell>
              <TableCell>{t('sources.variable')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.name || '—'}</TableCell>
                <TableCell>
                  <Chip label={s.type} size="small" color="secondary" variant="outlined" />
                </TableCell>
                <TableCell>
                  <code>{s.variable}</code>
                </TableCell>
                <TableCell align="right">
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
                <TableCell colSpan={5} align="center">
                  {t('sources.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SourceFormDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onSave={save}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('sources.deleteTitle')}
        message={t('sources.deleteMsg', { name: String(toDelete?.name || toDelete?.id || '') })}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
