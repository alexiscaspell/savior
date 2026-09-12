import { useState } from 'react'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import HubIcon from '@mui/icons-material/Hub'
import CloudIcon from '@mui/icons-material/Cloud'
import RuleIcon from '@mui/icons-material/Rule'
import BoltIcon from '@mui/icons-material/Bolt'
import LabelIcon from '@mui/icons-material/Label'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Fade } from '@mui/material'

const DRAWER_WIDTH = 260

const navItems = [
  { path: '/services', label: 'Services', icon: <HubIcon /> },
  { path: '/sources', label: 'Sources', icon: <CloudIcon /> },
  { path: '/rules', label: 'Rules', icon: <RuleIcon /> },
  { path: '/actions', label: 'Actions', icon: <BoltIcon /> },
  { path: '/labels', label: 'Labels', icon: <LabelIcon /> },
  { path: '/pray', label: 'Pray', icon: <VolunteerActivismIcon /> },
]

export default function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(!isMobile)
  const navigate = useNavigate()
  const location = useLocation()

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 2 }}>
      <Box sx={{ px: 3, pb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            color: '#fff',
            letterSpacing: '-0.03em',
            fontFamily: '"Space Grotesk", sans-serif',
          }}
        >
          SAVIOR
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          Admin panel
        </Typography>
      </Box>
      <List sx={{ flex: 1 }}>
        {navItems.map((item) => {
          const selected = location.pathname.startsWith(item.path)
          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => {
                navigate(item.path)
                if (isMobile) setOpen(false)
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(12px)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setOpen((v) => !v)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {navItems.find((n) => location.pathname.startsWith(n.path))?.label || 'SAVIOR'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        <Fade in key={location.pathname} timeout={280}>
          <Box>
            <Outlet />
          </Box>
        </Fade>
      </Box>
    </Box>
  )
}
