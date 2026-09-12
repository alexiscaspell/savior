import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Slide,
  Stack,
  TextField,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { forwardRef, useEffect, useState } from 'react'
import type { Action, ActionType } from '../types/models'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

function defaultInput(type: ActionType): Record<string, unknown> {
  switch (type) {
    case 'http_action':
      return { url: '', method: 'get', headers: {}, body: null }
    case 'set_variable':
      return { expression: '', variable: '' }
    case 'ssh':
      return { command: '', ip: '', port: 22, creds: { user: '', password: '', key_file: '' } }
    case 'suggest':
      return {}
    default:
      return {}
  }
}

const emptyAction = (): Action => ({
  name: '',
  type: 'suggest',
  result: '',
  input: {},
})

export default function ActionFormDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  initial?: Action | null
  onClose: () => void
  onSave: (action: Action) => Promise<void>
}) {
  const [form, setForm] = useState<Action>(emptyAction())
  const [inputJson, setInputJson] = useState('null')
  const [saving, setSaving] = useState(false)
  const [jsonError, setJsonError] = useState('')

  useEffect(() => {
    if (open) {
      const base = initial ? { ...initial } : emptyAction()
      setForm(base)
      setInputJson(JSON.stringify(base.input ?? null, null, 2))
      setJsonError('')
    }
  }, [open, initial])

  const setType = (type: ActionType) => {
    const input = defaultInput(type)
    setForm((f) => ({ ...f, type, input }))
    setInputJson(JSON.stringify(input, null, 2))
  }

  const handleSave = async () => {
    let input: Record<string, unknown> | null
    try {
      input = JSON.parse(inputJson)
      setJsonError('')
    } catch {
      setJsonError('JSON de input inválido')
      return
    }
    setSaving(true)
    try {
      await onSave({ ...form, input, result: form.result ?? '' })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth maxWidth="sm">
      <DialogTitle>{initial?.id ? 'Editar action' : 'Nueva action'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nombre"
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              label="Tipo"
              value={form.type}
              onChange={(e) => setType(e.target.value as ActionType)}
            >
              <MenuItem value="suggest">suggest</MenuItem>
              <MenuItem value="http_action">http_action</MenuItem>
              <MenuItem value="set_variable">set_variable</MenuItem>
              <MenuItem value="ssh">ssh</MenuItem>
              <MenuItem value="custom">custom</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Result"
            value={form.result || ''}
            onChange={(e) => setForm({ ...form, result: e.target.value })}
            helperText="Expresión o mensaje evaluado al aplicar la acción"
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Input (JSON)"
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            multiline
            minRows={5}
            error={Boolean(jsonError)}
            helperText={jsonError || 'null para suggest; objeto según tipo'}
            fullWidth
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function ActionMultiSelect({
  actions,
  selectedIds,
  onChange,
}: {
  actions: Action[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}) {
  return (
    <FormControl fullWidth>
      <InputLabel>Actions</InputLabel>
      <Select
        multiple
        label="Actions"
        value={selectedIds}
        onChange={(e) => onChange(e.target.value as number[])}
        renderValue={(selected) =>
          actions
            .filter((a) => a.id != null && selected.includes(a.id))
            .map((a) => a.name || `#${a.id}`)
            .join(', ')
        }
      >
        {actions.map((a) => (
          <MenuItem key={a.id} value={a.id!}>
            <Checkbox checked={selectedIds.includes(a.id!)} />
            <ListItemText primary={a.name || `Action #${a.id}`} secondary={a.type} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
