import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slide,
  Stack,
  TextField,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { forwardRef, useEffect, useState } from 'react'
import type { Action, Rule } from '../types/models'
import { ActionMultiSelect } from './ActionFormDialog'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

const emptyRule = (): Rule => ({
  name: '',
  expression: '',
  source: { variables: ['$response'], names: [], renames: {} },
  actions: [],
  preconditions: [],
})

export default function RuleFormDialog({
  open,
  initial,
  availableActions,
  onClose,
  onSave,
}: {
  open: boolean
  initial?: Rule | null
  availableActions: Action[]
  onClose: () => void
  onSave: (rule: Rule) => Promise<void>
}) {
  const [form, setForm] = useState<Rule>(emptyRule())
  const [variables, setVariables] = useState('')
  const [names, setNames] = useState('')
  const [renamesJson, setRenamesJson] = useState('{}')
  const [preconditions, setPreconditions] = useState('')
  const [actionIds, setActionIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      const base = initial ? { ...initial, source: { ...initial.source } } : emptyRule()
      setForm(base)
      setVariables((base.source?.variables || []).join(', '))
      setNames((base.source?.names || []).join(', '))
      setRenamesJson(JSON.stringify(base.source?.renames || {}, null, 2))
      setPreconditions((base.preconditions || []).join(', '))
      setActionIds((base.actions || []).map((a) => a.id!).filter(Boolean))
      setError('')
    }
  }, [open, initial])

  const handleSave = async () => {
    let renames: Record<string, string>
    try {
      renames = JSON.parse(renamesJson)
    } catch {
      setError('JSON de renames inválido')
      return
    }
    const actions = availableActions.filter((a) => a.id != null && actionIds.includes(a.id))
    const rule: Rule = {
      ...form,
      source: {
        variables: variables
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        names: names
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        renames,
      },
      preconditions: preconditions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      actions,
    }
    setSaving(true)
    try {
      await onSave(rule)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth maxWidth="sm">
      <DialogTitle>{initial?.id ? 'Editar rule' : 'Nueva rule'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Expression"
            value={form.expression}
            onChange={(e) => setForm({ ...form, expression: e.target.value })}
            helperText='Ej: $response.status_code != 200'
            fullWidth
            required
            multiline
            minRows={2}
          />
          <TextField
            label="Source variables"
            value={variables}
            onChange={(e) => setVariables(e.target.value)}
            helperText="Separadas por coma. Ej: $response"
            fullWidth
          />
          <TextField
            label="Source names"
            value={names}
            onChange={(e) => setNames(e.target.value)}
            helperText="Nombres de sources del service. Separados por coma"
            fullWidth
          />
          <TextField
            label="Source renames (JSON)"
            value={renamesJson}
            onChange={(e) => setRenamesJson(e.target.value)}
            multiline
            minRows={2}
            error={Boolean(error)}
            helperText={error || 'Ej: {"response_alive": "response"}'}
            fullWidth
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
          />
          <TextField
            label="Preconditions"
            value={preconditions}
            onChange={(e) => setPreconditions(e.target.value)}
            helperText="Nombres de rules previas, separadas por coma"
            fullWidth
          />
          <ActionMultiSelect
            actions={availableActions}
            selectedIds={actionIds}
            onChange={setActionIds}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !form.name}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
