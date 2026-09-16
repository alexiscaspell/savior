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
import { forwardRef, useEffect, useMemo, useState } from 'react'
import type { Source, SourceType } from '../types/models'
import { usePrefs } from '../i18n/PrefsContext'
import CodeEditor from './CodeEditor'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

const DEFAULT_SCRIPT =
  '# Assign `result` to produce source data.\n# Available: svc, requests, json, os, source0..\nresult = None\n'

function isScriptSource(type: SourceType): boolean {
  return type === 'python_script' || type === 'custom'
}

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
    case 'python_script':
    case 'custom':
      return { script: DEFAULT_SCRIPT }
    default:
      return {}
  }
}

function inputSchema(type: SourceType): object {
  switch (type) {
    case 'http_request':
    case 'http_log':
      return {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            enum: ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'],
            description: 'HTTP method',
          },
          url: { type: 'string', description: 'Request URL' },
          headers: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'HTTP headers',
          },
          body: {
            description: 'Request body',
            anyOf: [{ type: 'object' }, { type: 'string' }, { type: 'null' }],
          },
          retry: { anyOf: [{ type: 'integer', minimum: 0 }, { type: 'null' }] },
          retry_sleep: { type: 'number', minimum: 0 },
        },
        required: ['method', 'url'],
        additionalProperties: true,
      }
    case 'ssh_log':
      return {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Remote log file path' },
          ip: { type: 'string', description: 'Host IP or hostname' },
          port: { type: 'integer', description: 'SSH port', default: 22 },
          creds: {
            type: 'object',
            properties: {
              user: { type: 'string' },
              password: { type: 'string' },
              key_file: { type: 'string' },
            },
            additionalProperties: false,
          },
        },
        required: ['filepath', 'ip'],
        additionalProperties: true,
      }
    default:
      return { type: 'object', additionalProperties: true }
  }
}

function scriptFromInput(input: Record<string, unknown> | null | undefined): string {
  if (!input || typeof input !== 'object') return DEFAULT_SCRIPT
  const script = input.script
  return typeof script === 'string' ? script : DEFAULT_SCRIPT
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
  const [script, setScript] = useState(DEFAULT_SCRIPT)
  const [outputExpr, setOutputExpr] = useState('')
  const [saving, setSaving] = useState(false)
  const [jsonError, setJsonError] = useState('')
  const { t } = usePrefs()

  useEffect(() => {
    if (open) {
      const base = initial ? { ...initial, input: initial.input || {} } : emptySource()
      setForm(base)
      setInputJson(JSON.stringify(base.input || {}, null, 2))
      setScript(scriptFromInput(base.input as Record<string, unknown>))
      setOutputExpr(base.output || '')
      setJsonError('')
    }
  }, [open, initial])

  const setType = (type: SourceType) => {
    const input = defaultInput(type)
    setForm((f) => ({ ...f, type, input }))
    setInputJson(JSON.stringify(input, null, 2))
    if (isScriptSource(type)) {
      setScript(scriptFromInput(input))
    }
  }

  const schema = useMemo(() => inputSchema(form.type), [form.type])
  const scriptMode = isScriptSource(form.type)

  const handleSave = async () => {
    let input: Record<string, unknown>
    if (scriptMode) {
      input = { script }
      setJsonError('')
    } else {
      try {
        input = JSON.parse(inputJson)
        setJsonError('')
      } catch {
        setJsonError(t('sources.invalidJson'))
        return
      }
    }
    setSaving(true)
    try {
      await onSave({
        ...form,
        input,
        variable: form.variable || '$response',
        output: outputExpr.trim() || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth maxWidth="md">
      <DialogTitle>{initial?.id ? t('sources.edit') : t('sources.create')}</DialogTitle>
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
              onChange={(e) => setType(e.target.value as SourceType)}
            >
              <MenuItem value="http_request">http_request</MenuItem>
              <MenuItem value="http_log">http_log</MenuItem>
              <MenuItem value="ssh_log">ssh_log</MenuItem>
              <MenuItem value="python_script">python_script</MenuItem>
              <MenuItem value="custom">custom (alias)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={t('sources.variable')}
            value={form.variable || ''}
            onChange={(e) => setForm({ ...form, variable: e.target.value })}
            helperText={t('sources.variableHint')}
            fullWidth
          />
          {scriptMode ? (
            <CodeEditor
              label={t('sources.script')}
              value={script}
              onChange={setScript}
              language="python"
              height={360}
              path={`inmemory://source-script-${initial?.id ?? 'new'}.py`}
              completions={['svc', 'result', 'requests', 'json', 'os', 'source0']}
              helperText={t('sources.scriptHint')}
            />
          ) : (
            <CodeEditor
              label={t('sources.inputJson')}
              value={inputJson}
              onChange={setInputJson}
              language="json"
              height={220}
              path={`inmemory://source-input-${form.type}.json`}
              schema={schema}
              error={Boolean(jsonError)}
              helperText={jsonError || t('sources.inputHint')}
            />
          )}
          <CodeEditor
            label={scriptMode ? t('sources.outputOptional') : t('sources.output')}
            value={outputExpr}
            onChange={setOutputExpr}
            language="python"
            height={120}
            path="inmemory://source-output.py"
            helperText={scriptMode ? t('sources.outputOptionalHint') : t('sources.outputHint')}
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
