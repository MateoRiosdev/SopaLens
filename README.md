# 🔎 SopaLens — Solver inteligente de sopas de letras

**SopaLens** es una plataforma web que reconoce letras en una imagen y encuentra palabras reales dentro de una sopa de letras o pupiletras. Marca las palabras en la cuadrícula y filtra los resultados con búsquedas como «Encuentra palabras que tengan C», «Animales», «En diagonal» o «De 5 letras».

## ✨ Características

- 📷 Subir o arrastrar imágenes JPG/PNG/WEBP y **recortar visualmente** la cuadrícula.
- 🔎 OCR con **Tesseract.js** que se ejecuta directamente en el navegador, sin subir imágenes a un servidor.
- 🧩 Buscar palabras en **8 direcciones** y resaltar posiciones exactas en colores.
- 🗣️ Búsqueda en lenguaje natural para filtros comunes; integración opcional con Gemini vía función del servidor.
- 🌐 Interfaz + OCR + vocabulario inicial para **español, inglés, portugués, francés, alemán, italiano, neerlandés y catalán**.
- 📚 Lista de palabras editable, más un pequeño diccionario temático por idioma para búsqueda automática.
- 🌗 Tema claro/oscuro, diseño responsive, controles personalizados y exportación PNG.
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
- Idiomas con alfabetos no latinos no están incluidos en esta primera versión.
- La primera carga de OCR requiere acceso a internet para descargar el motor y el idioma (posteriormente el navegador puede reutilizar recursos en caché).

## 🧱 Estructura

```text
SopaLens/
├── index.html
├── styles.css
├── assets/favicon.svg
├── js/
│   ├── app.js             # Interfaz, eventos, tema, edición y exportación
│   ├── solver.js          # Búsqueda exacta en 8 direcciones + filtros
│   ├── ocr.js             # Recorte y Tesseract.js
│   ├── dictionary.js      # Vocabularios temáticos por idioma
│   └── languages.js       # Traducciones de la UI y códigos OCR
├── api/interpret.js       # Gemini opcional (Vercel)
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
- Puedes introducir tu propia Gemini API key desde Preferencias. Solo existe en la memoria de la pestaña y se envía directamente a la API oficial de Google si la consulta no se reconoce localmente. **La clave puede quedar expuesta al propio navegador, extensiones o registros de red y está sujeta a las cuotas de tu cuenta; restringe la clave al uso permitido.** Para un entorno de alta seguridad usa un backend autenticado con cuotas y control por usuario.
- La búsqueda de letras funciona sin Gemini (por ejemplo «Encuentra palabras con la letra C»).
- Banderas circulares proporcionadas por flagcdn.com; se necesita conexión para cargarlas. Para catalán se utiliza la bandera de España como referencia de región/idioma.
