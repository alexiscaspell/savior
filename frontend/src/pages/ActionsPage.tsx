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

export default function ActionsPage() {
  const [items, setItems] = useState<Action[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Action | null>(null)
  const [toDelete, setToDelete] = useState<Action | null>(null)
  const { showError, showSuccess } = useToast()

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
        showSuccess('Action actualizada')
      } else {
        await actionsApi.create(action)
        showSuccess('Action creada')
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
      showSuccess('Action eliminada')
      setToDelete(null)
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        title="Actions"
        subtitle="Consecuencias: suggest, HTTP, SSH, variables"
        onCreate={() => {
          setEditing(null)
          setDialogOpen(true)
        }}
        createLabel="Nueva action"
      />
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Result</TableCell>
              <TableCell align="right">Acciones</TableCell>
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
                  <Tooltip title="Editar">
                    <IconButton
                      onClick={() => {
                        setEditing(a)
                        setDialogOpen(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
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
                  No hay actions
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
        title="Eliminar action"
        message={`¿Eliminar "${toDelete?.name || toDelete?.id}"?`}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
