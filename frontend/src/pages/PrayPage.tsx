import { useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Fade,
  FormControlLabel,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { prayApi } from '../api/pray'
import { servicesApi } from '../api/services'
import type { PrayResponse, Service, Source } from '../types/models'
import { PageHeader, useToast } from '../components/PageHeader'
import CodeEditor from '../components/CodeEditor'
import { usePrefs } from '../i18n/PrefsContext'

function sourceKey(s: Source) {
  return s.name || s.variable || String(s.id)
}

function sourceLabel(s: Source) {
  if (s.name && s.variable) return `${s.name} · ${s.variable}`
  return s.name || s.variable || `#${s.id}`
}

export default function PrayPage() {
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [fast, setFast] = useState(false)
  const [dryRun, setDryRun] = useState(false)
  const [paramsJson, setParamsJson] = useState('{}')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PrayResponse[]>([])
  const { showError, showSuccess } = useToast()
  const { t } = usePrefs()

  useEffect(() => {
    servicesApi
      .list()
      .then(setServices)
      .catch((e) => showError((e as Error).message))
  }, [showError])

  const availableSources = useMemo(() => {
    const map = new Map<string, Source>()
    for (const svc of selectedServices) {
      for (const src of svc.sources || []) {
        const key = sourceKey(src)
        if (!map.has(key)) map.set(key, src)
      }
    }
    return [...map.values()]
  }, [selectedServices])

  useEffect(() => {
    if (
      selectedSource &&
      !availableSources.some((s) => sourceKey(s) === sourceKey(selectedSource))
    ) {
      setSelectedSource(null)
    }
  }, [availableSources, selectedSource])

  const allSelected =
    services.length > 0 && selectedServices.length === services.length

  const toggleSelectAll = () => {
    setSelectedServices(allSelected ? [] : [...services])
  }

  const run = async () => {
    let params: Record<string, unknown>
    try {
      params = JSON.parse(paramsJson)
    } catch {
      showError(t('pray.invalidParams'))
      return
    }
    if (selectedServices.length === 0) {
      showError(t('pray.selectService'))
      return
    }

    setLoading(true)
    setResults([])
    try {
      const sourceName = selectedSource?.name || null
      const settled = await Promise.all(
        selectedServices.map(async (svc) => {
          const payload: Parameters<typeof prayApi.pray>[0] = {
            service_id: svc.id as number,
            fast,
            dry_run: dryRun,
            params,
          }
          if (sourceName) {
            payload.source = sourceName
          }
          return prayApi.pray(payload)
        }),
      )
      setResults(settled)
      showSuccess(t('pray.success'))
    } catch (e) {
      showError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title={t('pray.title')} subtitle={t('pray.subtitle')} />

      <Paper elevation={1} sx={{ p: 3, mb: 3, maxWidth: 720 }}>
        <Stack spacing={2}>
          <Autocomplete
            multiple
            options={services}
            value={selectedServices}
            onChange={(_, value) => setSelectedServices(value)}
            getOptionLabel={(s) => s.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            disableCloseOnSelect
            renderOption={(props, option, { selected }) => {
              const { key, ...rest } = props as typeof props & { key: string }
              return (
                <li key={key} {...rest}>
                  <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                  <ListItemText primary={option.name} secondary={`#${option.id}`} />
                </li>
              )
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index })
                return <Chip key={key} size="small" label={option.name} {...tagProps} />
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('pray.service')}
                helperText={t('pray.serviceHint')}
              />
            )}
          />
          <FormControlLabel
            control={<Checkbox checked={allSelected} onChange={toggleSelectAll} />}
            label={t('pray.selectAll')}
          />

          <Autocomplete
            options={availableSources}
            value={selectedSource}
            onChange={(_, value) => setSelectedSource(value)}
            getOptionLabel={sourceLabel}
            isOptionEqualToValue={(a, b) => sourceKey(a) === sourceKey(b)}
            disabled={selectedServices.length === 0}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('pray.sourceFilter')}
                helperText={t('pray.sourceFilterHint')}
              />
            )}
          />

          <FormControlLabel
            control={<Checkbox checked={fast} onChange={(e) => setFast(e.target.checked)} />}
            label={t('pray.fast')}
          />
          <FormControlLabel
            control={<Checkbox checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />}
            label={t('pray.dryRun')}
          />

          <CodeEditor
            label={t('pray.params')}
            value={paramsJson}
            onChange={setParamsJson}
            language="json"
            height={160}
            path="inmemory://pray-params.json"
            schema={{
              type: 'object',
              additionalProperties: true,
              description: 'Extra params merged into service vars for this pray',
            }}
            helperText={t('pray.paramsHint')}
          />

          <Button
            variant="contained"
            size="large"
            startIcon={<VolunteerActivismIcon />}
            onClick={run}
            disabled={loading || selectedServices.length === 0}
            sx={{ alignSelf: 'flex-start' }}
          >
            {loading ? t('pray.running') : t('pray.run')}
          </Button>
        </Stack>
      </Paper>

      <Fade in={results.length > 0}>
        <Box>
          <Stack spacing={3}>
            {results.map((result) => (
              <Paper key={result.service} elevation={1} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('pray.result')} · {result.service}
                  {dryRun && (
                    <Chip
                      size="small"
                      label={t('pray.dryRunBadge')}
                      color="warning"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
                {(result.rules || []).length === 0 && (
                  <Typography color="text.secondary">{t('pray.noMatch')}</Typography>
                )}
                <Stack spacing={2}>
                  {(result.rules || []).map((r, i) => (
                    <Paper key={`${result.service}-${r.name}-${i}`} variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Chip label={r.name} color="primary" />
                        <Typography variant="caption" color="text.secondary">
                          {dryRun
                            ? t('pray.matchedOnly')
                            : `${r.consequences?.length || 0} ${t('pray.consequences')}`}
                        </Typography>
                      </Stack>
                      {!dryRun && (
                        <Stack spacing={1}>
                          {(r.consequences || []).map((c, j) => (
                            <Box
                              key={j}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'action.hover',
                              }}
                            >
                              <Typography variant="subtitle2">{c.action}</Typography>
                              <Box
                                component="pre"
                                sx={{ m: 0, mt: 0.5, fontSize: 12, whiteSpace: 'pre-wrap' }}
                              >
                                {typeof c.result === 'string'
                                  ? c.result
                                  : JSON.stringify(c.result, null, 2)}
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Fade>
    </>
  )
}
