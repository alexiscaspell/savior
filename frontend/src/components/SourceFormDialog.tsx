import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slide,
  Stack,
  TextField,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { forwardRef, useEffect, useState } from 'react'
import type { Source, SourceType } from '../types/models'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

const emptySource = (): Source => ({
  name: '',
  type: 'http_request',
  variable: '$response',
  input: { method: 'get', url: '' },
  output: null,
})

function defaultInput(type: SourceType): Record<string, unknown> {
  switch (type) {
    case 'http_request':
    case 'http_log':
      return { method: 'get', url: '', headers: {}, body: null, retry: null, retry_sleep: 1 }
    case 'ssh_log':
      return {
        filepath: '',
        ip: '',
        port: 22,
        creds: { user: '', password: '', key_file: '' },
      }
    default:
      return {}
  }
}

export default function SourceFormDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  initial?: Source | null
  onClose: () => void
  onSave: (source: Source) => Promise<void>
}) {
  const [form, setForm] = useState<Source>(emptySource())
  const [inputJson, setInputJson] = useState('{}')
  const [saving, setSaving] = useState(false)
  const [jsonError, setJsonError] = useState('')

  useEffect(() => {
    if (open) {
      const base = initial ? { ...initial, input: initial.input || {} } : emptySource()
      setForm(base)
      setInputJson(JSON.stringify(base.input || {}, null, 2))
      setJsonError('')
    }
  }, [open, initial])

  const setType = (type: SourceType) => {
    const input = defaultInput(type)
    setForm((f) => ({ ...f, type, input }))
    setInputJson(JSON.stringify(input, null, 2))
  }

  const handleSave = async () => {
    let input: Record<string, unknown>
    try {
      input = JSON.parse(inputJson)
      setJsonError('')
    } catch {
      setJsonError('JSON de input inválido')
      return
    }
    setSaving(true)
    try {
      await onSave({ ...form, input, variable: form.variable || '$response' })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth maxWidth="sm">
      <DialogTitle>{initial?.id ? 'Editar source' : 'Nuevo source'}</DialogTitle>
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
              onChange={(e) => setType(e.target.value as SourceType)}
            >
              <MenuItem value="http_request">http_request</MenuItem>
              <MenuItem value="http_log">http_log</MenuItem>
              <MenuItem value="ssh_log">ssh_log</MenuItem>
              <MenuItem value="custom">custom</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Variable"
            value={form.variable || ''}
            onChange={(e) => setForm({ ...form, variable: e.target.value })}
            helperText="Ej: $response"
            fullWidth
          />
          <TextField
            label="Output (opcional)"
            value={form.output || ''}
            onChange={(e) => setForm({ ...form, output: e.target.value || null })}
            fullWidth
          />
          <TextField
            label="Input (JSON)"
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            multiline
            minRows={6}
            error={Boolean(jsonError)}
            helperText={jsonError || 'Campos según el tipo (url, method, creds, etc.)'}
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
