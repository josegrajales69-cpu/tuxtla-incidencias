
function formatAlert(event) {
  const categories = {
    BACHE: ['🕳️', 'Bache'], LUMINARIA: ['💡', 'Alumbrado'],
    BASURA: ['🗑️', 'Basura'], ARBOL_CAIDO: ['🌳', 'Árbol caído'],
    FUGA_AGUA: ['💧', 'Fuga de agua'], DRENAJE: ['🚧', 'Drenaje'],
    SEMAFORO: ['🚦', 'Semáforo'],
  };
  const clean = (value, max) => typeof value === 'string'
    ? Array.from(value.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, max).join('') : '';
  const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const data = event?.data;
  if (event?.schemaVersion !== 1 || event.event !== 'REPORT_CREATED' || !uuid.test(event.eventId || '') || !data || !uuid.test(data.id || '')) throw new Error('Evento de reporte no válido');
  if (!Object.hasOwn(categories, data.category)) throw new Error('Categoría no admitida');
  if (!/^TX-\d{6,}$/.test(data.folio || '')) throw new Error('Falta el folio persistente');
  const lat = data.coordinates?.latitude, lng = data.coordinates?.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 16.5 || lat > 17 || lng < -93.3 || lng > -92.9) throw new Error('Coordenadas inválidas o fuera del área configurada');
  const title = clean(data.title, 200);
  if (!title) throw new Error('Falta el título del reporte');
  const description = clean(data.description, 320) || title;
  const address = clean(data.address, 260) || 'Dirección por confirmar';
  const text = `${title}. ${description}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const risk = /incendio|electrocucion|cables? (?:electricos? )?(?:expuestos?|caidos?)|personas? atrapadas?|drenaje abierto|alcantarilla (?:abierta|sin tapa)|inundacion|fuga (?:de agua )?(?:severa|masiva)|(?:arbol|tronco).*(?:bloquea|obstruye).*(?:avenida|via principal|boulevard|bulevar|libramiento)|aguas negras.*(?:desbord|calle)/;
  const uncertain = /\b(?:no|nunca|posible|posiblemente|parece|quizas|desconozco)\b|\bsin (?:riesgo|peligro|fuga|incendio|inundacion)\b/;
  let priority, reason;
  if (data.prioritySource === 'structured-v1') {
    if (!['ALTA','MEDIA','BAJA','POR_CONFIRMAR'].includes(data.priority) || !clean(data.situationLabel,160) || !clean(data.priorityReason,240)) throw new Error('Prioridad estructurada incompleta');
    priority = data.priority === 'POR_CONFIRMAR' ? 'POR CONFIRMAR' : data.priority;
    reason = clean(data.priorityReason,240);
  } else if (risk.test(text)) {
    if (uncertain.test(text)) {
      priority = 'POR CONFIRMAR'; reason = 'El texto menciona riesgo con negación o incertidumbre; requiere revisión.';
    } else {
      priority = 'ALTA'; reason = 'Se describe un posible riesgo para personas o para la circulación.';
    }
  } else if (['BACHE', 'LUMINARIA', 'SEMAFORO'].includes(data.category)) {
    priority = 'MEDIA'; reason = 'Requiere atención; no se describe un riesgo inmediato.';
  } else if (data.category === 'BASURA') {
    priority = 'BAJA'; reason = 'Acumulación de residuos sin riesgo inmediato descrito.';
  } else {
    priority = 'POR CONFIRMAR'; reason = 'Faltan datos sobre gravedad u obstrucción de la vía.';
  }
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const emoji=categories[data.category][0];
  const category=data.category==='FUGA_AGUA'&&data.situation==='SIN_SUMINISTRO'?'Falta de suministro de agua':categories[data.category][1];
  const situationLabel=clean(data.situationLabel,160);
  const reportUrl=typeof data.reportUrl==='string'&&/^https?:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?\/\?report=[0-9a-f-]{36}$/i.test(data.reportUrl)?data.reportUrl:undefined;
  const attendLink=reportUrl?'\n\n👷 <a href="'+escape(reportUrl).replace(/"/g,'&quot;')+'">Ver detalle en la web</a>\nPara atenderlo, pulsa «Tomar reporte» debajo de este aviso.':'';
  const html = `⚠️ <b>NUEVO REPORTE EN TUXTLA</b>\n• <b>Folio:</b> ${data.folio}\n• <b>Incidente:</b> ${emoji} ${category}${situationLabel?`\n• <b>Situación:</b> ${escape(situationLabel)}`:''}\n• <b>Ubicación:</b> ${escape(address)}\n• <a href="${mapsUrl}">Ver ubicación en el mapa</a>\n\n📝 <b>Descripción:</b>\n${escape(description)}\n\n📋 <b>Prioridad sugerida:</b>\n<b>${priority}</b> — ${escape(reason)}${attendLink}`;
  return { eventId:event.eventId, reportId:data.id, folio:data.folio, category:data.category,
    priority, priorityReason:reason, prioritySource:data.prioritySource==='structured-v1'?'structured-v1':'rules-v1', requiresReview:priority === 'POR CONFIRMAR',
    mapsUrl, html, plainText:`⚠️ NUEVO REPORTE EN TUXTLA\nFolio: ${data.folio}\nIncidente: ${emoji} ${category}\nUbicación: ${address}\nMapa: ${mapsUrl}\n\nDescripción: ${description}\n\nPrioridad sugerida: ${priority} — ${reason}` };
}
module.exports = { formatAlert };
