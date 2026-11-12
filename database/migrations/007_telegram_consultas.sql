CREATE SCHEMA IF NOT EXISTS n8n_consulta;
CREATE OR REPLACE VIEW n8n_consulta.operadores AS
 SELECT t.telegram_user_id::text AS telegram_id
 FROM public.telegram_brigade_links t JOIN public.users u ON u.id=t.user_id
 WHERE u.role='BRIGADISTA' AND u.is_active AND NOT u.must_change_password;
CREATE OR REPLACE VIEW n8n_consulta.reportes AS
 SELECT 'TX-' || lpad(d.folio::text,greatest(6,length(d.folio::text)),'0') AS folio,
 r.title AS titulo,r.category::text AS categoria,r.status::text AS estado,
 r.address AS direccion,u.name AS responsable,r.resolved_at
 FROM public.reports r JOIN public.dispatch_outbox d ON d.report_id=r.id
 LEFT JOIN public.users u ON u.id=r.assigned_to
 WHERE r.withdrawn_at IS NULL;
REVOKE ALL ON SCHEMA n8n_consulta FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA n8n_consulta FROM PUBLIC;
