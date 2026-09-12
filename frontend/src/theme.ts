import { createTheme, type PaletteMode, type Theme } from '@mui/material/styles'

export function createAppTheme(mode: PaletteMode): Theme {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#0D9488',
        light: '#2DD4BF',
        dark: '#0F766E',
        contrastText: '#fff',
      },
      secondary: {
        main: '#0EA5E9',
        light: '#38BDF8',
        dark: '#0284C7',
      },
      background: isDark
        ? { default: '#0B1413', paper: '#13201E' }
        : { default: '#F0FDFA', paper: '#FFFFFF' },
      text: isDark
        ? { primary: '#E7F6F3', secondary: '#9BB5B0' }
        : { primary: '#134E4A', secondary: '#5B7A76' },
      divider: isDark ? 'rgba(45, 212, 191, 0.16)' : 'rgba(13, 148, 136, 0.12)',
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily: '"DM Sans", "Helvetica", "Arial", sans-serif',
      h4: {
        fontFamily: '"Space Grotesk", "DM Sans", sans-serif',
        fontWeight: 700,
      },
      h5: {
        fontFamily: '"Space Grotesk", "DM Sans", sans-serif',
        fontWeight: 650,
      },
      h6: {
        fontFamily: '"Space Grotesk", "DM Sans", sans-serif',
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isDark
              ? 'radial-gradient(ellipse at 0% 0%, rgba(13, 148, 136, 0.22) 0%, transparent 50%), radial-gradient(ellipse at 100% 0%, rgba(14, 165, 233, 0.14) 0%, transparent 45%)'
              : 'radial-gradient(ellipse at 0% 0%, rgba(45, 212, 191, 0.18) 0%, transparent 50%), radial-gradient(ellipse at 100% 0%, rgba(14, 165, 233, 0.12) 0%, transparent 45%)',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: 'box-shadow 0.25s ease, transform 0.25s ease, background-color 0.3s ease',
          },
          elevation1: {
            boxShadow: isDark
              ? '0 4px 20px rgba(0, 0, 0, 0.35)'
              : '0 4px 20px rgba(13, 148, 136, 0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            paddingInline: 18,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            boxShadow: '0 6px 16px rgba(13, 148, 136, 0.25)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: isDark
              ? '1px solid rgba(45, 212, 191, 0.14)'
              : '1px solid rgba(13, 148, 136, 0.1)',
            boxShadow: isDark
              ? '0 8px 28px rgba(0, 0, 0, 0.35)'
              : '0 8px 28px rgba(13, 148, 136, 0.08)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 18,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: 'none',
            background: isDark
              ? 'linear-gradient(180deg, #064E4A 0%, #0F766E 45%, #0C4A6E 100%)'
              : 'linear-gradient(180deg, #0F766E 0%, #0D9488 45%, #0EA5E9 100%)',
            color: '#fff',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            marginInline: 8,
            marginBlock: 2,
            transition: 'background-color 0.2s ease, transform 0.2s ease',
            '&.Mui-selected': {
              backgroundColor: 'rgba(255,255,255,0.18)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.24)',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.12)',
              transform: 'translateX(2px)',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'box-shadow 0.2s ease',
              '&.Mui-focused': {
                boxShadow: '0 0 0 3px rgba(13, 148, 136, 0.15)',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  })
}
