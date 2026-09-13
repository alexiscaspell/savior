import { useState } from 'react'
import {
  AppBar,
  Box,
  Drawer,
  Fade,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import HubIcon from '@mui/icons-material/Hub'
import CloudIcon from '@mui/icons-material/Cloud'
import RuleIcon from '@mui/icons-material/Rule'
import BoltIcon from '@mui/icons-material/Bolt'
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import LabelIcon from '@mui/icons-material/Label'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import TranslateIcon from '@mui/icons-material/Translate'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { usePrefs } from '../i18n/PrefsContext'

const DRAWER_WIDTH = 260

export default function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(!isMobile)
  const navigate = useNavigate()
  const location = useLocation()
  const { mode, locale, toggleMode, toggleLocale, t } = usePrefs()
  const isDark = mode === 'dark'

  const navItems = [
    { path: '/services', label: t('nav.services'), icon: <HubIcon /> },
    { path: '/templates', label: t('nav.templates'), icon: <DashboardCustomizeIcon /> },
    { path: '/sources', label: t('nav.sources'), icon: <CloudIcon /> },
    { path: '/rules', label: t('nav.rules'), icon: <RuleIcon /> },
    { path: '/actions', label: t('nav.actions'), icon: <BoltIcon /> },
    { path: '/labels', label: t('nav.labels'), icon: <LabelIcon /> },
    { path: '/pray', label: t('nav.pray'), icon: <VolunteerActivismIcon /> },
  ]

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
          {t('app.admin')}
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
          bgcolor: isDark ? 'rgba(19, 32, 30, 0.82)' : 'rgba(255,255,255,0.72)',
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

          <Tooltip title={locale === 'es' ? t('lang.toEn') : t('lang.toEs')}>
            <IconButton onClick={toggleLocale} color="inherit" aria-label="toggle language">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TranslateIcon fontSize="small" />
                <Typography variant="caption" fontWeight={700} sx={{ minWidth: 18 }}>
                  {locale.toUpperCase()}
                </Typography>
              </Box>
            </IconButton>
          </Tooltip>

          <Tooltip title={isDark ? t('theme.toLight') : t('theme.toDark')}>
            <IconButton onClick={toggleMode} color="inherit" aria-label="toggle theme">
              {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
          </Tooltip>
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
        <Fade in key={`${location.pathname}-${locale}-${mode}`} timeout={280}>
          <Box>
            <Outlet />
          </Box>
        </Fade>
      </Box>
    </Box>
  )
}
