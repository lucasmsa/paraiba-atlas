import type { PillarId } from './pillars'

export interface LayerCardText {
  oQueE: string
  porQueImporta: string
  comoLer: string
}

interface LayerBase {
  id: string
  pillar: PillarId
  label: string
  card: LayerCardText
}

export interface ChoroplethLayer extends LayerBase {
  kind: 'choropleth'
  path: string
  format: 'int' | 'decimal' | 'percent' | 'currency'
}

export interface CategoricalLayer extends LayerBase {
  kind: 'categorical'
  geoPath: string
  classesPath: string
  classesKey: string
  classField: string
  labels?: Record<string, string>
  colors?: Record<string, string>
  maxClasses?: number
}

export interface PointLayer extends LayerBase {
  kind: 'points'
  geoPath: string
  labelField: string
  sizeField: string | null
  color: string
  unit: string
  detailFields?: { field: string; label: string }[]
}

export type FillLayer = ChoroplethLayer | CategoricalLayer
export type AtlasLayer = FillLayer | PointLayer

export const LAYERS: AtlasLayer[] = [
  {
    kind: 'choropleth',
    id: 'gente.populacao',
    pillar: 'gente',
    label: 'População',
    path: 'gente/populacao.json',
    format: 'int',
    card: {
      oQueE: 'Quantas pessoas moravam em cada município na data do Censo Demográfico de 2022, contadas casa a casa pelo IBGE, o Instituto Brasileiro de Geografia e Estatística.',
      porQueImporta: 'A população é o denominador de quase todo indicador do atlas: crimes por 100 mil habitantes, postos de saúde por 10 mil, renda por pessoa. Também mostra onde a Paraíba se concentra: João Pessoa e Campina Grande somam cerca de um terço do estado.',
      comoLer: 'Cores mais escuras indicam mais gente. As cinco faixas dividem os 223 municípios em grupos de tamanho igual, então cada cor cobre cerca de 45 municípios. Áreas hachuradas não têm dado.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.renda_per_capita',
    pillar: 'gente',
    label: 'Renda per capita',
    path: 'gente/renda_per_capita.json',
    format: 'currency',
    card: {
      oQueE: 'Renda média mensal por pessoa em cada município: o total que os domicílios declararam ao Censo de 2022 dividido pelo número de moradores. É uma média, então poucos rendimentos altos puxam o valor para cima.',
      porQueImporta: 'É a medida mais direta de padrão de vida disponível para todos os 223 municípios. Comparada com a população e a pobreza, mostra onde a renda se concentra e onde o interior depende de aposentadorias e transferências.',
      comoLer: 'Cores mais escuras indicam renda maior. As cinco faixas dividem os municípios em grupos de tamanho igual. Na comparação por mesorregião, a média é ponderada pela população de cada município.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.moradores_por_domicilio',
    pillar: 'gente',
    label: 'Moradores por domicílio',
    path: 'gente/moradores_por_domicilio.json',
    format: 'decimal',
    card: {
      oQueE: 'Quantas pessoas, em média, vivem em cada casa ocupada do município, segundo o Censo de 2022.',
      porQueImporta: 'Casas mais cheias costumam indicar famílias maiores, menos domicílios por pessoa ou moradia mais cara. É um dos poucos dados de moradia que existe para todos os municípios, já que não há índice oficial de preço de imóveis fora de João Pessoa.',
      comoLer: 'Cores mais escuras indicam mais moradores por casa. As cinco faixas dividem os municípios em grupos de tamanho igual.',
    },
  },
  {
    kind: 'choropleth',
    id: 'agua.rede_agua',
    pillar: 'agua',
    label: 'Rede de água',
    path: 'agua/rede_agua.json',
    format: 'percent',
    card: {
      oQueE: 'Parcela da população do município atendida por rede pública de abastecimento de água em 2024, segundo o SINISA, o sistema nacional de informações em saneamento do Ministério das Cidades. Quem bebe de cisterna, poço ou carro-pipa não entra na conta.',
      porQueImporta: 'No semiárido, ter água encanada depende de um açude com volume e de uma adutora até a cidade. A cobertura por rede mostra onde a seca vira problema doméstico antes de virar problema agrícola.',
      comoLer: 'Cores mais escuras indicam mais gente atendida. As cinco faixas dividem os municípios com dado em grupos de tamanho igual. Municípios que não responderam ao SINISA aparecem hachurados.',
    },
  },
  {
    kind: 'choropleth',
    id: 'agua.rede_esgoto',
    pillar: 'agua',
    label: 'Rede de esgoto',
    path: 'agua/rede_esgoto.json',
    format: 'percent',
    card: {
      oQueE: 'Parcela da população do município atendida por rede coletora de esgoto em 2024, segundo o SINISA. Fossas e valas não contam como rede.',
      porQueImporta: 'Esgoto coletado é o indicador de saneamento que mais separa cidade grande de interior. Também é o dado com mais lacunas: só uma parte dos municípios paraibanos informou o SINISA de esgoto em 2024.',
      comoLer: 'Cores mais escuras indicam mais gente atendida. Municípios hachurados não informaram o dado, o que geralmente significa que não há rede coletora, mas não é garantia disso.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.idade_mediana',
    pillar: 'gente',
    label: 'Idade mediana',
    path: 'gente/idade_mediana.json',
    format: 'decimal',
    card: {
      oQueE: 'A idade que divide a população do município ao meio: metade dos moradores é mais nova, metade é mais velha. Censo de 2022.',
      porQueImporta: 'Municípios do interior envelhecem quando os jovens saem para estudar e trabalhar nas cidades grandes. A idade mediana mostra esse esvaziamento antes que a população total caia.',
      comoLer: 'Cores mais escuras indicam população mais velha. As cinco faixas dividem os municípios em grupos de tamanho igual.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.envelhecimento',
    pillar: 'gente',
    label: 'Índice de envelhecimento',
    path: 'gente/envelhecimento.json',
    format: 'decimal',
    card: {
      oQueE: 'Quantas pessoas com 60 anos ou mais existem para cada 100 crianças de 0 a 14 anos. Acima de 100, há mais idosos que crianças. Censo de 2022.',
      porQueImporta: 'É a medida mais direta de para onde vai a pirâmide etária de cada lugar: escolas que vão esvaziar, postos de saúde que vão precisar de geriatria, aposentadorias que sustentam a economia local.',
      comoLer: 'Cores mais escuras indicam mais idosos por criança. As cinco faixas dividem os municípios em grupos de tamanho igual.',
    },
  },
  {
    kind: 'points',
    id: 'terra.escalada',
    pillar: 'terra',
    label: 'Escalada',
    geoPath: 'terra/escalada.geojson',
    labelField: 'nome',
    sizeField: null,
    color: '#7d4212',
    unit: 'vias',
    card: {
      oQueE: 'Os setores de escalada em rocha da Paraíba. A lista vem dos autores do Guia de Escalada na Paraíba (Stenio Timotheo e Wolgrand Falcão, 2023), que catalogaram mais de 400 vias em 36 montanhas. Este índice é editorial: os pontos foram localizados pelo OpenStreetMap e ainda não trazem número de vias nem graduações.',
      porQueImporta: 'A escalada paraibana acontece nos mesmos granitos e gnaisses que formam os lajedos e serras do pilar Terra. Sobrepor os setores ao mapa geológico mostra por que a rocha boa está onde está.',
      comoLer: 'Um ponto por setor. Aproxime o mapa para ver os nomes. Três setores do guia ainda não têm localização e não aparecem.',
    },
  },
  {
    kind: 'categorical',
    id: 'terra.geologia',
    pillar: 'terra',
    label: 'Geologia',
    geoPath: 'geo/terra/geologia.geojson',
    classesPath: 'geo/terra/geologia_classes.json',
    classesKey: 'era_max',
    classField: 'ERA_MAX',
    colors: {
      'Cenozóico': '#f2e2c4',
      'Mesozóico': '#cfe0a8',
      'Paleozóico': '#a9c6b0',
      'Mesoproterozóico': '#d9a2a2',
      'Neoproterozóico': '#c4738c',
      'Paleoproterozóico': '#a8567c',
      'Paleoarqueano': '#6f3f66',
    },
    card: {
      oQueE: 'A idade da rocha que está sob cada pedaço do estado, agrupada por era geológica. Vem do mapa de unidades litoestratigráficas do Serviço Geológico do Brasil na escala 1:1.000.000.',
      porQueImporta: 'Quase toda a Paraíba está sobre rocha cristalina antiga, do Pré-Cambriano. Rocha cristalina não guarda água como areia guarda: a água só fica nas fraturas. É por isso que o Sertão depende de açude e não de poço, e é a mesma rocha que forma os lajedos e as paredes onde se escala.',
      comoLer: 'Cada cor é uma era geológica, das mais recentes (tons claros) às mais antigas (tons escuros). A faixa estreita de sedimento recente no litoral contrasta com o embasamento cristalino que cobre o resto. A porcentagem ao lado de cada cor é a área do estado que ela ocupa.',
    },
  },
  {
    kind: 'categorical',
    id: 'terra.solos',
    pillar: 'terra',
    label: 'Solos',
    geoPath: 'geo/terra/solos.geojson',
    classesPath: 'geo/terra/solos_classes.json',
    classesKey: 'classe',
    classField: 'classe',
    maxClasses: 12,
    card: {
      oQueE: 'O tipo de solo de cada área, do mapa exploratório de reconhecimento de solos da Paraíba feito pela Embrapa em 1972, na escala 1:500.000. É o levantamento mais detalhado que cobre o estado inteiro, e usa a nomenclatura da época.',
      porQueImporta: 'O solo decide o que cresce e quanta chuva fica guardada. Solo raso sobre rocha, comum na Borborema e no Cariri, perde água em dias; solo profundo do litoral segura por semanas. É a metade da história da seca que o mapa de chuva não conta.',
      comoLer: 'Cada cor é uma classe de solo, ordenada por área ocupada. Os nomes de 1972 aparecem junto do nome atual quando existe correspondência. Classes com pouca área ficam agrupadas em "outras".',
    },
  },
  {
    kind: 'categorical',
    id: 'terra.aquiferos',
    pillar: 'terra',
    label: 'Aquíferos',
    geoPath: 'geo/terra/aquiferos.geojson',
    classesPath: 'geo/terra/aquiferos_classes.json',
    classesKey: 'unidade',
    classField: 'nom_ue_afl',
    maxClasses: 10,
    card: {
      oQueE: 'As unidades que armazenam água subterrânea, do mapa hidrogeológico da Paraíba do Serviço Geológico do Brasil. Cada área diz qual formação está logo abaixo e quanta água ela costuma dar.',
      porQueImporta: 'Onde há aquífero sedimentar, um poço resolve. Onde há só embasamento cristalino fraturado, que é a maior parte do estado, o poço depende de acertar uma fratura e a água costuma ser salobra. Isso explica por que o abastecimento do interior é feito de açude e adutora, não de poço.',
      comoLer: 'Cada cor é uma unidade aquífera. O Embasamento Indiferenciado, que cobre a maior parte do estado, é justamente a rocha cristalina que quase não guarda água. As faixas sedimentares boas ficam no litoral e nos vales.',
    },
  },
  {
    kind: 'points',
    id: 'terra.geossitios',
    pillar: 'terra',
    label: 'Geossítios',
    geoPath: 'geo/terra/geossitios.geojson',
    labelField: 'nome',
    sizeField: null,
    color: '#7d4212',
    unit: 'relevância',
    detailFields: [
      { field: 'municipio', label: 'Município' },
      { field: 'rocha', label: 'Rocha' },
      { field: 'tempo_geologico', label: 'Tempo geológico' },
      { field: 'relevancia', label: 'Relevância' },
    ],
    card: {
      oQueE: 'Sítios de interesse geológico catalogados pelo Serviço Geológico do Brasil no inventário GEOSSIT. Cada um tem descrição da rocha, idade e notas de valor científico, educativo e turístico atribuídas por avaliadores.',
      porQueImporta: 'É onde a geologia da Paraíba fica visível a olho nu: as pegadas de dinossauro no Vale dos Dinossauros em Sousa, os blocos redondos do Lajedo de Pai Mateus em Cabaceiras, os campos de matacões do Cariri. Concentram-se em dois lugares, Sousa e o Cariri, e não por acaso.',
      comoLer: 'Um ponto por geossítio. Aproxime o mapa para ver os nomes e clique para abrir a ficha com rocha, idade e notas de relevância.',
    },
  },
  {
    kind: 'points',
    id: 'terra.picos',
    pillar: 'terra',
    label: 'Picos e serras',
    geoPath: 'geo/terra/picos.geojson',
    labelField: 'nome',
    sizeField: 'ele',
    color: '#5c3a10',
    unit: 'altitude',
    detailFields: [{ field: 'ele', label: 'Altitude (m)' }],
    card: {
      oQueE: 'Pontos altos mapeados no OpenStreetMap: picos, serras e morros da Paraíba, com altitude quando o mapa registra.',
      porQueImporta: 'A Borborema é o degrau que separa o litoral úmido do Sertão seco. Ela barra a umidade que vem do mar, e por isso o Cariri, logo atrás dela, é uma das regiões mais secas do Brasil. Ver os pontos altos sobre o relevo 3D mostra esse muro.',
      comoLer: 'Círculos maiores indicam altitude maior. Muitos pontos não trazem altitude registrada e aparecem no tamanho mínimo. Os nomes surgem ao aproximar o mapa.',
    },
  },
]

export const layerById = (id: string | null) => (id ? LAYERS.find((layer) => layer.id === id) ?? null : null)
export const isFillLayer = (layer: AtlasLayer | null): layer is FillLayer => layer?.kind === 'choropleth' || layer?.kind === 'categorical'
export const isPointLayer = (layer: AtlasLayer | null): layer is PointLayer => layer?.kind === 'points'
