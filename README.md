# EDUCAMÁS · Fondo Educativo 2027-I · Plataforma V4.9

**Proyecto completo para Visual Studio Code + Vercel + Google Apps Script**  
Actualización de interfaz, cargos completos y proyecciones individuales de Filiales Grupo Vigía.

## Qué cambia en V4.8

### 1. Filiales Grupo Vigía: grupo e individuales

- Se siguen leyendo los **7 fondos originales**. Las seis filiales NO son seis fondos adicionales.
- En la vista de Filiales aparecen, separadas por empresa, las seis proyecciones de Google Sheets: `Proye · Pharitech`, `Proye · Phari SAS`, `Proye · Vigía Especial`, `Proye · Vlogic`, `Proye · Enérgika` y `Proye · Sin empresa`.
- La selección por empresa filtra la proyección individual y los informes respectivos. El grupo completo muestra la comparación por todas las filiales.
- Incluye: postulaciones por pagar, matrículas válidas, gastos administrativos, costo bruto conocido, alertas, pagos y simulación de aprobación final.
- **El saldo compartido de Filiales Grupo Vigía NO se reparte ni se descuenta repetidamente**. La donación neta se calcula solamente en `Proye-Filiales Vigía`.
- Los importes de matrícula aún no registrados o fuera del umbral se muestran como alertas; un costo parcial nunca debe presentarse como definitivo.

### 2. Cargos completos, sin agrupaciones artificiales

- La tabla **«Todos los cargos asociados»** incluye cada denominación de cargo registrada en la base maestra (sin agrupar bajo «Otros»).
- Permite ver todos los registros o solo formalizados activos, filtrar por texto y descargar el inventario en CSV.
- Los informes PDF y PowerPoint incluyen **un inventario completo, paginado**, de los cargos de su alcance; se conserva la distribución de la caracterización que ya existía.
- Para familiares, se usa el cargo del colaborador o acudiente, según la información disponible.

### 3. Interfaz y presentación

- Navegación, tarjetas, filtros, tablas y espacios ajustados para mejor legibilidad en escritorio y celular.
- Terminología y embudo de convocatoria presentados en línea con el informe histórico de Transportes Vigía **solo como referencia editorial**. No se copiaron las cifras ni comparativos 2026-II al período 2027-I.
- Se mantienen los capítulos previos: caracterización, antiguos/nuevos, seguimiento, motivaciones, convocatoria, estados de E, cartera, pagos, tarifas, simulación, anexos y descargas PDF/PPT por empresa, grupo y consolidado.

## Reglas que no se cambiaron

1. **Columna E** (`Estado`) = etapa pública de la postulación. La columna B (`Estado interno`) nunca se usa en los indicadores o informes de la plataforma.
2. **Columna A** (`Estado en el fondo`) = vigencia/elegibilidad del beneficio; no es la etapa de inscripción.
3. **Columna AY** = monto aproximado de matrícula; **BH** = importe efectivo de pago confirmado. No se confunden.
4. La tarifa administrativa se obtiene de la hoja de proyección del fondo; no se aplica una tarifa universal.
5. Los saldos al corte, los pagos, el fee y las recuperaciones se muestran para conciliación; no se vuelven a descontar por duplicado.
6. **No modificar fórmulas ni celdas de Google Sheets** como parte de esta instalación. Los registros en la base y los 7 fondos siguen intactos.

## Qué reemplazar en una instalación existente V4.6

**En Visual Studio Code / proyecto Vercel**:

- Reemplazar `public/index.html` (interfaz y armado de informes).
- Reemplazar `api/report.js` (exportador PDF y PowerPoint).
- Reemplazar `api/index.js` (compatibilidad con Apps Script V4.7; recomendado).
- `package.json` y `scripts/test-v48.js` son parte del proyecto completo y habilitan las pruebas nuevas.
- Mantener `server.js`, `vercel.json` y cualquier configuración privada propia.

