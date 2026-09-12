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

export default function SourcesPage() {
  const [items, setItems] = useState<Source[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Source | null>(null)
  const [toDelete, setToDelete] = useState<Source | null>(null)
  const { showError, showSuccess } = useToast()

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
        showSuccess('Source actualizado')
      } else {
        await sourcesApi.create(source)
        showSuccess('Source creado')
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
      showSuccess('Source eliminado')
      setToDelete(null)
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        title="Sources"
        subtitle="Orígenes de datos HTTP, SSH o custom"
        onCreate={() => {
          setEditing(null)
          setDialogOpen(true)
        }}
        createLabel="Nuevo source"
      />
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Variable</TableCell>
              <TableCell align="right">Acciones</TableCell>
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
                  <Tooltip title="Editar">
                    <IconButton
                      onClick={() => {
                        setEditing(s)
                        setDialogOpen(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
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
                  No hay sources
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
        title="Eliminar source"
        message={`¿Eliminar "${toDelete?.name || toDelete?.id}"?`}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
