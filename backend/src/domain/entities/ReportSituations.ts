import type { ReportCategory } from './Report';
export type ReportPriority = 'ALTA'|'MEDIA'|'BAJA'|'POR_CONFIRMAR';
export interface SituationOption {id:string;label:string;priority:ReportPriority;reason:string;}
export const REPORT_SITUATIONS: Record<ReportCategory,SituationOption[]> = {
  "BACHE": [
    {
      "id": "SUPERFICIAL",
      "label": "Deterioro superficial",
      "priority": "BAJA",
      "reason": "El daño descrito es superficial."
    },
    {
      "id": "MODERADO",
      "label": "Bache de profundidad moderada",
      "priority": "MEDIA",
      "reason": "El bache afecta la circulación."
    },
    {
      "id": "PROFUNDO",
      "label": "Bache profundo o peligroso",
      "priority": "ALTA",
      "reason": "Se reporta un bache profundo que puede provocar daños o accidentes."
    },
    {
      "id": "NO_SE",
      "label": "No estoy seguro",
      "priority": "POR_CONFIRMAR",
      "reason": "La situación requiere revisión del personal operativo."
    }
  ],
  "LUMINARIA": [
    {
      "id": "APAGADA",
      "label": "Una luminaria apagada",
      "priority": "MEDIA",
      "reason": "Se reporta una luminaria sin funcionar."
    },
    {
      "id": "VARIAS",
      "label": "Varias luminarias apagadas",
      "priority": "MEDIA",
      "reason": "Se reporta un tramo de calle sin alumbrado."
    },
    {
      "id": "POSTE",
      "label": "Poste caído o inestable",
      "priority": "ALTA",
      "reason": "Se reporta un poste caído o inestable."
    },
    {
      "id": "CABLES",
      "label": "Cables expuestos o chispas",
      "priority": "ALTA",
      "reason": "Se reporta riesgo eléctrico por cables o chispas."
    },
    {
      "id": "NO_SE",
      "label": "No estoy seguro",
      "priority": "POR_CONFIRMAR",
      "reason": "La situación requiere revisión del personal operativo."
    }
  ],
  "BASURA": [
    {
      "id": "ACUMULADA",
      "label": "Basura acumulada",
      "priority": "BAJA",
      "reason": "Se reporta acumulación de residuos."
    },
    {
      "id": "VOLUMINOSA",
      "label": "Residuos voluminosos",
      "priority": "MEDIA",
      "reason": "Se requiere retiro de residuos voluminosos."
    },
    {
      "id": "OBSTRUCCION",
      "label": "Obstruye calle o drenaje",
      "priority": "MEDIA",
      "reason": "Los residuos obstruyen el paso o el drenaje."
    },
    {
      "id": "INCENDIO",
      "label": "Basura incendiándose",
      "priority": "ALTA",
      "reason": "Se reporta fuego en los residuos."
    },
    {
      "id": "NO_SE",
      "label": "No estoy seguro",
      "priority": "POR_CONFIRMAR",
      "reason": "La situación requiere revisión del personal operativo."
    }
  ],
  "ARBOL_CAIDO": [
    {
      "id": "VIA_PRINCIPAL",
      "label": "Sobre una avenida o vía principal",
      "priority": "ALTA",
      "reason": "El árbol afecta una vía principal."
    },
    {
      "id": "CALLE",
      "label": "Sobre una calle",
      "priority": "MEDIA",
      "reason": "El árbol obstruye una calle."
    },
    {
      "id": "VIVIENDA",
      "label": "Sobre una vivienda o inmueble",
      "priority": "ALTA",
      "reason": "El árbol afecta una vivienda o inmueble."
    },
    {
      "id": "CABLES",
      "label": "En contacto con cables",
      "priority": "ALTA",
      "reason": "El árbol está en contacto con cables."
    },
    {
      "id": "BANQUETA",
      "label": "Ramas en banqueta o parque",
      "priority": "MEDIA",
      "reason": "Se requiere retirar ramas de un espacio peatonal."
    },
    {
      "id": "NO_SE",
      "label": "No estoy seguro",
      "priority": "POR_CONFIRMAR",
      "reason": "La situación requiere revisión del personal operativo."
    }
  ],
  "FUGA_AGUA": [
    {
      "id": "LEVE",
      "label": "Escurrimiento leve",
      "priority": "MEDIA",
      "reason": "Se reporta un escurrimiento leve de agua."
    },
    {
      "id": "CONSTANTE",
      "label": "Fuga constante",
      "priority": "MEDIA",
      "reason": "Se reporta una fuga continua de agua."
    },
    {
      "id": "ABUNDANTE",
      "label": "Fuga abundante o inundación",
      "priority": "ALTA",
      "reason": "Se reporta pérdida abundante de agua o inundación."
    },
    {
      "id": "SIN_SUMINISTRO",
      "label": "Falta de suministro",
      "priority": "MEDIA",
      "reason": "Se reporta falta de agua; no se ha confirmado una fuga."
    },
    {
      "id": "NO_SE",
      "label": "No estoy seguro",
      "priority": "POR_CONFIRMAR",
      "reason": "La situación requiere revisión del personal operativo."
    }
  ],
  "DRENAJE": [
    {
      "id": "OBSTRUIDO",
      "label": "Drenaje obstruido",
      "priority": "MEDIA",
      "reason": "Se reporta una obstrucción del drenaje."
    },
    {
      "id": "REJILLA",
      "label": "Rejilla dañada",
      "priority": "MEDIA",
      "reason": "Se reporta una rejilla de drenaje dañada."
    },
    {
      "id": "SIN_TAPA",
      "label": "Alcantarilla sin tapa",
      "priority": "ALTA",
      "reason": "La alcantarilla abierta representa un riesgo de caída."
    },
    {
      "id": "DESBORDAMIENTO",
      "label": "Desbordamiento de aguas negras",
      "priority": "ALTA",
      "reason": "Se reporta un desbordamiento de aguas negras."
    },
    {
      "id": "NO_SE",
      "label": "No estoy seguro",
      "priority": "POR_CONFIRMAR",
      "reason": "La situación requiere revisión del personal operativo."
    }
  ],
  "SEMAFORO": [
    {
      "id": "APAGADO",
      "label": "Semáforo apagado",
      "priority": "MEDIA",
      "reason": "Se reporta un semáforo sin funcionar."
    },
    {
      "id": "INTERMITENTE",
      "label": "Luces intermitentes o descoordinadas",
      "priority": "MEDIA",
      "reason": "Se reporta una falla en las señales del semáforo."
    },
    {
      "id": "CAIDO",
      "label": "Semáforo caído o cables expuestos",
      "priority": "ALTA",
      "reason": "Se reporta estructura caída o riesgo eléctrico."
    },
    {
      "id": "NO_SE",
      "label": "No estoy seguro",
      "priority": "POR_CONFIRMAR",
      "reason": "La situación requiere revisión del personal operativo."
    }
  ]
};
export const getSituation = (category:ReportCategory, id?:string):SituationOption|undefined => REPORT_SITUATIONS[category]?.find(option=>option.id===id);
