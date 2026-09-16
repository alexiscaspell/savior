import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slide,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import type { Action, ActionType, Rule, Source } from '../types/models'
import CodeEditor from './CodeEditor'
import { usePrefs } from '../i18n/PrefsContext'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

const emptyRule = (): Rule => ({
  name: '',
  expression: '',
  source: { variables: [], names: [], renames: {} },
  actions: [],
  preconditions: [],
})

const DEFAULT_SCRIPT =
  '# Assign `result` to return the consequence.\n# Available: svc, requests, json, os, source0..\nresult = None\n'

function stripDollar(v: string) {
  return v.startsWith('$') ? v.slice(1) : v
}

function withDollar(v: string) {
  const t = v.trim()
  if (!t) return ''
  return t.startsWith('$') ? t : `$${t}`
}

function sourceKey(s: Source) {
  return String(s.id ?? `${s.name || ''}::${s.variable}`)
}

function sourceLabel(s: Source) {
  const name = s.name || `#${s.id ?? '?'}`
  return `${name} · ${s.variable}`
}

function isScriptAction(type: ActionType): boolean {
  return type === 'python_script' || type === 'custom'
}

function defaultInput(type: ActionType): Record<string, unknown> {
  switch (type) {
    case 'http_action':
      return { url: '', method: 'get', headers: {}, body: null }
    case 'set_variable':
      return { expression: '', variable: '' }
    case 'ssh':
      return { command: '', ip: '', port: 22, creds: { user: '', password: '', key_file: '' } }
    case 'python_script':
    case 'custom':
      return { script: DEFAULT_SCRIPT }
    default:
      return {}
  }
}

function emptyOwnedAction(): Action {
  return {
    id: null,
    name: '',
    type: 'suggest',
    result: '',
    input: {},
  }
}

function cloneAction(action: Action): Action {
  return {
    id: null,
    name: action.name || '',
    type: action.type,
    result: action.result || '',
    input: action.input ? JSON.parse(JSON.stringify(action.input)) : {},
  }
}

type RenameRow = { from: string; to: string }

type OwnedActionDraft = Action & { _key: string; inputJson: string; script: string }

function toDraft(action: Action, key: string): OwnedActionDraft {
  const input = (action.input || {}) as Record<string, unknown>
  const script =
    typeof input.script === 'string' ? input.script : isScriptAction(action.type) ? DEFAULT_SCRIPT : ''
  return {
    ...action,
    id: null,
    _key: key,
    inputJson: JSON.stringify(action.input ?? {}, null, 2),
    script,
  }
}

