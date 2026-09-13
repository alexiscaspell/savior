import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import { servicesApi } from '../api/services'
import { sourcesApi } from '../api/sources'
import { rulesApi } from '../api/rules'
import type { Rule, Service, Source } from '../types/models'
import { useToast } from '../components/PageHeader'
import { usePrefs } from '../i18n/PrefsContext'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const serviceId = Number(id)
  const navigate = useNavigate()
  const { showError, showSuccess } = useToast()
  const { t } = usePrefs()
  const [service, setService] = useState<Service | null>(null)
  const [tab, setTab] = useState(0)
  const [allSources, setAllSources] = useState<Source[]>([])
  const [allRules, setAllRules] = useState<Rule[]>([])
  const [linkSourceId, setLinkSourceId] = useState<number | ''>('')
  const [linkRuleId, setLinkRuleId] = useState<number | ''>('')

  const load = useCallback(async () => {
    try {
      const [svc, sources, rules] = await Promise.all([
        servicesApi.get(serviceId),
        sourcesApi.list(),
        rulesApi.list(),
      ])
      setService(svc)
      setAllSources(sources)
      setAllRules(rules)
    } catch (e) {
      showError((e as Error).message)
    }
  }, [serviceId, showError])

  useEffect(() => {
    load()
  }, [load])

  if (!service) {
    return <Typography>{t('common.loading')}</Typography>
  }

  const linkedSourceIds = new Set((service.sources || []).map((s) => s.id))
  const linkedRuleIds = new Set((service.rules || []).map((r) => r.id))

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/services')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4">{service.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('services.edit')} · {t('common.id')} {service.id}
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('detail.vars')}
        </Typography>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 1.5,
            bgcolor: 'action.hover',
            borderRadius: 2,
            overflow: 'auto',
            fontSize: 13,
          }}
        >
          {JSON.stringify(service.vars || {}, null, 2)}
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
          {(service.labels || []).map((l) => (
            <Chip key={l} label={l} color="primary" variant="outlined" />
          ))}
        </Stack>
      </Paper>

      <Paper elevation={1} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('detail.sourcesTab', { count: service.sources?.length || 0 })} />
          <Tab label={t('detail.rulesTab', { count: service.rules?.length || 0 })} />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 220 }} size="small">
                <InputLabel>{t('detail.linkSource')}</InputLabel>
                <Select
                  label={t('detail.linkSource')}
                  value={linkSourceId}
                  onChange={(e) => setLinkSourceId(e.target.value as number)}
                >
                  {allSources
                    .filter((s) => !linkedSourceIds.has(s.id))
                    .map((s) => (
                      <MenuItem key={s.id} value={s.id!}>
                        {s.name || `#${s.id}`} ({s.type})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                disabled={!linkSourceId}
                onClick={async () => {
                  try {
                    await servicesApi.linkSource(serviceId, linkSourceId as number)
                    showSuccess(t('detail.sourceLinked'))
                    setLinkSourceId('')
                    await load()
                  } catch (e) {
                    showError((e as Error).message)
                  }
                }}
              >
                {t('detail.link')}
              </Button>
            </Stack>
            <Stack spacing={1}>
              {(service.sources || []).map((s) => (
                <Paper
                  key={s.id}
                  variant="outlined"
                  sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Box>
                    <Typography fontWeight={600}>{s.name || `Source #${s.id}`}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.type} · {s.variable}
                    </Typography>
                  </Box>
                  <IconButton
                    color="error"
                    onClick={async () => {
                      try {
                        await servicesApi.unlinkSource(serviceId, s.id!)
                        showSuccess(t('detail.sourceUnlinked'))
                        await load()
                      } catch (e) {
                        showError((e as Error).message)
                      }
                    }}
                  >
                    <LinkOffIcon />
                  </IconButton>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 220 }} size="small">
                <InputLabel>{t('detail.linkRule')}</InputLabel>
                <Select
                  label={t('detail.linkRule')}
                  value={linkRuleId}
                  onChange={(e) => setLinkRuleId(e.target.value as number)}
                >
                  {allRules
                    .filter((r) => !linkedRuleIds.has(r.id))
                    .map((r) => (
                      <MenuItem key={r.id} value={r.id!}>
                        {r.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                disabled={!linkRuleId}
                onClick={async () => {
                  try {
                    await servicesApi.linkRule(serviceId, linkRuleId as number)
                    showSuccess(t('detail.ruleLinked'))
                    setLinkRuleId('')
                    await load()
                  } catch (e) {
                    showError((e as Error).message)
                  }
                }}
              >
                {t('detail.link')}
              </Button>
            </Stack>
            <Stack spacing={1}>
              {(service.rules || []).map((r) => (
                <Paper
                  key={r.id}
                  variant="outlined"
                  sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Box>
                    <Typography fontWeight={600}>{r.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.expression}
                    </Typography>
                  </Box>
                  <IconButton
                    color="error"
                    onClick={async () => {
                      try {
                        await servicesApi.unlinkRule(serviceId, r.id!)
                        showSuccess(t('detail.ruleUnlinked'))
                        await load()
                      } catch (e) {
                        showError((e as Error).message)
                      }
                    }}
                  >
                    <LinkOffIcon />
                  </IconButton>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
