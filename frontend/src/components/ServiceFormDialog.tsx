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
import type { Service } from '../types/models'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export default function ServiceFormDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  initial?: Service | null
  onClose: () => void
  onSave: (service: Service) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [varsJson, setVarsJson] = useState('{}')
  const [labels, setLabels] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(initial?.name || '')
      setVarsJson(JSON.stringify(initial?.vars || {}, null, 2))
      setLabels((initial?.labels || []).join(', '))
      setError('')
    }
  }, [open, initial])

  const handleSave = async () => {
    let vars: Record<string, unknown>
    try {
      vars = JSON.parse(varsJson)
    } catch {
      setError('JSON de vars inválido')
      return
    }
    setSaving(true)
    try {
      await onSave({
        id: initial?.id,
        name,
        vars,
        labels: labels
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        sources: initial?.sources || [],
        rules: initial?.rules || [],
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth maxWidth="sm">
      <DialogTitle>{initial?.id ? 'Editar service' : 'Nuevo service'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Vars (JSON)"
            value={varsJson}
            onChange={(e) => setVarsJson(e.target.value)}
            multiline
            minRows={4}
            error={Boolean(error)}
            helperText={error}
            fullWidth
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
          />
          <TextField
            label="Labels"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            helperText="Separados por coma"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !name}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
