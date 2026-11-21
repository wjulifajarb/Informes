# Educamás · Informes educativos 2027-I · V3.9

**Actualización completa del proyecto de Visual Studio Code y del Apps Script independiente.**

## Por qué se produjo el mensaje “Faltan los datos financieros de Apps Script”

La interfaz puede recibir los registros de `JULI-2027-1` desde una implementación anterior del Apps Script **sin** recibir `financialV34`, que contiene los siete fondos y las cifras de `Proye-Residere`. V3.9 incorpora identificación de versión (`apiVersion`), acción autenticada `finance`, consulta de respaldo desde `api/index.js` y aviso inmediato si sigue faltando el bloque. **La publicación de una versión nueva de Apps Script es necesaria**; sustituir solo el HTML no corrige el despliegue anterior.

## PASO A. Apps Script (primero)

1. Abre el proyecto independiente de Apps Script ya conectado con la aplicación.
2. Respalda y reemplaza **todo** `Code.gs` por `apps-script/Code.gs` de este paquete.
3. Guarda y ejecuta **`testV39`**, **`testResidereFinance`**, **`testFinance`** y **`testConnection`**.
4. Comprueba en los registros que el resumen tenga **7 fondos**, `missingSheets: []` y Residere con C17 y C28 diligenciados.
5. **Implementar → Administrar implementaciones → Editar implementación existente → Nueva versión → Implementar**. No crees una URL diferente si puedes reutilizar la que usa `.env.local`.
6. No cambies la propiedad de script `API_TOKEN` ni la compartas.

## PASO B. Visual Studio Code (carpeta completa)

1. Haz una copia de seguridad de tu proyecto actual, especialmente del archivo **`.env.local`**.
2. Descomprime `EDUCAMAS_V3_9_CARPETA_VISUAL_COMPLETA.zip`. Abre su carpeta `Educamas_V3_9_Visual` en VS Code.
3. **Copia tu `.env.local` desde la versión anterior** a esa carpeta nueva. No uses `.env.example` como reemplazo de las credenciales reales.
4. En la terminal:

   ```bash
   npm install
   npm run check
   npm test
   npm run dev
   ```

5. Abre `http://localhost:3000`, inicia sesión, pulsa **Actualizar**, selecciona Residere y revisa el informe financiero. Luego descarga PDF individual y PDF consolidado. Repite para PowerPoint.
6. Si todo está correcto, publica la carpeta nueva en Vercel, manteniendo las mismas variables de entorno configuradas. Si haces commit en el repositorio anterior, copia/actualiza los archivos de esta carpeta (NO `.env.local`).

## Alternativa: actualizar el proyecto actual sin crear carpeta nueva

Reemplazar:
- `public/index.html` — interfaz financiera V3.9;
- `api/index.js` — conexión financiera de respaldo y diagnóstico;
- `package.json` — nuevos scripts de pruebas;
- `scripts/test-v39.js` — prueba nueva.

Los demás archivos están completos en la carpeta, aunque no cambiaron frente a V3.8: `api/report.js`, `server.js`, `vercel.json`, los demás `scripts/`, etc. **`.env.local` nunca se reemplaza.**

## Datos de origen y reglas

- Fuente maestra de estudiantes: `JULI-2027-1`; no se expone la columna B `Estado interno`.
- Finanzas oficiales del fondo: las siete hojas `Proye-*`; no el simulador editable de la interfaz.
- Residere: se leen las celdas `C6`, `C7`, `C10`, `C11`, `C17`, `C24`, `C25`, `C26`, `C28`, `C39`, `C41` y otras del mismo libro. Los históricos requieren validación por Finanzas.
- Estado `Pagado`: se cuenta en el grupo correspondiente y sale de la base de **pendientes de pago**. La matrícula aproximada de `AY` **no** equivale a desembolso efectivo. El monto efectivamente informado se toma de `BH` si Finanzas lo diligencia, y `BI/BJ` registran fecha y soporte.
- Los otros fondos sin históricos diligenciados mantienen `Pendiente de diligenciar` sin inventar saldos.
- Fondo de grupo no se distribuye automáticamente entre filiales.
- Informes PDF y PowerPoint individuales, por grupo, filial o consolidados se recalculan en cada descarga a partir de la última actualización en pantalla.

## Diagnóstico si la pantalla sigue diciendo “Faltan los datos financieros”

- Ejecuta `testV39` en el Apps Script que realmente usa tu URL `/exec`.
- Confirma que publicaste una **nueva versión** de la implementación, no solo guardaste el archivo.
- Reinicia `npm run dev`, pulsa Actualizar o recarga `Command + Shift + R`.
- Si persiste, comprueba que `APPS_SCRIPT_URL` dentro de **tu archivo local** `.env.local` coincide con la implementación actualizada. **No compartas la URL junto con el token.**
- El aviso V3.9 aparece al cargar y no espera a que intentes descargar. No permite generar un reporte financiero incompleto disfrazado de completo.

## Validación realizada

Pruebas locales: sintaxis (`npm run check`), modelo financiero con datos ficticios (`npm test`), generación de PDF/PPTX, reportes por fondo y consolidados, prueba de fallback financiero de la API, además de aviso para servidor Apps Script desactualizado. **No se publicó ni se ejecutó el código contra tu implementación de producción.**

Archivo `apps-script/Code.gs` dentro del ZIP: copia de referencia para pruebas; el proyecto real de Apps Script sigue siendo independiente.
