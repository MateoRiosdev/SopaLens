# 🔎 SopaLens — Solver inteligente de sopas de letras

**SopaLens** es una plataforma web que reconoce letras en una imagen y encuentra palabras reales dentro de una sopa de letras o pupiletras. Marca las palabras en la cuadrícula y filtra los resultados con búsquedas como «Encuentra palabras que tengan C», «Animales», «En diagonal» o «De 5 letras».

## ✨ Características

- 📷 Subir o arrastrar imágenes JPG/PNG/WEBP y **recortar visualmente** la cuadrícula.
- 🔎 OCR con **Tesseract.js** que se ejecuta directamente en el navegador, sin subir imágenes a un servidor.
- 🧩 Buscar palabras en **8 direcciones** y resaltar posiciones exactas en colores.
- 🗣️ Búsqueda en lenguaje natural para filtros comunes; integración opcional con Gemini vía función del servidor.
- 🌐 Interfaz + OCR + vocabulario inicial para **español, inglés, portugués, francés, alemán, italiano, neerlandés y catalán**.
- 📚 Lista de palabras editable, más un pequeño diccionario temático por idioma para búsqueda automática.
- 🌗 Tema claro/oscuro, diseño responsive, selector de idioma y exportación PNG.
- 🧩 Modo **Crear pupiletras**: genera cuadrículas a partir de palabras, con tamaños de 8×8 a 20×20 y tres niveles de dificultad, mediante controles visuales personalizados.
- ✍️ Selección manual de letras en ambos modos; el generador incluye una vista previa de cuadrícula y controles adaptados a escritorio y móvil.
- 📥 Descarga la actividad sin respuestas o una versión con las respuestas resaltadas. El generador funciona localmente, sin API ni envío de palabras al servidor.
- 🔒 No requiere registro ni clave de API para OCR y búsqueda local.

## 🚀 Ejecutar localmente

Solo necesitas **Node.js 18+**. **No tienes que instalar dependencias**.

```bash
npm run dev
```

Visita **http://localhost:5173**.

También puedes utilizar cualquier servidor HTTP estático (GitHub Pages, `python -m http.server`, etc.). No abras `index.html` mediante `file://`, porque los módulos JavaScript y los workers de OCR necesitan un servidor HTTP.

Pruebas:

```bash
npm test
```

## 🤖 IA opcional (Gemini)

El OCR usa un modelo de reconocimiento de caracteres. Las búsquedas comunes se interpretan localmente mediante reglas sin IA generativa, y el algoritmo de cuadrícula comprueba todas las coincidencias, sin inventar palabras.

Para interpretar consultas *más complejas* con Gemini, despliega en **Vercel** y crea la variable de entorno **`GEMINI_API_KEY`** (se mantiene en el servidor). Puedes cambiar el modelo mediante `GEMINI_MODEL`. La función `api/interpret.js` solo recibe la consulta de texto, **no** la imagen. La disponibilidad, límites y costos del plan gratuito dependen del proveedor. Sin clave, los filtros locales siguen funcionando.

**Nunca pongas la clave en el código frontend ni la subas a GitHub**.

## 🎯 Importante sobre la precisión

- El OCR puede equivocarse con imágenes borrosas, rotadas, inclinadas, letras pegadas o con líneas superpuestas. **Edita la cuadrícula** si fuera necesario.
- Si dispones de la lista de palabras del ejercicio, introdúcela: la búsqueda será exhaustiva para esas palabras.
- Sin lista, la búsqueda automática utiliza un **vocabulario temático incorporado**, que es limitado: no pretende cubrir todas las palabras de ningún idioma. Puedes ampliar los diccionarios en `js/dictionary.js`.
- Las palabras encontradas están **verificadas letra a letra en la cuadrícula**; SopaLens no muestra palabras que el algoritmo no encuentre.
- El OCR y los diccionarios integrados están preparados para los ocho idiomas enumerados. El generador y la búsqueda exacta, en cambio, admiten palabras Unicode de otros sistemas de escritura (por ejemplo, chino y japonés), usando una casilla por grafema; las casillas vacías se completan con letras latinas A–Z. En japonés, introduce cada palabra completa en una línea (o separada por comas); no se realiza segmentación automática de frases en palabras. La precisión del OCR para esos idiomas no está incluida ni garantizada.
- La primera carga de OCR requiere acceso a internet para descargar el motor y el idioma (posteriormente el navegador puede reutilizar recursos en caché).

## 🧱 Estructura

