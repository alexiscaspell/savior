import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Fade,
  Chip,
} from '@mui/material'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { prayApi } from '../api/pray'
import { servicesApi } from '../api/services'
import type { PrayResponse, Service } from '../types/models'
import { PageHeader, useToast } from '../components/PageHeader'

export default function PrayPage() {
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState<number | ''>('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [fast, setFast] = useState(false)
  const [paramsJson, setParamsJson] = useState('{}')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PrayResponse | null>(null)
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    servicesApi
      .list()
      .then(setServices)
      .catch((e) => showError((e as Error).message))
  }, [showError])

  const run = async () => {
    let params: Record<string, unknown>
    try {
      params = JSON.parse(paramsJson)
    } catch {
      showError('JSON de params inválido')
      return
    }
    if (!serviceId) {
      showError('Seleccioná un service')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const payload: Parameters<typeof prayApi.pray>[0] = {
        service_id: serviceId as number,
        fast,
        params,
      }
      if (sourceFilter.trim()) {
        payload.source = sourceFilter.trim()
      }
      const res = await prayApi.pray(payload)
      setResult(res)
      showSuccess('Pray ejecutado')
    } catch (e) {
      showError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Pray"
        subtitle="Evaluá rules de un service y ejecutá consecuencias"
      />

      <Paper elevation={1} sx={{ p: 3, mb: 3, maxWidth: 720 }}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Service</InputLabel>
            <Select
              label="Service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value as number)}
            >
              {services.map((s) => (
                <MenuItem key={s.id} value={s.id!}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Filtro source (opcional)"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={<Checkbox checked={fast} onChange={(e) => setFast(e.target.checked)} />}
            label="Fast (cortar al primer match)"
          />
          <TextField
            label="Params (JSON)"
            value={paramsJson}
            onChange={(e) => setParamsJson(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
          />
          <Button
            variant="contained"
            size="large"
            startIcon={<VolunteerActivismIcon />}
            onClick={run}
            disabled={loading}
            sx={{ alignSelf: 'flex-start' }}
          >
            {loading ? 'Orando…' : 'Pray'}
          </Button>
        </Stack>
      </Paper>

      <Fade in={Boolean(result)}>
        <Box>
          {result && (
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Resultado · {result.service}
              </Typography>
              {(result.rules || []).length === 0 && (
                <Typography color="text.secondary">Ninguna rule matcheó.</Typography>
              )}
              <Stack spacing={2}>
                {(result.rules || []).map((r, i) => (
                  <Paper key={`${r.name}-${i}`} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Chip label={r.name} color="primary" />
                      <Typography variant="caption" color="text.secondary">
                        {r.consequences?.length || 0} consequence(s)
                      </Typography>
                    </Stack>
                    <Stack spacing={1}>
                      {(r.consequences || []).map((c, j) => (
                        <Box
                          key={j}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(13,148,136,0.06)',
                          }}
                        >
                          <Typography variant="subtitle2">{c.action}</Typography>
                          <Box component="pre" sx={{ m: 0, mt: 0.5, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                            {typeof c.result === 'string' ? c.result : JSON.stringify(c.result, null, 2)}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}
        </Box>
      </Fade>
    </>
  )
}