export default function RuleFormDialog({
  open,
  initial,
  availableActions,
  availableSources,
  availableRules,
  onClose,
  onSave,
}: {
  open: boolean
  initial?: Rule | null
  availableActions: Action[]
  availableSources: Source[]
  availableRules: Rule[]
  onClose: () => void
  onSave: (rule: Rule) => Promise<void>
}) {
  const [form, setForm] = useState<Rule>(emptyRule())
  const [selectedSources, setSelectedSources] = useState<Source[]>([])
  const [selectedVariables, setSelectedVariables] = useState<string[]>([])
  const [renames, setRenames] = useState<RenameRow[]>([])
  const [preconditions, setPreconditions] = useState<string[]>([])
  const [ownedActions, setOwnedActions] = useState<OwnedActionDraft[]>([])
  const [copyFromId, setCopyFromId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const { t } = usePrefs()

  useEffect(() => {
    if (!open) return

    const base = initial ? { ...initial, source: { ...initial.source } } : emptyRule()
    setForm(base)

    const names = base.source?.names || []
    const vars = base.source?.variables || []

    const matched = availableSources.filter((s) => {
      const byName = Boolean(s.name && names.includes(s.name))
      const byVar = Boolean(s.variable && vars.includes(s.variable))
      return byName || byVar
    })
    setSelectedSources(matched)

    const varsFromSources = matched.map((s) => s.variable).filter(Boolean)
    const extraVars = vars.filter((v) => !varsFromSources.includes(v))
    setSelectedVariables([...new Set([...varsFromSources, ...extraVars])])

    const renameEntries = Object.entries(base.source?.renames || {}).map(([from, to]) => ({
      from,
      to,
    }))
    setRenames(renameEntries.length ? renameEntries : [])
    setPreconditions([...(base.preconditions || [])])
    setOwnedActions(
      (base.actions || []).map((a, i) => toDraft(cloneAction(a), `${Date.now()}-${i}`)),
    )
    setCopyFromId('')
    setActionError('')
  }, [open, initial, availableSources])

  const variableOptions = useMemo(() => {
    const fromSelected = selectedSources.map((s) => s.variable).filter(Boolean)
    return [...new Set([...fromSelected, ...selectedVariables])]
  }, [selectedSources, selectedVariables])

  const renameFromOptions = useMemo(
    () => [...new Set(selectedVariables.map(stripDollar).filter(Boolean))],
    [selectedVariables],
  )

  const expressionCompletions = useMemo(() => {
    const aliases = renames.map((r) => withDollar(r.to)).filter(Boolean)
    return [...new Set([...selectedVariables, ...aliases])]
  }, [selectedVariables, renames])

  const preconditionOptions = useMemo(
    () =>
      availableRules
        .filter((r) => r.name && r.name !== form.name && r.id !== initial?.id)
        .map((r) => r.name),
    [availableRules, form.name, initial?.id],
  )

  const onSourcesChange = (sources: Source[]) => {
    setSelectedSources(sources)
    const fromNew = sources.map((s) => s.variable).filter(Boolean)
    const catalogVars = new Set(availableSources.map((s) => s.variable).filter(Boolean))
    setSelectedVariables((prev) => {
      const keptExtras = prev.filter((v) => !catalogVars.has(v))
      return [...new Set([...fromNew, ...keptExtras])]
    })
  }

  const updateDraft = (key: string, patch: Partial<OwnedActionDraft>) => {
    setOwnedActions((rows) => rows.map((r) => (r._key === key ? { ...r, ...patch } : r)))
  }

  const addBlankAction = () => {
    setOwnedActions((rows) => [...rows, toDraft(emptyOwnedAction(), `${Date.now()}-new`)])
  }

  const copyFromCatalog = () => {
    if (copyFromId === '') return
    const src = availableActions.find((a) => a.id === copyFromId)
    if (!src) return
    setOwnedActions((rows) => [...rows, toDraft(cloneAction(src), `${Date.now()}-copy`)])
    setCopyFromId('')
  }

  const handleSave = async () => {
    const names = [
      ...new Set(selectedSources.map((s) => s.name).filter((n): n is string => Boolean(n))),
    ]
    const variables = [...new Set(selectedVariables.map((v) => v.trim()).filter(Boolean))]
    const renamesMap: Record<string, string> = {}
    for (const row of renames) {
      const from = stripDollar(row.from.trim())
      const to = stripDollar(row.to.trim())
      if (from && to) renamesMap[from] = to
    }

    const actions: Action[] = []
    for (const draft of ownedActions) {
      let input: Record<string, unknown> | null
      if (isScriptAction(draft.type)) {
        input = { script: draft.script }
      } else {
        try {
          input = JSON.parse(draft.inputJson)
        } catch {
          setActionError(t('actions.invalidJson'))
          return
        }
      }
      actions.push({
        id: null,
        name: draft.name || null,
        type: draft.type,
        result: draft.result || '',
        input,
      })
    }
    setActionError('')

    const rule: Rule = {
      ...form,
      source: { variables, names, renames: renamesMap },
      preconditions,
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
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth maxWidth="md">
      <DialogTitle>{initial?.id ? t('rules.edit') : t('rules.create')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label={t('common.name')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            required
          />

          <CodeEditor
            label={t('rules.expression')}
            value={form.expression}
            onChange={(expression) => setForm({ ...form, expression })}
            language="python"
            height={140}
            path={`inmemory://rule-expression-${initial?.id ?? 'new'}.py`}
            completions={expressionCompletions}
            helperText={t('rules.expressionHint')}
          />

          <Box>
            <Autocomplete
              multiple
              options={availableSources}
              value={selectedSources}
              onChange={(_, value) => onSourcesChange(value)}
              getOptionLabel={sourceLabel}
              isOptionEqualToValue={(a, b) => sourceKey(a) === sourceKey(b)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index })
                  return (
                    <Chip
                      key={key}
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={sourceLabel(option)}
                      {...tagProps}
                    />
                  )
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('rules.sourceBindings')}
                  helperText={t('rules.sourceBindingsHint')}
                />
              )}
            />
          </Box>

          <Autocomplete
            multiple
            freeSolo
            options={variableOptions}
            value={selectedVariables}
            onChange={(_, value) =>
              setSelectedVariables(
                value.map((v) => withDollar(typeof v === 'string' ? v : String(v))).filter(Boolean),
              )
            }
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index })
                return (
                  <Chip
                    key={key}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    label={option}
                    {...tagProps}
                  />
                )
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('rules.sourceVars')}
                helperText={t('rules.sourceVarsHint')}
              />
            )}
          />

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">{t('rules.renames')}</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() =>
                  setRenames((rows) => [...rows, { from: renameFromOptions[0] || '', to: '' }])
                }
                disabled={renameFromOptions.length === 0}
              >
                {t('rules.addRename')}
              </Button>
            </Stack>
            <Stack spacing={1}>
              {renames.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  {t('rules.renamesHint')}
                </Typography>
              )}
              {renames.map((row, index) => (
                <Stack
                  key={index}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                >
                  <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
                    <InputLabel>{t('rules.renameFrom')}</InputLabel>
                    <Select
                      label={t('rules.renameFrom')}
                      value={row.from}
                      onChange={(e) =>
                        setRenames((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, from: e.target.value } : r)),
                        )
                      }
                    >
                      {renameFromOptions.map((v) => (
                        <MenuItem key={v} value={v}>
                          {`{${v}}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <ArrowForwardIcon color="action" sx={{ alignSelf: 'center' }} />
                  <TextField
                    size="small"
                    label={t('rules.renameTo')}
                    value={row.to}
                    onChange={(e) =>
                      setRenames((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, to: e.target.value } : r)),
                      )
                    }
                    placeholder="response"
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    color="error"
                    onClick={() => setRenames((rows) => rows.filter((_, i) => i !== index))}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
            <FormHelperText>{t('rules.renamesHelp')}</FormHelperText>
          </Box>

          <Autocomplete
            multiple
            options={preconditionOptions}
            value={preconditions}
            onChange={(_, value) => setPreconditions(value)}
            disableCloseOnSelect
            renderOption={(props, option, { selected }) => {
              const { key, ...rest } = props as typeof props & { key: string }
              return (
                <li key={key} {...rest}>
                  <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                  <ListItemText primary={option} />
                </li>
              )
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index })
                return <Chip key={key} size="small" label={option} {...tagProps} />
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('rules.preconditions')}
                helperText={t('rules.preconditionsHint')}
              />
            )}
          />

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">{t('rules.ownedActions')}</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addBlankAction}>
                {t('rules.addAction')}
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t('rules.ownedActionsHint')}
            </Typography>

            {availableActions.length > 0 && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 220, flex: 1 }}>
                  <InputLabel>{t('rules.copyAction')}</InputLabel>
                  <Select
                    label={t('rules.copyAction')}
                    value={copyFromId}
                    onChange={(e) => setCopyFromId(e.target.value as number | '')}
                  >
                    {availableActions.map((a) => (
                      <MenuItem key={a.id} value={a.id!}>
                        {a.name || `#${a.id}`} ({a.type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  disabled={copyFromId === ''}
                  onClick={copyFromCatalog}
                >
                  {t('rules.copyActionBtn')}
                </Button>
              </Stack>
            )}

            <Stack spacing={2}>
              {ownedActions.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  {t('rules.noOwnedActions')}
                </Typography>
              )}
              {ownedActions.map((draft, index) => {
                const scriptMode = isScriptAction(draft.type)
                return (
                  <Paper key={draft._key} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">
                          {t('rules.actionN', { n: index + 1 })}
                        </Typography>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() =>
                            setOwnedActions((rows) => rows.filter((r) => r._key !== draft._key))
                          }
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                      <TextField
                        label={t('common.name')}
                        size="small"
                        value={draft.name || ''}
                        onChange={(e) => updateDraft(draft._key, { name: e.target.value })}
                        fullWidth
                      />
                      <FormControl fullWidth size="small">
                        <InputLabel>{t('common.type')}</InputLabel>
                        <Select
                          label={t('common.type')}
                          value={draft.type}
                          onChange={(e) => {
                            const type = e.target.value as ActionType
                            const input = defaultInput(type)
                            updateDraft(draft._key, {
                              type,
                              input,
                              inputJson: JSON.stringify(input, null, 2),
                              script:
                                typeof input.script === 'string' ? input.script : DEFAULT_SCRIPT,
                            })
                          }}
                        >
                          <MenuItem value="suggest">suggest</MenuItem>
                          <MenuItem value="http_action">http_action</MenuItem>
                          <MenuItem value="set_variable">set_variable</MenuItem>
                          <MenuItem value="ssh">ssh</MenuItem>
                          <MenuItem value="python_script">python_script</MenuItem>
                          <MenuItem value="custom">custom</MenuItem>
                        </Select>
                      </FormControl>
                      {scriptMode ? (
                        <CodeEditor
                          label={t('actions.script')}
                          value={draft.script}
                          onChange={(script) => updateDraft(draft._key, { script })}
                          language="python"
                          height={200}
                          path={`inmemory://rule-action-script-${draft._key}.py`}
                          helperText={t('actions.scriptHint')}
                        />
                      ) : (
                        <CodeEditor
                          label={t('actions.inputJson')}
                          value={draft.inputJson}
                          onChange={(inputJson) => updateDraft(draft._key, { inputJson })}
                          language="json"
                          height={140}
                          path={`inmemory://rule-action-input-${draft._key}.json`}
                          helperText={t('actions.inputHint')}
                        />
                      )}
                      <CodeEditor
                        label={scriptMode ? t('actions.resultOptional') : t('actions.result')}
                        value={draft.result || ''}
                        onChange={(result) => updateDraft(draft._key, { result })}
                        language="python"
                        height={90}
                        path={`inmemory://rule-action-result-${draft._key}.py`}
                        helperText={
                          scriptMode ? t('actions.resultOptionalHint') : t('actions.resultHint')
                        }
                      />
                    </Stack>
                  </Paper>
                )
              })}
            </Stack>
            {actionError && (
              <FormHelperText error sx={{ mt: 1 }}>
                {actionError}
              </FormHelperText>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !form.name || !form.expression}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
