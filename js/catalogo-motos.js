/**
 * ENDURO NALÓN — catálogo de documentación existente (Fase 1).
 * Las rutas proceden de la versión del repositorio aportada por el usuario.
 * No extrapolar manuales ni pares a modelos/años no indicados.
 * Este catálogo contiene SOLO datos públicos de motos; no almacena información de usuarios.
 */
export const CATALOGO_MOTOS = [
  {
    id: 'gasgas-ec-250',
    marca: 'GASGAS',
    modelo: 'EC 250',
    anios: [2004, 2005, 2006],
    aclaracion: 'Las tablas disponibles agrupan EC/MC/SM 250–300 (2004–2006). Son valores orientativos: confirma siempre la versión y el año de tu moto.',
    recursos: [
      { tipo: 'Pares de apriete', titulo: 'GASGAS EC/MC/SM 250–300 · tabla de referencia', enlace: 'gg_04-06.html', anios: [2004, 2005, 2006], origen: 'Ficha del sitio' },
      { tipo: 'Manual de usuario', titulo: 'GASGAS EC 2T · manual 2005 (verifica versión)', enlace: 'https://www.motocrosscenter.com/pdf_manual_gasgas/2005_ec2t_manual_es.pdf', anios: [2005], origen: 'Documento enlazado en la web original' }
    ]
  },
  {
    id: 'gasgas-ec-300',
    marca: 'GASGAS',
    modelo: 'EC 300',
    anios: [2004, 2005, 2006],
    aclaracion: 'Las tablas disponibles agrupan EC/MC/SM 250–300 (2004–2006). Son valores orientativos: confirma siempre la versión y el año de tu moto.',
    recursos: [
      { tipo: 'Pares de apriete', titulo: 'GASGAS EC/MC/SM 250–300 · tabla de referencia', enlace: 'gg_04-06.html', anios: [2004, 2005, 2006], origen: 'Ficha del sitio' },
      { tipo: 'Manual de usuario', titulo: 'GASGAS EC 2T · manual 2005 (verifica versión)', enlace: 'https://www.motocrosscenter.com/pdf_manual_gasgas/2005_ec2t_manual_es.pdf', anios: [2005], origen: 'Documento enlazado en la web original' }
    ]
  },
  {
    id: 'gasgas-ec-2t-2018',
    marca: 'GASGAS',
    modelo: 'EC 2T (manual general)',
    anios: [2018],
    aclaracion: 'La documentación enlazada se identifica como manual GASGAS EC 2T de 2018, sin una cilindrada concreta en el índice de Enduro Nalón. Comprueba su correspondencia antes de utilizarla.',
    recursos: [
      { tipo: 'Manual de usuario', titulo: 'GASGAS EC 2T · manual 2018', enlace: 'https://www.motocrosscenter.com/pdf_manual_gasgas/18-11-08-mu-gasgas-2t-ec-18v3---esp.pdf', anios: [2018], origen: 'Documento enlazado en la web original' }
    ]
  },
  {
    id: 'ktm-exc-300',
    marca: 'KTM',
    modelo: 'EXC 300',
    anios: [2017],
    aclaracion: 'La tabla de pares es orientativa. Contrasta cada operación con el manual de servicio aplicable a tu versión.',
    recursos: [
      { tipo: 'Pares de apriete', titulo: 'KTM 300 EXC · pares y datos técnicos', enlace: 'ktm300_2017.html', anios: [2017], origen: 'Ficha del sitio' },
      { tipo: 'Manual de usuario', titulo: 'KTM 300 EXC · manual de usuario 2017', enlace: 'manuales/manual_KTM_300_2017.pdf', anios: [2017], origen: 'Archivo existente en el repositorio' },
      { tipo: 'Manual de taller', titulo: 'KTM 300 EXC · manual de reparación 2017', enlace: 'manuales/KTM_300_2017_manual_reparacion.pdf', anios: [2017], origen: 'Archivo existente en el repositorio' }
    ]
  },
  {
    id: 'ktm-exc-450',
    marca: 'KTM',
    modelo: 'EXC 450',
    anios: [2003, 2004, 2005, 2006],
    aclaracion: 'La ficha de pares está titulada «KTM 450 (2003–2006)». El manual PDF disponible en la web está asociado específicamente a 2003.',
    recursos: [
      { tipo: 'Pares de apriete', titulo: 'KTM 450 · tabla de pares 2003–2006', enlace: 'ktm450_2003.html', anios: [2003, 2004, 2005, 2006], origen: 'Ficha del sitio' },
      { tipo: 'Manual de usuario', titulo: 'KTM EXC 450 · documento asociado a 2003', enlace: 'manuales/ktm450.pdf', anios: [2003], origen: 'Archivo existente en el repositorio' }
    ]
  },
  {
    id: 'rieju-mr-pro-300i',
    marca: 'RIEJU',
    modelo: 'MR PRO 300i',
    anios: [2026],
    aclaracion: 'El manual procede del enlace a la documentación del fabricante presente en el índice original de Enduro Nalón.',
    recursos: [
      { tipo: 'Manual de usuario', titulo: 'Rieju MR 300i · manual propietario 2026', enlace: 'https://cdn.rieju.com/uploads/_models/119/ES%20-%20Manual%20propietario%20MR300i%20-%202026.pdf', anios: [2026], origen: 'Enlace al fabricante' }
    ]
  }
];

export function buscarMoto(marca, modeloId, anio) {
  const year = Number(anio);
  if (!Number.isInteger(year)) return null;
  return CATALOGO_MOTOS.find(m => m.marca === marca && m.id === modeloId && m.anios.includes(year)) || null;
}

export function recursosParaAnio(moto, anio) {
  const year = Number(anio);
  if (!moto || !Number.isInteger(year)) return [];
  return moto.recursos.filter(recurso => recurso.anios.includes(year));
}
