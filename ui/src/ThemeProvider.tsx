import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'

const theme = createTheme()

const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <MUIThemeProvider theme={theme}>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {children}
    </LocalizationProvider>
  </MUIThemeProvider>
)

export default ThemeProvider
