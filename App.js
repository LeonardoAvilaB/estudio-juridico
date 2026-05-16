import 'react-native-url-polyfill/auto'
import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from './src/lib/supabase'

import LoginScreen from './src/screens/LoginScreen'
import ClientesScreen from './src/screens/ClientesScreen'
import NuevoClienteScreen from './src/screens/NuevoClienteScreen'
import DetalleClienteScreen from './src/screens/DetalleClienteScreen'
import NuevoPagoScreen from './src/screens/NuevoPagoScreen'
import EditarClienteScreen from './src/screens/EditarClienteScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import NotasClienteScreen from './src/screens/NotasClienteScreen'
import PerfilScreen from './src/screens/PerfilScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function ClientesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Clientes" component={ClientesScreen} options={{ title: 'Mis Clientes' }} />
      <Stack.Screen name="NuevoCliente" component={NuevoClienteScreen} options={{ title: 'Nuevo Cliente' }} />
      <Stack.Screen name="DetalleCliente" component={DetalleClienteScreen} options={{ title: 'Detalle Cliente' }} />
      <Stack.Screen name="NuevoPago" component={NuevoPagoScreen} options={{ title: 'Registrar Pago' }} />
      <Stack.Screen name="EditarCliente" component={EditarClienteScreen} options={{ title: 'Editar Cliente' }} />
      <Stack.Screen name="NotasCliente" component={NotasClienteScreen} options={{ title: 'Notas del Caso' }} />
    </Stack.Navigator>
  )
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1a1a2e',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: { paddingBottom: 35, height: 85 },
        tabBarHideOnKeyboard: true,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="ClientesTab"
        component={ClientesStack}
        options={{ tabBarLabel: 'Clientes', tabBarIcon: ({ color }) => <TabIcon icon="👥" color={color} /> }}
      />
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Resumen', tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} /> }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={PerfilScreen}
        options={{ tabBarLabel: 'Perfil', tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }}
      />
    </Tab.Navigator>
  )
}

function TabIcon({ icon }) {
  return <Text style={{ fontSize: 20 }}>{icon}</Text>
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return null

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {session ? (
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}