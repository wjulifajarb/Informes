# EDUCAMÁS V5.3.7 — corrección de la API del informe

## Problema encontrado

La aplicación mostraba `Encabezados incompletos en Financiero2027-1 o Estudiantes-*: BI, BM, BN, BO, BU`.
La hoja `Financiero2027-1` insertó/desplazó columnas. Actualmente:

- BJ: Valor a Financiar (antes BI)
- BN: Aprobación EducaMas (antes BM)
- BO: Estado Aprobacion Empresa (antes BN)
- BP: Status Final (antes BO)
- BV: Vr. Final pago matricula (antes BU)

También se desplazaron Simulación Cuota, Numero de Cuotas, Capacidad de endeudamiento, Fecha de Pago y descuentos.

## Qué se corrigió

- `apps-script/Code.gs` versión `5.3.7`: identifica todos esos campos por el **texto normalizado del encabezado** y no por posiciones fijas.
- Conserva las acciones `data`, `scope`, `finance` y `diagnostic`, los datos históricos y el mecanismo de autenticación.
- Mantiene privados los datos de `Estado interno` y los filtros de grupo, empresa y filial.
- `public/index.html` conserva el HTML V5.3.6, sin modificaciones.

## Publicación

1. Abre el proyecto de Apps Script que usa actualmente la plataforma.
2. Reemplaza **todo `Code.gs`** con `apps-script/Code.gs` de este paquete.
3. Conserva el `API_TOKEN` en Propiedades del script; NO lo pegues en HTML.
4. Ejecuta `testConnection()` y `testScopes()` en el editor para comprobar acceso y 19 pares.
5. **Implementar > Administrar implementaciones > Editar > Nueva versión > Implementar**.
6. Confirma el endpoint `/exec` actual en Vercel; si cambia, actualiza la variable `APPS_SCRIPT_URL` (solo del servidor), luego recarga la página.

## Precaución financiera

Las hojas `Proye-*` del **archivo maestro** mantienen algunas fórmulas antiguas que apuntan a BI/BM/BN/BO/BU. Al 26/11/2026, por ejemplo, `Proye-Transportes Vigía` y `Proye-Residere` presentan guiones o ceros en C24:F28. **Este paquete NO modifica el maestro**, como se solicitó en el flujo previo. Corregir el código de lectura de la app no repara esas fórmulas subyacentes, de manera que las cifras financieras de la plataforma deberán validarse/ajustarse en el maestro antes de dar por cerrado el informe completo.

## Pruebas

Se ejecutó `npm test`, con casos adicionales V5.3.7 de columnas desplazadas, ausencia de encabezados críticos, privacidad, importes y porcentajes. `npm run check` valida sintaxis.
