// Dicionário de cosmódromos e porte radar (RCS) do SATCAT

export const LAUNCH_SITES_MAP = {
  // Américas
  AFETR: { name: 'Cabo Canaveral (CCSFS), Flórida', country: 'EUA' },
  KSCUT: { name: 'Centro Espacial Kennedy (KSC), Flórida', country: 'EUA' },
  AFWTR: { name: 'Base Espacial de Vandenberg, Califórnia', country: 'EUA' },
  WLPIS: { name: 'Instalação de Wallops Island, Virgínia', country: 'EUA' },
  KODAK: { name: 'Complexo Espacial de Kodiak, Alasca', country: 'EUA' },
  STBOS: { name: 'Starbase (Boca Chica), Texas', country: 'EUA' },
  KWJLN: { name: 'Atol de Kwajalein (Omelek)', country: 'EUA / Ilhas Marshall' },
  FRGUI: { name: 'Centro Espacial da Guiana (Kourou)', country: 'Guiana Francesa (ESA)' },
  ALCNT: { name: 'Centro de Lançamento de Alcântara (CLA)', country: 'Brasil' },

  // Rússia e Ex-URSS
  TYMSC: { name: 'Cosmódromo de Baikonur', country: 'Cazaquistão / Rússia' },
  PLMSC: { name: 'Cosmódromo de Plesetsk', country: 'Rússia' },
  VOSTO: { name: 'Cosmódromo de Vostochny', country: 'Rússia' },
  KYMSC: { name: 'Cosmódromo de Kapustin Yar', country: 'Rússia' },
  SVOBO: { name: 'Cosmódromo de Svobodny', country: 'Rússia' },
  DOMBA: { name: 'Base Aérea de Dombarovsky (Yasny)', country: 'Rússia' },

  // Ásia e Oceania
  JSC: { name: 'Centro de Lançamento de Jiuquan', country: 'China' },
  XSC: { name: 'Centro de Lançamento de Xichang', country: 'China' },
  TSC: { name: 'Centro de Lançamento de Taiyuan', country: 'China' },
  WSC: { name: 'Centro de Lançamento de Wenchang (Hainan)', country: 'China' },
  YSLA: { name: 'Plataforma Marítima no Mar Amarelo', country: 'China' },
  SRI: { name: 'Centro Espacial Satish Dhawan (Sriharikota)', country: 'Índia' },
  TNSTA: { name: 'Centro Espacial de Tanegashima', country: 'Japão' },
  UCHRA: { name: 'Centro Espacial de Uchinoura (Kagoshima)', country: 'Japão' },
  RLLC: { name: 'Complexo de Lançamento de Mahia', country: 'Nova Zelândia' },
  NARO: { name: 'Centro Espacial Naro', country: 'Coreia do Sul' },
  SOHAE: { name: 'Estação de Lançamento de Sohae', country: 'Coreia do Norte' },

  // Oriente Médio, África, Europa e Plataformas
  PALB: { name: 'Base Aérea de Palmachim', country: 'Israel' },
  SEM: { name: 'Centro Espacial Imam Khomeini (Semnan)', country: 'Irã' },
  SHAHR: { name: 'Centro Espacial de Shahrud', country: 'Irã' },
  SMTS: { name: 'Plataforma Luigi Broglio (Malindi)', country: 'Quênia / Itália' },
  HGSTR: { name: 'Base de Hammaguir', country: 'Argélia / França' },
  WOMRA: { name: 'Complexo de Testes de Woomera', country: 'Austrália' },
  ANDSP: { name: 'Porto Espacial de Andøya', country: 'Noruega' },
  SEAL: { name: 'Plataforma Marítima Sea Launch', country: 'Internacional' },
  ORBT: { name: 'Lançamento Aéreo (Pegasus / LauncherOne)', country: 'Móvel (Estratosfera)' },
  ISS: { name: 'Ejetado da Estação Espacial Internacional (ISS)', country: 'Órbita Baixa (LEO)' }
};

// Formata nome da base de lancamento sem prefixos redundantes
export function formatLaunchSite(siteCode, localOriginal = null) {
  if (localOriginal && localOriginal !== 'Não informado' && localOriginal.trim().length > 3) {
    return localOriginal.replace(/^CÓDIGO SATCAT:\s*/i, '');
  }
  if (!siteCode) return 'Não informada no catálogo';

  const cleanCode = siteCode.replace(/^CÓDIGO SATCAT:\s*/i, '').trim().toUpperCase();
  const site = LAUNCH_SITES_MAP[cleanCode];
  if (site) return `${site.name} (${site.country})`;
  if (siteCode.length > 5 && !siteCode.toUpperCase().startsWith('CÓDIGO')) {
    return siteCode;
  }
  return cleanCode;
}

// Converte porte de radar oficial (RCS)
export function formatRcsSize(rcsCode, sat = null) {
  const clean = rcsCode?.toString()?.trim()?.toUpperCase();
  if (clean === 'LARGE') {
    return { label: 'Grande Porte (> 1,0 m²)', desc: 'Satélite de grande porte ou estágio propulsor' };
  }
  if (clean === 'MEDIUM') {
    return { label: 'Porte Médio (0,1 a 1,0 m²)', desc: 'Microssatélite ou componente estrutural' };
  }
  if (clean === 'SMALL') {
    return { label: 'Fragmento (< 0,1 m²)', desc: 'Pequeno fragmento ou CubeSat' };
  }

  const catId = Number(sat?.categoria_id);
  const nome = (sat?.nome || '').toUpperCase();
  if (catId === 3 || nome.includes('DEB')) {
    return { label: 'Fragmento (< 1 m)', desc: 'Detrito catalogado por radar de rastreamento' };
  }
  if (catId === 5 || nome.includes('R/B')) {
    return { label: 'Grande Porte (> 3 m)', desc: 'Estágio superior inerte de foguete lançador' };
  }
  return { label: 'Porte Médio (1 a 3 m)', desc: 'Dimensões estimadas para a classe operacional' };
}
