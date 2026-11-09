# 🔎 SopaLens — Solver inteligente de sopas de letras

**SopaLens** es una plataforma web que reconoce letras en imágenes y encuentra palabras reales dentro de una sopa de letras o pupiletras. Resalta las coincidencias directamente en la cuadrícula y permite filtrar los resultados mediante criterios como «Palabras que contengan C», «En diagonal», «De 5 letras» o «Animales».

Además, permite crear pupiletras personalizados, resolverlos manualmente y descargar las actividades con o sin respuestas.

## ✨ Características principales

### 🔍 Resolver pupiletras

- 📷 Subir o arrastrar imágenes JPG, PNG y WEBP.
- ✂️ Recortar visualmente la cuadrícula antes de procesarla.
- 🔎 Reconocimiento óptico de caracteres (OCR) mediante **Tesseract.js**, ejecutado directamente en el navegador.
- 🧩 Buscar palabras en las **8 direcciones** y resaltar sus posiciones exactas con colores.
- 🔤 Editar manualmente las letras detectadas y corregir la cuadrícula.
- 📚 Introducir una lista personalizada de palabras o utilizar vocabularios temáticos incorporados.
- 🎯 Buscar letras individuales, secuencias cortas y todas las apariciones de una palabra.
- 🗣️ Filtrar resultados mediante consultas en lenguaje natural.

### 🧩 Crear pupiletras

- ✍️ Generar sopas de letras a partir de palabras personalizadas.
- 📐 Elegir tamaños de cuadrícula desde **8×8 hasta 20×20**.
- 🎚️ Seleccionar tres niveles de dificultad: fácil, intermedio y difícil.
- 🌐 Admitir caracteres Unicode y distintos sistemas de escritura mediante grafemas.
- 👆 Seleccionar manualmente las casillas para marcar o desmarcar letras.
- 📥 Descargar la actividad sin respuestas o con las soluciones resaltadas en PNG.
- 🔒 Generar las cuadrículas localmente, sin API ni envío de palabras a un servidor.

### 🌍 Idiomas y personalización

- Español 🇪🇸
- Inglés 🇬🇧
- Portugués 🇵🇹
- Francés 🇫🇷
- Alemán 🇩🇪
- Italiano 🇮🇹
- Neerlandés 🇳🇱
- Catalán 🏴

La interfaz, el OCR y los vocabularios iniciales están preparados para estos ocho idiomas.

También incluye:
- 🌗 Tema claro y oscuro.
- 📱 Diseño responsive para escritorio, tabletas y móviles.
- 🎨 Selectores desplegables personalizados.
- 🖼️ Exportación de resultados y actividades en PNG.

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de la plataforma |
| CSS3 | Diseño responsive y estilos |
| JavaScript | Lógica e interacción |
| Tesseract.js | Reconocimiento óptico de caracteres |
| Gemini API (opcional) | Interpretación de consultas complejas |
| Node.js | Servidor local |
| Vercel | Despliegue y función opcional de IA |

## 🚀 Ejecutar localmente

### Requisitos

- **Node.js 18 o superior**.
- No necesitas instalar dependencias adicionales.

### Instalación y ejecución

Clona el repositorio:

\`\`\`bash
git clone https://github.com/MateoRiosdev/SopaLens.git
cd SopaLens
\`\`\`

Inicia el servidor local:

\`\`\`bash
npm run dev
\`\`\`

Abre la siguiente dirección en tu navegador:

\`\`\`text
http://localhost:5173
\`\`\`

### Ejecutar pruebas

Para ejecutar las pruebas automatizadas:

\`\`\`bash
npm test
\`\`\`

También puedes utilizar cualquier servidor HTTP estático. No abras directamente `index.html` mediante `file://`, porque los módulos JavaScript y los workers del OCR necesitan un servidor HTTP.

## 🤖 IA opcional — Gemini

SopaLens no necesita inteligencia artificial generativa para reconocer las letras, resolver las cuadrículas ni aplicar los filtros comunes.

La búsqueda funciona mediante algoritmos locales que comprueban las coincidencias directamente en la matriz.

Para interpretar consultas más complejas mediante Gemini:

1. Despliega el proyecto en **Vercel**.
2. Configura la variable de entorno `GEMINI_API_KEY`.
3. Opcionalmente, establece `GEMINI_MODEL` para seleccionar el modelo.

