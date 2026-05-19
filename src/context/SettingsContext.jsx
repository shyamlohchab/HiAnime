import { createContext, useContext, useState, useEffect } from 'react'
import { getSettings, saveSettings } from '../utils/localStorage'

const SettingsContext = createContext(null)

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(getSettings())

  const update = (key, value) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
  }

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}
