WITH permiso AS (
 SELECT EXISTS(SELECT 1 FROM n8n_consulta.operadores WHERE telegram_id=$1::text) AS autorizado
)
SELECT permiso.autorizado,
 CASE WHEN permiso.autorizado THEN
  (SELECT row_to_json(r) FROM n8n_consulta.reportes r WHERE r.folio=$2::text LIMIT 1)
 ELSE NULL END AS reporte
FROM permiso;