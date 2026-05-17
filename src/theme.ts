import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366F1', // Indigo 500
      light: '#818CF8',
      dark: '#4F46E5',
    },
    secondary: {
      main: '#EC4899', // Pink 500
    },
    background: {
      default: '#0B0B0F',
      paper: '#16161E',
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "sans-serif"',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '12px',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            transition: 'all 0.3s ease',
            fieldset: {
              borderColor: 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366F1',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)',
            },
          },
        },
      },
    },
  },
});
