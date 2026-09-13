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
import { forwardRef, useEffect, useMemo, useState } from 'react'
import type { Action, ActionType } from '../types/models'
import { usePrefs } from '../i18n/PrefsContext'
import CodeEditor from './CodeEditor'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

function defaultInput(type: ActionType): Record<string, unknown> | null {
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

function inputSchema(type: ActionType): object {
  switch (type) {
    case 'http_action':
      return {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            enum: ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'],
          },
          url: { type: 'string' },
          headers: { type: 'object', additionalProperties: { type: 'string' } },
          body: {
            anyOf: [{ type: 'object' }, { type: 'string' }, { type: 'null' }],
          },
        },
        required: ['url', 'method'],
        additionalProperties: true,
      }
    case 'set_variable':
      return {
        type: 'object',
        properties: {
          variable: { type: 'string', description: 'Variable name to set' },
          expression: { type: 'string', description: 'Expression for the value' },
        },
        required: ['variable'],
        additionalProperties: true,
      }
    case 'ssh':
      return {
        type: 'object',
        properties: {
          command: { type: 'string' },
          ip: { type: 'string' },
          port: { type: 'integer', default: 22 },
          creds: {
            type: 'object',
            properties: {
              user: { type: 'string' },
              password: { type: 'string' },
              key_file: { type: 'string' },
            },
          },
        },
        required: ['command', 'ip'],
        additionalProperties: true,
      }
    case 'suggest':
      return { type: 'object', additionalProperties: true }
    default:
      return { type: 'object', additionalProperties: true }
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
  const [inputJson, setInputJson] = useState('{}')
  const [saving, setSaving] = useState(false)
  const [jsonError, setJsonError] = useState('')
  const { t } = usePrefs()

  useEffect(() => {
    if (open) {
      const base = initial ? { ...initial } : emptyAction()
      setForm(base)
      setInputJson(JSON.stringify(base.input ?? {}, null, 2))
      setJsonError('')
    }
  }, [open, initial])

  const setType = (type: ActionType) => {
    const input = defaultInput(type)
    setForm((f) => ({ ...f, type, input }))
    setInputJson(JSON.stringify(input, null, 2))
  }

  const schema = useMemo(() => inputSchema(form.type), [form.type])

  const handleSave = async () => {
    let input: Record<string, unknown> | null
    try {
      input = JSON.parse(inputJson)
      setJsonError('')
    } catch {
      setJsonError(t('actions.invalidJson'))
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
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth maxWidth="md">
      <DialogTitle>{initial?.id ? t('actions.edit') : t('actions.create')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t('common.name')}
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>{t('common.type')}</InputLabel>
            <Select
              label={t('common.type')}
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
          <CodeEditor
            label={t('actions.result')}
            value={form.result || ''}
            onChange={(result) => setForm({ ...form, result })}
            language="python"
            height={140}
            path={`inmemory://action-result-${initial?.id ?? 'new'}.py`}
            completions={['$response', 'svc', 'True', 'False']}
            helperText={t('actions.resultHint')}
          />
          <CodeEditor
            label={t('actions.inputJson')}
            value={inputJson}
            onChange={setInputJson}
            language="json"
            height={220}
            path={`inmemory://action-input-${form.type}.json`}
            schema={schema}
            error={Boolean(jsonError)}
            helperText={jsonError || t('actions.inputHint')}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {t('common.save')}
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
