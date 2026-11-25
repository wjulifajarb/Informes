# Educamás · Informes dinámicos 2027-I · V5.0

Proyecto actualizado a partir del código existente. **No cambia ningún dato de Google Sheets**. Reemplaza la versión anterior que consumía `JULI-2027-1`, las antiguas pestañas `Proye · ...` y las posiciones de columnas de versiones previas.

## Estructura del proyecto

- `apps-script/Code.gs`: API privada de Apps Script; lectura de `Financiero2027-1` y de las 19 parejas `Estudiantes-[Empresa]` / `Proye-[Empresa]`.
- `public/index.html`: interfaz web de informes, filtros, tableros, pagos y descuentos, simulador local con saldo/tarifa modificables, vista previa y descargas individuales/consolidadas.
- `api/index.js`: proxy privado de Vercel/Node, controla acceso y entrega PDF/PPT.
- `api/report.js`: motor preexistente de PDF vectorial y PPTX editable, conservado sin cambios.
- `server.js` y `vercel.json`: servidor local y despliegue Vercel.
- `scripts/test-v5.js`, `scripts/test-report-v5.js`: pruebas sin acceso a datos personales.

## Fuentes y reglas

- `Financiero2027-1` (fila **2** de encabezados, alumnos desde fila **3**): vista global.
- `Estudiantes-[Empresa]` (encabezados fila 2): vista por fondo o filial, mediante la acción autenticada `scope`.
- `Proye-[Empresa]`: proyecciones e históricos exactos. Lee C6:C46, F20 y F24:F33, y cartera C38:C46. **Las filas 18 y 34 no se usan; no se lee nada desde la fila 48**.
- A = Estado en el fondo; B = Estado interno (**excluido por privacidad**); E = Estado; F = Empresa/fondo; G = Grupo/filial.
- L = Antiguo/Nuevo; M = Empleado/Familiar; AC / AF = cargo; U = motivación; BG = estado del caso; BH = «¿Sigue en base?».
- BI = Valor a Financiar; BM = Aprobación EducaMás; BN = Aprobación Empresa; BO = Status final; BP = Fecha de pago; BU = Valor final de pago de matrícula.
- C27 (matrículas base) y F27 (autorizadas, BI para pendientes y BU para anticipadas pagadas) **se leen de las fórmulas existentes**, no se reconstruyen manualmente en el frontend.
- Fondos principales (hijos de F) son el total del consolidado; subempresas/filiales (G) son desglose, **no se suman dos veces**.
- Si falta una cifra manual o la fórmula devuelve vacío, se muestra **«Pendiente»**; no se sustituye por cero ni se reparte entre filiales.
- El valor BU es **valor final registrado**, no prueba de conciliación bancaria. No se restan pagos otra vez del fondo.
- El embudo emplea estados que pueden superponerse, **no un embudo matemáticamente secuencial**.
- Los posibles descuentos de nómina se muestran desde BJ/BK/BD/BE/BF como **simulaciones y aportes declarados**, no como recaudos mensuales. No se inventa un calendario por falta de fechas/soportes de cuota confirmados.
- Antiguos con descuento (BT) no se consideran automáticamente «becados». La pregunta AX sobre educación superior de los padres tampoco prueba por sí sola que alguien sea estudiante de primera generación. No existe en las columnas confirmadas un dato específico de «valoración del beneficio»: la interfaz no inventa ese indicador.

## Reemplazo de archivos

1. Haz una copia de la carpeta anterior y conserva **tu archivo `.env.local`** en privado. El ZIP no incluye claves.
2. En Google Apps Script abre el proyecto asociado a la API, reemplaza el contenido de `Code.gs` por el archivo `apps-script/Code.gs` completo. Mantén la misma Propiedad de script `API_TOKEN` (mínimo 32 caracteres). Ejecuta `testScopes`, `testConnection`, `testFinance`.
3. En Apps Script: **Implementar → Administrar implementaciones → Editar → Nueva versión**. Si cambiaste la URL `/exec`, actualiza `APPS_SCRIPT_URL` en Vercel y `.env.local`.
4. En Visual Studio Code/Vercel reemplaza **`public/index.html`, `api/index.js`, `api/report.js`, `server.js`, `vercel.json`, `package.json`, `package-lock.json`, `scripts/`** por los del paquete. **No subas `.env.local`** ni tokens a GitHub. Si el `api/report.js` de tu proyecto actual contiene mejoras posteriores a V4.6 que no están en este respaldo, conserva el más reciente y valida las descargas antes de sustituirlo.
5. Localmente, con Node 22: `npm ci`, `npm run check`, `npm test`, `npm run dev`. Abre `http://localhost:3000`.
6. Compara la vista global, Transportes Vigía y una filial, abre su Proye- y valida C24:C33 y F24:F33. Prueba filtros por cargo, antiguos/nuevos, retiros, familia y pagos. Exporta PDF/PPT y CSV tanto individual como consolidado.

## Variables de entorno (servidor)

`APPS_SCRIPT_URL`, `APPS_SCRIPT_TOKEN`, `APP_PASSWORD`, `SESSION_SECRET`. Utiliza el archivo `.env.example` como plantilla de nombres; guarda los valores **solo** en `.env.local` y en los secretos de Vercel. Si los tokens existentes siguen funcionando, reutilízalos.

## Cambios respecto de la API anterior

- El GET de Apps Script indica versión **5.0.0**.
- Acciones POST autenticadas: `data` (global), `scope` (lectura específica `Estudiantes-*`), `finance` (compatibilidad), `diagnostic`.
- La interfaz obtiene los informes actuales desde `data` y vuelve a consultar antes de cada exportación. El reporte individual consulta también `scope`.
- `financialV34` y `financialSimple` siguen disponibles para integrar módulos existentes, ahora con `projections` y `rollup` en la nueva estructura.
- `Estado interno` no se envía a la página ni en CSV/PDF.

## Pruebas y limitación

Las pruebas incluidas verifican sintaxis, extracción de filas, BI/BU, exclusión de la columna B, subempresa/fondo y exportación de documentos con datos sintéticos. **No se ejecutó una publicación real de Apps Script/Vercel desde aquí** y los resultados del servidor aún deben validarse contra las fórmulas y permisos del libro en la implementación autorizada.
