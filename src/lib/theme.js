import { Platform, StyleSheet } from 'react-native'

/**
 * Colores de marca y de estado: son los mismos en claro y en oscuro, salvo que
 * los de estado se aclaran un poco sobre fondo negro para no perder contraste.
 */
const marca = {
  dorado: '#C9A84C',
  doradoClaro: '#E8C97A',
  // Superficies oscuras de la marca: header, tab bar, hero, botón primario.
  // No se invierten en modo oscuro, son parte de la identidad.
  oscuro: '#1A1A1A',
  oscuroSuave: '#2A2A2A',
  // Texto e iconos sobre una superficie oscura o de color.
  sobreOscuro: '#FFFFFF',
  // Texto e iconos sobre el dorado.
  sobreDorado: '#1A1A1A',
  // Rojo de error legible sobre una superficie oscura: el #e74c3c del tema
  // claro queda apagado sobre negro.
  errorSobreOscuro: '#ff6f61',
  grisGrafico: '#444444',
  violeta: '#8e44ad',
  grisInactivo: '#95a5a6',
  overlay: 'rgba(0,0,0,0.6)',
  sombra: '#000000',
}

const fondosTenues = {
  exitoFondo: 'rgba(39, 174, 96, 0.12)',
  errorFondo: 'rgba(231, 76, 60, 0.12)',
  advertenciaFondo: 'rgba(243, 156, 18, 0.12)',
  infoFondo: 'rgba(41, 128, 185, 0.12)',
  doradoFondo: 'rgba(201, 168, 76, 0.12)',
}

/**
 * Las dos paletas. Los nombres son roles y no colores ("texto", "superficie")
 * justamente porque en oscuro el texto ya no es negro: un token llamado `negro`
 * que en oscuro vale casi blanco es una trampa.
 */
export const paletas = {
  claro: {
    ...marca,
    ...fondosTenues,
    esquema: 'claro',

    // Fondo de pantalla y superficies
    fondo: '#F5F5F5',
    superficie: '#FFFFFF',
    // En claro la jerarquía la dan las sombras, así que no cambia con la altura.
    superficieElevada: '#FFFFFF',
    // Panel tenue dentro de una card (buscadores, cajas de dato, tracks)
    superficieAlt: '#F5F5F5',

    // Texto
    texto: '#1A1A1A',
    textoSuave: '#6B6B6B',

    // Bordes, divisores y relleno de los skeletons
    borde: '#DDDDDD',

    // Dorado para TEXTO E ICONOS sobre superficie clara.
    //
    // El dorado de marca (#C9A84C) da 2.29:1 sobre blanco, muy por debajo del
    // mínimo legible de 4.5:1; este tono da 4.8:1 y se lee como el mismo color.
    // Sobre fondo oscuro no hace falta, así que allá vale el dorado de marca.
    //
    // Para volver al dorado de marca en texto, alcanza con cambiar esta línea.
    doradoTexto: '#8A6F1F',

    // Estado
    exito: '#27ae60',
    error: '#e74c3c',
    advertencia: '#f39c12',
    info: '#2980b9',

    // Navegación
    navFondo: marca.oscuro,
    navActivo: marca.dorado,
    navInactivo: '#666666',

    // Inputs
    inputFondo: '#FFFFFF',
    inputBorde: '#DDDDDD',
    inputPlaceholder: '#999999',
  },

  oscuro: {
    ...marca,
    ...fondosTenues,
    esquema: 'oscuro',

    fondo: '#121212',
    superficie: '#1E1E1E',
    // Sobre negro una sombra casi no se ve, así que la elevación se expresa
    // aclarando la superficie, como hace Material en tema oscuro.
    superficieElevada: '#242424',
    superficieAlt: '#2A2A2A',

    texto: '#ECECEC',
    textoSuave: '#9E9E9E',

    borde: '#3A3A3A',
    // Sobre negro el dorado de marca ya contrasta de sobra (7.29:1).
    doradoTexto: marca.dorado,

    // Aclarados: los tonos de estado del modo claro no llegan al contraste
    // mínimo sobre una superficie de #1E1E1E.
    exito: '#2ecc71',
    error: '#ff6f61',
    advertencia: '#f5b041',
    info: '#5dade2',

    navFondo: '#0D0D0D',
    navActivo: marca.dorado,
    navInactivo: '#7A7A7A',

    inputFondo: '#1E1E1E',
    inputBorde: '#3A3A3A',
    inputPlaceholder: '#7A7A7A',
  },
}

export const espaciado = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const radios = {
  xs: 2,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  pill: 999,
}

/**
 * Familias tipográficas.
 *
 * La marca es un estudio jurídico, así que los títulos y las cifras van en una
 * serif de contraste alto (Playfair Display) y el texto de lectura queda en la
 * sans del sistema, que es más legible en tamaños chicos y no cuesta descarga.
 *
 * Al usar una familia con el peso en el nombre NO se declara `fontWeight`:
 * Android lo ignora y iOS puede no encontrar la variante, así que el peso lo
 * define el archivo.
 */
export const fuentes = {
  serifBold: 'PlayfairDisplay_700Bold',
  serifSemi: 'PlayfairDisplay_600SemiBold',
}

/**
 * Playfair usa cifras de ancho proporcional, así que en una columna de montos el
 * 1 ocupa menos que el 8 y los separadores de miles no quedan alineados.
 * `tabular-nums` fuerza el ancho fijo. Si la fuente no trae esa característica
 * la propiedad simplemente no hace nada, así que no hay riesgo.
 */
