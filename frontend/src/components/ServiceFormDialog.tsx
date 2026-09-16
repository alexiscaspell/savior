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
import { TEMPLATE_VAR } from '../utils/templates'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

function varsForEditor(vars: Record<string, unknown> | undefined, asTemplate: boolean) {
  const next = { ...(vars || {}) }
  if (asTemplate) {
    delete next[TEMPLATE_VAR]
  }
  return JSON.stringify(next, null, 2)
}

export default function ServiceFormDialog({
  open,
  initial,
  onClose,
  onSave,
  mode = 'service',
  readOnly = false,
}: {
  open: boolean
  initial?: Service | null
  onClose: () => void
  onSave: (service: Service) => Promise<void>
  mode?: 'service' | 'template'
  readOnly?: boolean
}) {
  const { t } = usePrefs()
  const asTemplate = mode === 'template'
  const [name, setName] = useState('')
  const [varsJson, setVarsJson] = useState('{}')
  const [labels, setLabels] = useState<string[]>([])
  const [labelOptions, setLabelOptions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(initial?.name || '')
      setVarsJson(varsForEditor(initial?.vars, asTemplate))
      setLabels([...(initial?.labels || [])])
      setError('')
      if (!asTemplate) {
        labelsApi
          .list()
          .then((items) => {
            const names = [...new Set((items || []).map((l) => l.label).filter(Boolean))]
            setLabelOptions(names)
          })
          .catch(() => setLabelOptions([]))
      }
    }
  }, [open, initial, asTemplate])

  const handleSave = async () => {
    if (readOnly) return
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
        labels: asTemplate ? [] : labels.map((s) => s.trim()).filter(Boolean),
        sources: initial?.sources || [],
        rules: initial?.rules || [],
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const title = asTemplate
    ? readOnly
      ? t('templates.view')
      : initial?.id
        ? t('templates.edit')
        : t('templates.create')
    : readOnly
      ? t('services.view')
      : initial?.id
        ? t('services.edit')
        : t('services.create')

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t('common.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            InputProps={{ readOnly }}
          />
          <TextField
            label={t('services.varsJson')}
            value={varsJson}
            onChange={(e) => setVarsJson(e.target.value)}
            multiline
            minRows={4}
            error={Boolean(error)}
            helperText={error || (asTemplate ? t('templates.varsHint') : undefined)}
            fullWidth
            InputProps={{ readOnly, sx: { fontFamily: 'monospace', fontSize: 13 } }}
          />
          {!asTemplate && (
            <Autocomplete
              multiple
              freeSolo
              options={labelOptions}
              value={labels}
              onChange={(_, value) => setLabels(value)}
              disabled={readOnly}
              readOnly={readOnly}
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
                      {...(readOnly ? { onDelete: undefined } : {})}
                    />
                  )
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('services.labelsField')}
                  helperText={readOnly ? undefined : t('services.labelsHint')}
                />
              )}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{readOnly ? t('common.close') : t('common.cancel')}</Button>
        {!readOnly && (
          <Button variant="contained" onClick={handleSave} disabled={saving || !name}>
            {t('common.save')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
