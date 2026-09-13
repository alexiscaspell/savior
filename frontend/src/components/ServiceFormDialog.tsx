import {
  Autocomplete,
  Button,
  Chip,
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
import { labelsApi } from '../api/labels'
import { usePrefs } from '../i18n/PrefsContext'

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
  const { t } = usePrefs()
  const [name, setName] = useState('')
  const [varsJson, setVarsJson] = useState('{}')
  const [labels, setLabels] = useState<string[]>([])
  const [labelOptions, setLabelOptions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(initial?.name || '')
      setVarsJson(JSON.stringify(initial?.vars || {}, null, 2))
      setLabels([...(initial?.labels || [])])
      setError('')
      labelsApi
        .list()
        .then((items) => {
          const names = [...new Set((items || []).map((l) => l.label).filter(Boolean))]
          setLabelOptions(names)
        })
        .catch(() => setLabelOptions([]))
    }
  }, [open, initial])

  const handleSave = async () => {
    let vars: Record<string, unknown>
    try {
      vars = JSON.parse(varsJson)
    } catch {
      setError(t('services.invalidVars'))
      return
    }
    setSaving(true)
    try {
      await onSave({
        id: initial?.id,
        name,
        vars,
        labels: labels.map((s) => s.trim()).filter(Boolean),
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
      <DialogTitle>{initial?.id ? t('services.view') : t('services.create')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t('common.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label={t('services.varsJson')}
            value={varsJson}
            onChange={(e) => setVarsJson(e.target.value)}
            multiline
            minRows={4}
            error={Boolean(error)}
            helperText={error}
            fullWidth
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
          />
          <Autocomplete
            multiple
            freeSolo
            options={labelOptions}
            value={labels}
            onChange={(_, value) => setLabels(value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index })
                return (
                  <Chip
                    key={key}
                    label={option}
                    color="primary"
                    variant="outlined"
                    size="small"
                    {...tagProps}
                  />
                )
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('services.labelsField')}
                helperText={t('services.labelsHint')}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !name}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