```text
SopaLens/
├── index.html
├── styles.css
├── assets/favicon.svg
├── js/
│   ├── app.js             # Interfaz, eventos, dos modos, edición y exportación
│   ├── solver.js          # Búsqueda exacta en 8 direcciones + filtros
│   ├── generator.js       # Generador local de cuadrículas
│   ├── ocr.js             # Recorte y Tesseract.js
│   ├── dictionary.js      # Vocabularios temáticos por idioma
│   └── languages.js       # Traducciones de la UI y códigos OCR
├── api/interpret.js       # Gemini opcional (Vercel)
├── tests/generator.test.mjs
├── tests/solver.test.mjs
├── server.mjs             # Servidor local sin dependencias
└── vercel.json
```

## ☁️ Publicar

**GitHub:** crea un repositorio nuevo llamado `SopaLens` y sube el contenido de esta carpeta.

**Vercel:** importa el repositorio, elige framework **Other**, sin comando de compilación, con la carpeta raíz como directorio de salida. Las funciones dentro de `api/` se reconocerán en Vercel.

**GitHub Pages:** funciona toda la experiencia estática (OCR, solución, temas e idiomas); el endpoint de Gemini no se activa en GitHub Pages.

## Autor

© 2026 [**MateoRiosdev**](https://www.linkedin.com/in/mateojuliogomerorios/). Todos los derechos reservados.


## V2 — Recorte y Gemini por usuario

- Carga una foto, arrastra para recortar exclusivamente la cuadrícula dentro del modal. Cuenta filas y columnas y escríbelas antes de analizar. Las filas se procesan por separado para no concatenar letras de líneas distintas.
- **Importante:** el OCR no garantiza resultados perfectos con fotos torcidas, cuadrículas deformadas, letras borrosas o tamaños mal declarados. Se recomienda corregir manualmente la matriz desde «Editar cuadrícula». No se afirma validación OCR en todos los tipos de foto.
- El botón «Reiniciar recorte» elimina la selección y los resultados OCR anteriores y vuelve a abrir el recorte.
- La IA opcional para interpretar consultas complejas utiliza `GEMINI_API_KEY` configurada exclusivamente como variable de entorno del servidor en Vercel. No se introduce ni almacena una clave de Gemini en el navegador.
- La búsqueda de letras funciona sin Gemini (por ejemplo «Encuentra palabras con la letra C»).
- Banderas circulares proporcionadas por flagcdn.com; se necesita conexión para cargarlas. Para catalán se utiliza la bandera de España como referencia de región/idioma.

## Actualización del editor interactivo

Esta revisión añade:

- Corrección directa de letras desde la cuadrícula de la solución visual.
- Editor de cuadrícula por casillas individuales.
- Vista de la imagen original dentro del editor (dos columnas en escritorio y una en móvil).
- Lista de palabras mediante etiquetas que se agregan o eliminan sin comas.
- Búsqueda directa de una letra (resalta todas sus casillas) y de secuencias cortas como `LE`.
- Presentación de todas las apariciones de una palabra, aunque se repita o aparezca en distintas direcciones.
- Traducción de las direcciones de búsqueda según el idioma de la interfaz.

Ejecutar las pruebas con `npm test`.


## V6 — Crear pupiletras y sincronización de idioma

- Se añade el modo **Crear pupiletras**, con palabras personalizadas, tamaños de 8×8 a 20×20 y dificultades fácil, intermedia y difícil.
- El generador funciona en el navegador y permite descargar la cuadrícula limpia o la solución resaltada. Si alguna palabra no cabe, se informa en lugar de descartarla silenciosamente.
- Se elimina el acceso a Preferencias: el idioma y el tema se controlan desde el encabezado. El idioma de interfaz también determina el idioma del ejemplo, su lista de palabras y el OCR.
- El ejemplo se genera de forma reproducible y está localizado en los ocho idiomas admitidos.
- En móviles, los botones principales Subir imagen y Analizar imagen ocupan columnas de igual anchura; la descarga queda en una fila completa.
- Se retira el campo BYOK de Gemini del frontend; la clave, si se configura, permanece únicamente en el servidor.

Pruebas automatizadas: `npm test` (33 pruebas).


## V7 — Selección manual y escritura Unicode

- Las palabras del título «Crear pupiletras» utilizan el mismo degradado visual que el título principal.
- Se aumenta la legibilidad de los botones de modo en pantallas pequeñas.
- En el modo Resolver, la indicación y las acciones para editar la cuadrícula se sitúan debajo de «Restaurar ejemplo».
- En escritorio, al generar una actividad, el tablero queda a la izquierda y el formulario a la derecha; los títulos, botón de generación y aviso de privacidad quedan centrados.
- En ambos modos se pueden tocar o pulsar casillas para marcarlas manualmente y volver a pulsarlas para desmarcarlas.
- El generador y el buscador trabajan con grafemas Unicode: pueden colocar palabras en chino, japonés y otros sistemas de escritura, mientras las casillas de relleno usan A–Z. El OCR integrado sigue limitado a los ocho idiomas configurados.

Pruebas automatizadas: `npm test`.
