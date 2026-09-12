import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { forwardRef } from 'react'
import { usePrefs } from '../i18n/PrefsContext'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onClose: () => void
}) {
  const { t } = usePrefs()
  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} keepMounted>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