**En Google Apps Script**:

- Si ya publicaste `Code.gs` V4.7 del paso anterior y su `testFilialesV47` pasó: **no necesitas volver a reemplazarlo**.
- Si aún usas V3.9, el archivo completo actualizado está en `apps-script/Code.gs`. Haz copia de seguridad, pega ese archivo en Apps Script, guarda, ejecuta `testFilialesV47` y **publica una nueva versión en la implementación existente**.
- La versión del servicio debe mostrar `4.7.0`. Si se genera otra URL de Apps Script, actualiza la variable correspondiente de tu `.env.local`/Vercel.

### No perder credenciales

**No reemplaces `.env.local` ni compartas tus claves.** El ZIP no contiene credenciales. Copia tu `.env.local` privado desde la carpeta que ya funcionaba.

### Ejecutar en local

```bash
npm install
npm run check
npm test
npm run dev
```

Abre `http://localhost:3000`. Comprueba:

- Filiales Grupo Vigía (grupo completo) y Pharitech (empresa individual).
- Cargos: todos los cargos, filtro de búsqueda y CSV.
- Informes PDF y PowerPoint de una filial, del grupo y del consolidado.
- Una empresa con personas `Pagado`: confirmar que fee y pago declarado se distinguen.

### Publicar a Vercel

Sube los tres archivos actualizados de la web (o este proyecto completo) a tu repositorio y despliega. **La publicación no se hace automáticamente desde la descarga del ZIP.** Mantén las variables de entorno que ya estaban configuradas en Vercel. Confirma que Apps Script V4.7 se está usando en producción antes de esperar las seis proyecciones en la web.

## Estructura

```text
EDUCAMAS_V4_8_FINAL_FILIALES_UX/
  public/index.html        Interfaz / informes completos
  api/index.js             Conexión y datos / compatibilidad V4.7
  api/report.js            Exportación PDF y PPTX
  apps-script/Code.gs      Servicio Apps Script V4.7 completo
  assets/a-color.png       Identidad gráfica del reporte
  scripts/                 Pruebas y utilidades
  .env.example             Modelo sin contraseñas
  server.js
  package.json
  vercel.json
  README.md
  QUE_REEMPLAZAR.txt
```

## Control de calidad

`npm run check` y `npm test` deben terminar sin errores. Las pruebas utilizan **datos ficticios** para exportación y regresión. No sustituyen la validación con la hoja real ni el despliegue en Vercel. Un indicador histórico del ejemplo de 2026-II no debe trasladarse como dato de 2027-I.


## V4.9 | Ajuste de términos del embudo (sin modificar cifras)

Fuente editorial: informe **«Transportes Vigía · Convocatoria Fondo Educativo 2026-II»**, págs. 2, 5, 11 y 12. Se conservan como términos institucionales: **Inscritos**, **Preaprobaciones Educamás**, **Aprobados**, **Matriculados (para histórico)**, **No preaprobados** y **Retiro de la empresa**.

En la base 2027-I los estados públicos son distintos. Se usan: **Inscritos con beneficio activo**, **Preaprobaciones Educamás**, **Aprobados / documentación completa sin pago**, **Matrículas pagadas**, y las novedades en un bloque separado. «Matrículas pagadas» procede de `E=Pagado` (no acredita matrícula académica). «No cumplen requisitos del fondo» procede del estado del beneficio y no presume un motivo, como antigüedad.

La primera cifra engloba todas las etapas desde Inscrito; las otras representan el **estado actual**, no el número histórico que transitó por cada etapa. Las novedades de retiros, no elegibilidad y graduación se separan del embudo. Esta revisión es **solo textual/visual**: no cambia el cálculo ni los datos.

**Reemplazar solamente** `public/index.html` y `api/report.js` al pasar de V4.8 a V4.9. `api/index.js`, Apps Script V4.7 y Google Sheets permanecen idénticos.
