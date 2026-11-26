# Educamás 2027-I · reparación de datos y código V5.3.5

## Qué se corrigió directamente en Google Sheets

En el libro **Base_2027 - I**, ID `1TkVBmU6NOCVpPkSdAUpXeUREAclVdWQnquJNh7y-bZE`, se actualizaron **únicamente** las fórmulas `A3` de las 19 pestañas `Estudiantes-[Empresa]`.

Las nuevas fórmulas identifican **Grupo, Empresa y Nombre** mediante los encabezados de `Financiero2027-1` (fila 2), en lugar de suponer que siempre están en F o G. `A1` sigue identificando el grupo o empresa independiente y `B1` la filial cuando la hay. Los datos de origen y sus validaciones no se editaron.

Se compararon los 19 resultados con la fuente: los **208 registros** aparecen en sus siete fondos/grupos principales y cada filial recibe solo sus propios registros. Hay **19 proyecciones** `Proye-` vinculadas a sus pares `Estudiantes-`; las fórmulas financieras C24:C28, F24:F28, C30/F30, C31/F31 y C33/F33 ya compartían el mismo patrón y no requerían cambios. Se conservaron todas las cifras manuales, etiquetas financieras, tarifas y proyecciones.

**Respaldo del libro antes de la intervención**: https://docs.google.com/spreadsheets/d/1U1403Va48pxacpY4MfjzKIYiSUHtssfpkfXM7XVm3WU/edit

## Código que SÍ debes reemplazar

**`apps-script/Code.gs`**, en el proyecto existente de Google Apps Script vinculado con el informe. Esta nueva versión `5.3.5` lee **Grupo** y **Empresa** por sus encabezados, sin asumir que F/G estén en un orden fijo. El resto de las columnas, privacidad de `Estado interno`, filtros y cálculos BI/BU permanece igual.

1. Abre la implementación **existente** de Google Apps Script.
2. Copia todo el contenido de este paquete: `apps-script/Code.gs` al archivo `Code.gs` del editor.
3. Conserva la propiedad privada `API_TOKEN` (no cambies su valor ni lo incluyas en el código).
4. Ejecuta la función `testConnection()` para comprobar lectura, grupo y proyecciones. La respuesta debe indicar 208 registros (o la cantidad actualizada en la fuente) y 19 proyecciones, sin faltantes.
5. En **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**, actualiza la implementación actual. Si conservas el mismo `/exec`, normalmente no es necesario cambiar `APPS_SCRIPT_URL` en Vercel.
6. En la plataforma, pulsa **Actualizar**; comprueba global, una empresa independiente (Residere), un grupo completo (Grupo Falic) y una filial (GWS); usa **Confirmar empresa / grupo** y verifica las descargas.

## Archivos que NO necesitas reemplazar

Si ya funciona la interfaz **V5.3.4**, no necesitas volver a reemplazar `public/index.html`, `api/index.js` ni `api/report.js`. Los incluimos en el ZIP solo para disponer de un proyecto completo consistente. `public/index.html` conserva la misma lógica, solo se actualizó un comentario sobre Grupo y Empresa.

No sobrescribas `.env.local` ni cambies contraseñas o tokens.

## Cómo verificar el código local

```bash
npm ci
npm run check
npm test
```

Las pruebas usan datos simulados para validar **ambos órdenes posibles de las columnas F/G**, además de filtros, empresa independiente, filial, simulador y PDF/PPTX. El resultado de la conexión a la Google Sheets real se verifica con `testConnection()` tras la publicación.

## Datos financieros que aún dependen de diligenciamiento

Las empresas con BM, BN, BO, BI o BU sin diligenciar pueden mostrar `0` o `Pendiente` en las proyecciones, aunque sus estudiantes sí estén presentes. En particular, hay un registro marcado **Pagado** en Residere cuyo valor final **BU** está vacío. No se inventó ese importe ni se modificó la fuente. Las cifras 2026-II y las tarifas manuales se conservan tal como están.
