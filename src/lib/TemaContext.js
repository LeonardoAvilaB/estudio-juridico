import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { temas } from './theme'

const CLAVE = 'preferenciaTema'

// 'sistema' sigue al ajuste del teléfono; 'claro' y 'oscuro' lo fuerzan.
export const PREFERENCIAS = [
  { id: 'sistema', label: 'Sistema', icono: 'phone-portrait-outline' },
  { id: 'claro', label: 'Claro', icono: 'sunny-outline' },
  { id: 'oscuro', label: 'Oscuro', icono: 'moon-outline' },
]

const TemaContext = createContext({ ...temas.claro, esquema: 'claro' })

export function useTema() {
  return useContext(TemaContext)
}

export default function TemaProvider({ children }) {
  const esquemaSistema = useColorScheme()
  const [preferencia, setPreferenciaEstado] = useState('sistema')
  const [cargada, setCargada] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((guardada) => {
        if (guardada && PREFERENCIAS.some((p) => p.id === guardada)) {
          setPreferenciaEstado(guardada)
        }
      })
      .finally(() => setCargada(true))
  }, [])

  function setPreferencia(id) {
    setPreferenciaEstado(id)
    AsyncStorage.setItem(CLAVE, id).catch(() => {})
  }

  const esquema = preferencia === 'sistema'
    ? (esquemaSistema === 'dark' ? 'oscuro' : 'claro')
    : preferencia

  const valor = useMemo(
    () => ({ ...temas[esquema], esquema, preferencia, setPreferencia }),
    [esquema, preferencia]
  )

  // Hasta saber la preferencia guardada no se pinta nada, para no mostrar un
  // destello del tema claro a quien eligió oscuro.
  if (!cargada) return null

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>
}
