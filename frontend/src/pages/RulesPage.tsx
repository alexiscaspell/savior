import { useCallback, useEffect, useState } from 'react'
import {
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
import { rulesApi } from '../api/rules'
import { actionsApi } from '../api/actions'
import type { Action, Rule } from '../types/models'
import { PageHeader, useToast } from '../components/PageHeader'
import RuleFormDialog from '../components/RuleFormDialog'
import ConfirmDialog from '../components/ConfirmDialog'

export default function RulesPage() {
  const [items, setItems] = useState<Rule[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Rule | null>(null)
  const [toDelete, setToDelete] = useState<Rule | null>(null)
  const { showError, showSuccess } = useToast()

  const load = useCallback(async () => {
    try {
      const [rules, acts] = await Promise.all([rulesApi.list(), actionsApi.list()])
      setItems(rules)
      setActions(acts)
    } catch (e) {
      showError((e as Error).message)
    }
  }, [showError])

  useEffect(() => {
    load()
  }, [load])

  const save = async (rule: Rule) => {
    try {
      if (rule.id) {
        await rulesApi.update(rule.id, rule, true)
        showSuccess('Rule actualizada')
      } else {
        await rulesApi.create(rule, true)
        showSuccess('Rule creada')
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
      await rulesApi.remove(toDelete.id)
      showSuccess('Rule eliminada')
      setToDelete(null)
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        title="Rules"
        subtitle="Expresiones y consecuencias asociadas"
        onCreate={() => {
          setEditing(null)
          setDialogOpen(true)
        }}
        createLabel="Nueva rule"
      />
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Expression</TableCell>
              <TableCell>Actions</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell sx={{ maxWidth: 320 }}>
                  <code style={{ fontSize: 12 }}>{r.expression}</code>
                </TableCell>
                <TableCell>{r.actions?.length || 0}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton
                      onClick={() => {
                        setEditing(r)
                        setDialogOpen(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" onClick={() => setToDelete(r)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay rules
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <RuleFormDialog
        open={dialogOpen}
        initial={editing}
        availableActions={actions}
        onClose={() => setDialogOpen(false)}
        onSave={save}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar rule"
        message={`¿Eliminar "${toDelete?.name}"?`}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
