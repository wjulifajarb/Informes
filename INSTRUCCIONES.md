# EDUCAMÁS 2027-I · V5.3.2 — ajuste puntual

## Qué se corrigió

1. **Capacidad de endeudamiento (BL)** se muestra como porcentaje en la tabla del simulador HTML. Google Sheets almacena el dato como proporción: `0,0696969697` corresponde a `6,97 %`. No se usa como dinero ni participa en la suma.
2. **Solamente en PDF y PowerPoint** dejan de generarse estas secciones:
   - `Cuotas y acuerdos 2027-I` (panel lateral de cartera).
   - `Detalle financiero completo`.
   - `Selección de estudiantes · escenario local`.
   - `Acuerdos de pago 2027-I`.
   - `ANEXO · Estudiantes y estado actual`.
3. La **cartera oficial** permanece en la descarga y su tabla se muestra a ancho completo.
4. **Sin cambios** en navegación, datos, filtros, detalle financiero completo de la plataforma, selección de estudiantes, pagos BI/BU, fee, fondos y simulador HTML.

## ÚNICOS DOS ARCHIVOS QUE DEBES REEMPLAZAR EN VS CODE

| Archivo de esta entrega | Ubicación en tu proyecto |
| --- | --- |
| `Informe_Educamas_2027I_V532.html` | `public/index.html` |
| `Exportador_Educamas_2027I_V532.js` | `api/report.js` |

Estos mismos archivos ya están con sus nombres de proyecto dentro del ZIP en `public/index.html` y `api/report.js`.

### NO es necesario reemplazar

- `apps-script/Code.gs` / Google Apps Script (el valor porcentual BL ya se lee correctamente).
- `api/index.js`, `server.js`, `vercel.json`, `.env.local`.
- Ningún archivo ni fórmula del Google Sheets.

## Validación y publicación

1. Haz una copia de seguridad de los dos archivos actuales.
2. Reemplaza los dos archivos en VS Code.
3. Desde la raíz del proyecto, ejecuta `npm run check` y `npm test`.
4. Publica la actualización en Vercel.
5. En la aplicación, abre Simulador y confirma que **Capacidad de endeudamiento** muestra `%` y no `$`.
6. Descarga un PDF y un PowerPoint por empresa y confirma que los cinco apartados solicitados ya no aparecen.

**Nota:** no se requieren nuevas implementaciones de Google Apps Script ni cambios de tokens; esta actualización es de presentación y exportación. El proyecto ZIP trae el resto del código anterior únicamente para facilitar una instalación completa, pero no debes sobrescribir credenciales privadas ni cambiar la API si tu versión V5.3.1 ya está funcionando.