const CIFRAS = { fontVariant: ['tabular-nums'] }

/** Escala tipográfica. Depende de la paleta porque incluye el color. */
function crearTipografia(c) {
  return {
    // --- Serif: títulos y cifras ---
    heroCifra: { fontSize: 32, fontFamily: fuentes.serifBold, color: c.dorado, ...CIFRAS },
    display: { fontSize: 26, fontFamily: fuentes.serifBold, color: c.texto, ...CIFRAS },
    titulo: { fontSize: 21, fontFamily: fuentes.serifBold, color: c.texto },
    subtitulo: { fontSize: 18, fontFamily: fuentes.serifBold, color: c.texto },
    // El color del título del header lo pone headerTintColor
    headerTitulo: { fontSize: 18, fontFamily: fuentes.serifBold },
    tituloModal: { fontSize: 19, fontFamily: fuentes.serifBold, color: c.texto },
    seccion: { fontSize: 16, fontFamily: fuentes.serifSemi, color: c.texto },
    nombreCard: { fontSize: 17, fontFamily: fuentes.serifSemi, color: c.texto },
    monto: { fontSize: 17, fontFamily: fuentes.serifBold, color: c.texto, ...CIFRAS },
    montoPequeno: { fontSize: 15, fontFamily: fuentes.serifSemi, color: c.texto, ...CIFRAS },
    // Lockup de la marca en el login
    marca: { fontSize: 23, fontFamily: fuentes.serifBold, letterSpacing: 3, color: c.dorado },

    // --- Sans del sistema: interfaz y lectura ---
    heroEtiqueta: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, color: c.doradoClaro },
    tabLabel: { fontSize: 12, fontWeight: '600' },
    cuerpo: { fontSize: 15, color: c.texto },
    cuerpoFuerte: { fontSize: 15, fontWeight: '600', color: c.texto },
    parrafo: { fontSize: 14, color: c.texto, lineHeight: 20 },
    detalle: { fontSize: 14, color: c.textoSuave },
    etiqueta: { fontSize: 13, color: c.texto },
    etiquetaFuerte: { fontSize: 13, fontWeight: '600', color: c.texto },
    secundario: { fontSize: 12, color: c.textoSuave },
    micro: { fontSize: 11, color: c.textoSuave },
    dorado: { fontSize: 14, fontWeight: 'bold', color: c.dorado },
  }
}

/**
 * `elevation` solo existe en Android y las props `shadow*` solo en iOS, así que
 * una card declarada con una sola de las dos se ve plana en las demás
 * plataformas. Esto emite lo que corresponde en cada una.
 *
 * Ojo: en Android la sombra la recorta `overflow: 'hidden'`. Para el detalle en
 * dorado del costado de las cards usamos `borderLeftWidth` en vez de una View
 * hija, justamente para no necesitar recortar.
 */
function sombra(c, { y, blur, opacity, elevation }) {
  // Sobre fondo oscuro una sombra negra casi no se ve, así que se refuerza.
  const alfa = c.esquema === 'oscuro' ? Math.min(opacity * 2.2, 0.6) : opacity

  if (Platform.OS === 'web') {
    return { boxShadow: `0px ${y}px ${blur}px rgba(0, 0, 0, ${alfa})` }
  }
  if (Platform.OS === 'android') {
    return { elevation, shadowColor: c.sombra }
  }
  return {
    shadowColor: c.sombra,
    shadowOffset: { width: 0, height: y },
    shadowRadius: blur,
    shadowOpacity: alfa,
  }
}

function crearSombras(c) {
  return {
    // Ítems de lista, cards secundarias
    nivel1: sombra(c, { y: 1, blur: 3, opacity: 0.08, elevation: 1 }),
    // Card estándar
    nivel2: sombra(c, { y: 2, blur: 6, opacity: 0.1, elevation: 2 }),
    // Card destacada / hero
    nivel3: sombra(c, { y: 4, blur: 12, opacity: 0.12, elevation: 4 }),
    // Modales y elementos flotantes
    nivel4: sombra(c, { y: 8, blur: 24, opacity: 0.18, elevation: 10 }),
  }
}

/**
 * Los dos temas completos, creados una sola vez. Que su identidad sea estable
 * es lo que permite cachear las hojas de estilo por tema en `crearEstilos`.
 */
export const temas = {
  claro: {
    colors: paletas.claro,
    tipografia: crearTipografia(paletas.claro),
    sombras: crearSombras(paletas.claro),
  },
  oscuro: {
    colors: paletas.oscuro,
    tipografia: crearTipografia(paletas.oscuro),
    sombras: crearSombras(paletas.oscuro),
  },
}

/**
 * Declara una hoja de estilos que depende del tema.
 *
 * `StyleSheet.create` a nivel de módulo congela los colores al importar, que es
 * la razón por la que antes no se podía cambiar de tema en caliente. Esto crea
 * una hoja por paleta y la reutiliza, así el render no paga nada.
 *
 *   const usarEstilos = crearEstilos((colors, tipografia, sombras) => ({ ... }))
 *   // dentro del componente:
 *   const { colors, tipografia, sombras } = useTema()
 *   const styles = usarEstilos(colors, tipografia, sombras)
 */
export function crearEstilos(definir) {
  const cache = new Map()
  return (colors, tipografia, sombras) => {
    let hoja = cache.get(colors)
    if (!hoja) {
      hoja = StyleSheet.create(definir(colors, tipografia, sombras))
      cache.set(colors, hoja)
    }
    return hoja
  }
}

// Mínimo recomendado para un área táctil.
export const TOUCH_MIN = 44