La función `api/interpret.js` recibe únicamente el texto de la consulta, **no la imagen ni la cuadrícula**.

Sin una clave de Gemini, los filtros locales siguen funcionando.

> 🔐 Nunca coloques tu clave API en el código frontend ni la publiques en GitHub. La clave debe permanecer exclusivamente en las variables de entorno del servidor.

La disponibilidad, los límites y los posibles costos dependen del proveedor de IA.

## 🎯 Precisión y limitaciones

- El OCR puede equivocarse con imágenes borrosas, rotadas, inclinadas, deformadas o con letras superpuestas.
- Se recomienda revisar y corregir manualmente la cuadrícula cuando sea necesario.
- Si dispones de la lista de palabras del ejercicio, introdúcela para realizar una búsqueda exhaustiva de esas palabras.
- Sin una lista personalizada, la búsqueda automática utiliza vocabularios temáticos incorporados, que son limitados y no pretenden cubrir todas las palabras de un idioma.
- Las palabras encontradas se verifican letra a letra en la cuadrícula. No se muestran coincidencias que el algoritmo no haya encontrado.
- El OCR y los diccionarios incorporados están preparados para los ocho idiomas enumerados.
- El generador y la búsqueda exacta admiten palabras Unicode de otros sistemas de escritura, como chino y japonés, utilizando una casilla por grafema.
- Las casillas de relleno se completan con letras latinas A–Z. En japonés, introduce cada palabra completa en una línea o separada por comas; no se realiza segmentación automática de frases.
- La precisión del OCR para idiomas distintos de los ocho configurados no está garantizada.
- La primera carga del OCR necesita conexión a internet para descargar el motor y los datos del idioma. El navegador puede reutilizar estos recursos posteriormente mediante la caché.

## 🧱 Estructura del proyecto

```text
SopaLens/
├── index.html
├── styles.css
├── package.json
├── server.mjs
├── vercel.json
│
├── assets/
│   └── favicon.svg
│
├── js/
│   ├── app.js
│   ├── solver.js
│   ├── generator.js
│   ├── ocr.js
│   ├── dictionary.js
│   └── languages.js
│
├── api/
│   └── interpret.js
│
└── tests/
    ├── generator.test.mjs
    └── solver.test.mjs
```
    
### Descripción de los módulos

- `app.js`: interfaz, eventos, modos de trabajo, edición y exportación.
- `solver.js`: búsqueda exacta en ocho direcciones y filtros.
- `generator.js`: generación local de cuadrículas.
- `ocr.js`: recorte de imágenes y reconocimiento mediante Tesseract.js.
- `dictionary.js`: vocabularios temáticos por idioma.
- `languages.js`: traducciones de la interfaz y códigos de OCR.
- `api/interpret.js`: integración opcional con Gemini para Vercel.

## ☁️ Despliegue

### Vercel

1. Importa el repositorio de GitHub.
2. Selecciona **Other** como Framework Preset.
3. Utiliza `.` como Root Directory.
4. Deja vacíos los comandos de compilación, instalación y directorio de salida.
5. Configura `GEMINI_API_KEY` únicamente si deseas habilitar la interpretación opcional con Gemini.

Vercel reconocerá automáticamente la función ubicada en `api/interpret.js`.

### GitHub Pages

La experiencia estática también puede publicarse mediante GitHub Pages. Las funcionalidades locales de OCR, resolución, generación, idiomas y temas pueden utilizarse sin el endpoint de Gemini.

## 🔒 Privacidad

- No requiere registro de usuario.
- No necesita una clave API para resolver o generar pupiletras.
- El procesamiento OCR se ejecuta en el navegador.
- La cuadrícula y las palabras del generador se procesan localmente.
- La función opcional de Gemini recibe solamente el texto de la consulta.

## 👨‍💻 Autor

Desarrollado por **[MateoRiosdev](https://github.com/MateoRiosdev)**.

- GitHub: [MateoRiosdev](https://github.com/MateoRiosdev)
- LinkedIn: [Mateo Julio Gomero Rios](https://www.linkedin.com/in/mateojuliogomerorios/)

© 2026 MateoRiosdev. Todos los derechos reservados.
