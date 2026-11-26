# Auditoría de integridad · Base_2027 - I

**Fecha:** 26 de noviembre de 2026. **Archivo revisado:** [Base_2027 - I](https://docs.google.com/spreadsheets/d/1TkVBmU6NOCVpPkSdAUpXeUREAclVdWQnquJNh7y-bZE/edit).

## Fuente y correspondencia

- Fuente oficial: `Financiero2027-1`, encabezados en la fila 2.
- Orden de columnas observado en la revisión: **F = Grupo, G = Empresa, H = Nombre**.
- Las 19 hojas `Estudiantes-` ahora resuelven **Grupo, Empresa y Nombre por sus encabezados**, por lo que soportan también una eventual inversión de F y G sin alterar la fuente.
- Filtro por grupo: `Estudiantes-[Grupo]` incluye todos los estudiantes cuyo `Grupo` coincida con A1.
- Filtro por empresa: `Estudiantes-[Empresa]` incluye exclusivamente aquellos con `Grupo = A1` y `Empresa = B1`.
- `A2:CF2` mantiene los encabezados oficiales; `A3` contiene la fórmula dinámica. No se sobrescribieron filas de estudiantes.

## Conciliación de estudiantes

| Hoja de estudiantes | Registros comprobados | Alcance |
|---|---:|---|
| Estudiantes-Transportes Vigía | 64 | Grupo/empresa independiente |
| Estudiantes-Residere | 11 | Independiente |
| Estudiantes-Grupo Ventura | 41 | Grupo completo |
| Estudiantes-Visión & Marketing | 39 | Filial del Grupo Ventura |
| Estudiantes-Listos | 2 | Filial del Grupo Ventura |
| Estudiantes-Grupo Falic | 51 | Grupo completo |
| Estudiantes-GWS | 38 | Filial del Grupo Falic |
| Estudiantes-Reebok | 6 | Filial del Grupo Falic |
| Estudiantes-Paneco | 1 | Filial del Grupo Falic |
| Estudiantes-Filiales Grupo Vigía | 15 | Grupo completo |
| Estudiantes-Phari SAS (Transportes Vigía) | 2 | Filial del Grupo Vigía |
| Estudiantes-Vlogic (Transportes Vigía) | 1 | Filial del Grupo Vigía |
| Estudiantes-Vigía Transportes Especial (Transportes Vigía) | 2 | Filial del Grupo Vigía |
| Estudiantes-Pharitech (Transportes Vigía) | 7 | Filial del Grupo Vigía |
| Estudiantes-Enérgika (Transportes Vigía) | 1 | Filial del Grupo Vigía |
| Estudiantes-Grupo Bergé Colombia | 24 | Grupo completo |
| Estudiantes-Bergé Colombia | 18 | Filial del Grupo Bergé Colombia |
| Estudiantes-Carport (Bergé Colombia) | 6 | Filial del Grupo Bergé Colombia |
| Estudiantes-EducaMás | 2 | Empresa independiente |

**Conciliación global:** 208 registros desde la fuente y 208 distribuidos entre los siete fondos/grupos principales. Las filiales aparecen además en sus hojas individuales **para el filtro, no para sumar al global**. De ahí que sumar indiscriminadamente las 19 hojas duplicaría registros que ya aparecen en el grupo principal.

## Proyecciones y fórmulas

- Las **19 hojas `Proye-`** tienen la correspondiente hoja `Estudiantes-`.
- La lógica de **C24:C28** y **F24:F28** es equivalente en las 19 proyecciones y se refiere a `Estudiantes-[Empresa]` correcto.
- La lógica de C30/F30, C31/F31 y C33/F33 también es homogénea.
- Se verificaron las 16 celdas de fórmulas principales por proyección: **304 comprobaciones**, sin errores de fórmula ni referencias cruzadas.
- Se conservaron los importes históricos, saldos, tarifas y gastos manuales; no se editó ninguna fórmula de proyección.
- **BI** sirve para matrículas pendientes; **BU** para pagos finales en el escenario de aprobación de empresa y el simulador; **BL** es porcentaje de capacidad de endeudamiento, no pesos.

## Datos pendientes de fuente (no son fallas de conexión)

- En varias empresas, BM, BN o BO permanecen sin diligenciar; por eso sus indicadores de preaprobación, aprobación y pagos pueden ser cero aunque los estudiantes sí estén cargados.
- En **Residere** hay un registro con `Status Final = Pagado`, pero **BU está vacío**. Ese valor de matrícula pagada permanece pendiente hasta que se diligencie en la fuente. No debe estimarse ni reemplazarse por BI.

## Código de aplicación

La versión **5.3.5** de Google Apps Script reconoce los encabezados `Grupo` y `Empresa` por nombre en `Financiero2027-1` y en las hojas `Estudiantes-`, sin asumir posiciones fijas. Pasaron pruebas locales para ambos órdenes F/G, lectura por grupo/filial/empresa independiente y privacidad de `Estado interno`.

**Acción de publicación pendiente:** reemplazar `Code.gs` y actualizar la implementación existente de Google Apps Script. La web V5.3.4 no requiere reescritura si ya funciona.

**Respaldo previo:** https://docs.google.com/spreadsheets/d/1U1403Va48pxacpY4MfjzKIYiSUHtssfpkfXM7XVm3WU/edit
