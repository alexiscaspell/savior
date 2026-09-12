import { Alert, Box, Button, Snackbar, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useState, createContext, useContext, type ReactNode } from 'react'

type ToastCtx = { showError: (msg: string) => void; showSuccess: (msg: string) => void }
const ToastContext = createContext<ToastCtx>({ showError: () => {}, showSuccess: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [severity, setSeverity] = useState<'success' | 'error'>('success')

  const show = (m: string, s: 'success' | 'error') => {
    setMsg(m)
    setSeverity(s)
    setOpen(true)
  }

  return (
    <ToastContext.Provider
      value={{ showError: (m) => show(m, 'error'), showSuccess: (m) => show(m, 'success') }}
    >
      {children}
      <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)}>
        <Alert severity={severity} onClose={() => setOpen(false)} variant="filled" sx={{ borderRadius: 3 }}>
          {msg}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}

export function PageHeader({
  title,
  subtitle,
  onCreate,
  createLabel = 'Nuevo',
}: {
  title: string
  subtitle?: string
  onCreate?: () => void
  createLabel?: string
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h4" gutterBottom={Boolean(subtitle)}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {onCreate && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
          {createLabel}
        </Button>
      )}
    </Stack>
  )
}
