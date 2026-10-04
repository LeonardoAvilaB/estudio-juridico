import 'react-native-url-polyfill/auto'
import { useEffect, useState } from 'react'
import {
  NavigationContainer,
  DefaultTheme as NavClaro,
  DarkTheme as NavOscuro,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { supabase } from './src/lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { useFonts } from 'expo-font'
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display'
import { TouchableOpacity } from 'react-native'
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper'
import { espaciado } from './src/lib/theme'
import TemaProvider, { useTema } from './src/lib/TemaContext'
import ToastProvider from './src/components/ToastProvider'

import LoginScreen from './src/screens/LoginScreen'
import ClientesScreen from './src/screens/ClientesScreen'
import NuevoClienteScreen from './src/screens/NuevoClienteScreen'
import DetalleClienteScreen from './src/screens/DetalleClienteScreen'
import NuevoPagoScreen from './src/screens/NuevoPagoScreen'
import EditarClienteScreen from './src/screens/EditarClienteScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import NotasClienteScreen from './src/screens/NotasClienteScreen'
import PerfilScreen from './src/screens/PerfilScreen'
import PagosRecientesScreen from './src/screens/PagosRecientesScreen'
import ClientesPendientesScreen from './src/screens/ClientesPendientesScreen'
import EditarPagoScreen from './src/screens/EditarPagoScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

/**
 * Header negro con flecha dorada, compartido por los dos stacks y por el tab de
 * Perfil. El negro y el dorado son de marca y no se invierten en modo oscuro.
 */
function crearOpcionesHeader(colors, tipografia) {
  return {
    headerStyle: { backgroundColor: colors.oscuro },
    headerTintColor: colors.sobreOscuro,
    headerTitleStyle: tipografia.headerTitulo,
  }
}

function useOpcionesStack() {
  const { colors, tipografia } = useTema()

  return ({ navigation }) => ({
    ...crearOpcionesHeader(colors, tipografia),
    headerLeft: ({ canGoBack }) =>
      canGoBack ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: espaciado.sm }}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back-outline" size={26} color={colors.sobreOscuro} />
        </TouchableOpacity>
      ) : null,
  })
}

function ClientesStack() {
  const opcionesStack = useOpcionesStack()

  return (
    <Stack.Navigator screenOptions={opcionesStack}>
      <Stack.Screen name="Clientes" component={ClientesScreen} options={{ title: 'Mis Clientes' }} />
      <Stack.Screen name="NuevoCliente" component={NuevoClienteScreen} options={{ title: 'Nuevo Cliente' }} />
      <Stack.Screen name="DetalleCliente" component={DetalleClienteScreen} options={{ title: 'Detalle Cliente' }} />
      <Stack.Screen name="NuevoPago" component={NuevoPagoScreen} options={{ title: 'Registrar Pago' }} />
      <Stack.Screen name="EditarCliente" component={EditarClienteScreen} options={{ title: 'Editar Cliente' }} />
      <Stack.Screen name="NotasCliente" component={NotasClienteScreen} options={{ title: 'Notas del Caso' }} />
      <Stack.Screen name="EditarPago" component={EditarPagoScreen} options={{ title: 'Editar Pago' }} />
    </Stack.Navigator>
  )
}

function DashboardStack() {
  const opcionesStack = useOpcionesStack()

  return (
    <Stack.Navigator screenOptions={opcionesStack}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Resumen General' }} />
      <Stack.Screen name="PagosRecientes" component={PagosRecientesScreen} options={{ title: 'Pagos Recientes' }} />
      <Stack.Screen name="ClientesPendientes" component={ClientesPendientesScreen} options={{ title: 'Clientes Pendientes' }} />
    </Stack.Navigator>
  )
}

function TabNavigator() {
  const insets = useSafeAreaInsets()
  const { colors, tipografia, sombras } = useTema()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.navActivo,
        tabBarInactiveTintColor: colors.navInactivo,
        tabBarActiveBackgroundColor: colors.doradoFondo,
        tabBarStyle: {
          paddingBottom: insets.bottom || espaciado.sm,
          paddingTop: espaciado.xs,
          height: 70 + (insets.bottom || 0),
          backgroundColor: colors.navFondo,
          borderTopWidth: 1,
          borderTopColor: colors.dorado,
          ...sombras.nivel4,
        },
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarLabelStyle: tipografia.tabLabel,
      }}
    >
      <Tab.Screen
        name="ClientesTab"
        component={ClientesStack}
        options={{
          tabBarLabel: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Resumen',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={PerfilScreen}
        options={{
          tabBarLabel: 'Perfil',
          headerShown: true,
          title: 'Mi Perfil',
          ...crearOpcionesHeader(colors, tipografia),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

// Mapea la paleta de la app al esquema Material 3 que espera react-native-paper.
function crearTemaPaper(colors, esOscuro) {
  const base = esOscuro ? MD3DarkTheme : MD3LightTheme
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.oscuro,
      secondary: colors.dorado,
      background: colors.fondo,
      surface: colors.superficie,
      surfaceVariant: colors.superficieAlt,
      onPrimary: colors.sobreOscuro,
      onSecondary: colors.sobreDorado,
      onBackground: colors.texto,
      onSurface: colors.texto,
      onSurfaceVariant: colors.textoSuave,
      outline: colors.dorado,
      error: colors.error,
    },
  }
}

// Fondo de la navegación: evita el destello blanco entre pantallas en oscuro.
function crearTemaNavegacion(colors, esOscuro) {
  const base = esOscuro ? NavOscuro : NavClaro
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.fondo,
      card: colors.superficie,
      text: colors.texto,
      border: colors.borde,
      primary: colors.dorado,
    },
  }
}

function Raiz() {
  const { colors, esquema } = useTema()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const [fontsLoaded] = useFonts({
    'Ionicons': require('./assets/Ionicons.ttf'),
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (!fontsLoaded || loading) return null

  const esOscuro = esquema === 'oscuro'

  return (
    <PaperProvider theme={crearTemaPaper(colors, esOscuro)}>
      <SafeAreaProvider>
        <ToastProvider>
          {/* El header siempre es negro, así que los iconos de estado van claros. */}
          <StatusBar style="light" />
          <NavigationContainer theme={crearTemaNavegacion(colors, esOscuro)}>
            <Stack.Navigator>
              {session ? (
                <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
              ) : (
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </PaperProvider>
  )
}

export default function App() {
  return (
    <TemaProvider>
      <Raiz />
    </TemaProvider>
  )
}
