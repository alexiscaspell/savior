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
  Select,
  Slide,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import type { Action, Rule, Source } from '../types/models'
import { ActionMultiSelect } from './ActionFormDialog'
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

type RenameRow = { from: string; to: string }

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
  const [actionIds, setActionIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
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
    setActionIds((base.actions || []).map((a) => a.id!).filter(Boolean))
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

    const actions = availableActions.filter((a) => a.id != null && actionIds.includes(a.id))
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
                  setRenames((rows) => [
                    ...rows,
                    { from: renameFromOptions[0] || '', to: '' },
                  ])
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
                    InputProps={{
                      startAdornment: (
                        <Typography component="span" color="text.secondary" sx={{ mr: 0.5 }}>
                          {'{'}
                        </Typography>
                      ),
                      endAdornment: (
                        <Typography component="span" color="text.secondary" sx={{ ml: 0.5 }}>
                          {'}'}
                        </Typography>
                      ),
                    }}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`{${row.from || '…'}} → {${row.to || '…'}}`}
                    sx={{ fontFamily: 'monospace' }}
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

          <ActionMultiSelect
            actions={availableActions}
            selectedIds={actionIds}
            onChange={setActionIds}
          />
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
