import { useCallback, useEffect, useState } from 'react'
import {
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useNavigate } from 'react-router-dom'
import { servicesApi } from '../api/services'
import type { Service } from '../types/models'
import { PageHeader, useToast } from '../components/PageHeader'
import ServiceFormDialog from '../components/ServiceFormDialog'
import ConfirmDialog from '../components/ConfirmDialog'

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [toDelete, setToDelete] = useState<Service | null>(null)
  const { showError, showSuccess } = useToast()
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      setItems(await servicesApi.list())
    } catch (e) {
      showError((e as Error).message)
    }
  }, [showError])

  useEffect(() => {
    load()
  }, [load])

  const save = async (svc: Service) => {
    try {
      if (svc.id) {
        await servicesApi.update(svc.id, svc)
        showSuccess('Service actualizado')
      } else {
        await servicesApi.create(svc)
        showSuccess('Service creado')
      }
      await load()
    } catch (e) {
      showError((e as Error).message)
      throw e
    }
  }

  const confirmDelete = async () => {
    if (!toDelete?.id) return
    try {
      await servicesApi.remove(toDelete.id)
      showSuccess('Service eliminado')
      setToDelete(null)
      await load()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        title="Services"
        subtitle="Contenedores de sources, rules y variables"
        onCreate={() => {
          setEditing(null)
          setDialogOpen(true)
        }}
        createLabel="Nuevo service"
      />
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Sources</TableCell>
              <TableCell>Rules</TableCell>
              <TableCell>Labels</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id} hover sx={{ transition: 'background-color 0.2s' }}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.sources?.length || 0}</TableCell>
                <TableCell>{s.rules?.length || 0}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {(s.labels || []).map((l) => (
                      <Chip key={l} label={l} size="small" color="primary" variant="outlined" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Ver detalle">
                    <IconButton onClick={() => navigate(`/services/${s.id}`)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton
                      onClick={() => {
                        setEditing(s)
                        setDialogOpen(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" onClick={() => setToDelete(s)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay services todavía
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ServiceFormDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onSave={save}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar service"
        message={`¿Eliminar "${toDelete?.name}"? Se desasociarán sources y rules.`}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
