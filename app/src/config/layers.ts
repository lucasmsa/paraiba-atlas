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
  format: 'int' | 'decimal' | 'percent' | 'currency' | 'index'
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
  footnoteField?: string
  /** Domain of sizeField in source units. Radius scales with its square root so area, not radius, tracks the value. */
  sizeDomain?: [number, number]
  maxRadius?: number
  /** Field holding a monthly series; rendered as a sparkline in the detail panel. */
  serieField?: string
  /** Field in 0-100 that colors the point, overriding the flat layer color. */
  fillPercentField?: string
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
    detailFields: [
      { field: 'municipio', label: 'Município' },
      { field: 'vias', label: 'Vias' },
      { field: 'estilos', label: 'Estilos' },
      { field: 'graduacao', label: 'Graduação' },
    ],
    footnoteField: 'fonte_coordenada',
    card: {
      oQueE: 'Os setores de escalada em rocha da Paraíba. A lista parte dos nomes que os autores do Guia de Escalada na Paraíba (Stenio Timotheo e Wolgrand Falcão, 2023) publicam, e as coordenadas vêm de bases de escalada e do OpenStreetMap. É um índice editorial: mostra onde se escala, não quais são as vias.',
      porQueImporta: 'A escalada paraibana acontece nos mesmos granitos e gnaisses que formam os lajedos e as serras do pilar Terra. Sobrepor os setores ao mapa geológico mostra por que a rocha boa está onde está: quase tudo cai sobre embasamento cristalino do Pré-Cambriano.',
      comoLer: 'Um ponto por setor, e cada coordenada foi conferida contra o polígono do seu município. Dos 11 setores conhecidos, 8 têm posição verificada. Pedra do Cordeiro, Almas Gêmeas e Pedra das Chaminés não têm coordenada publicada em nenhuma base e ficam de fora do mapa até saírem do guia impresso. Número de vias e graduações ainda não foram preenchidos.',
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
    sizeDomain: [0, 1200],
    maxRadius: 9,
    color: '#5c3a10',
    unit: 'altitude',
    detailFields: [{ field: 'ele', label: 'Altitude (m)' }],
    card: {
      oQueE: 'Pontos altos mapeados no OpenStreetMap: picos, serras e morros da Paraíba, com altitude quando o mapa registra.',
      porQueImporta: 'A Borborema é o degrau que separa o litoral úmido do Sertão seco. Ela barra a umidade que vem do mar, e por isso o Cariri, logo atrás dela, é uma das regiões mais secas do Brasil. Ver os pontos altos sobre o relevo 3D mostra esse muro.',
      comoLer: 'Círculos maiores indicam altitude maior. Muitos pontos não trazem altitude registrada e aparecem no tamanho mínimo. Os nomes surgem ao aproximar o mapa.',
    },
  },
  {
    kind: 'points',
    id: 'agua.acudes',
    pillar: 'agua',
    label: 'Açudes',
    geoPath: 'agua/acudes.geojson',
    labelField: 'nome',
    sizeField: 'capacidade_m3',
    sizeDomain: [0, 744000000],
    maxRadius: 13,
    color: '#1e5f66',
    fillPercentField: 'percentual',
    serieField: 'serie_mensal',
    unit: 'capacidade',
    detailFields: [
      { field: 'municipio', label: 'Município' },
      { field: 'bacia', label: 'Bacia' },
      { field: 'capacidade_hm3', label: 'Capacidade (hm³)' },
      { field: 'volume_hm3', label: 'Volume (hm³)' },
      { field: 'percentual', label: 'Cheio (%)' },
      { field: 'data_volume', label: 'Medição' },
    ],
    card: {
      oQueE: 'Os 131 açudes monitorados da Paraíba. O cadastro vem da AESA, a agência estadual de águas, e o volume de cada um vem do SAR, o sistema de acompanhamento de reservatórios da Agência Nacional de Águas.',
      porQueImporta: 'No semiárido o açude decide se a cidade tem água na torneira. A rocha cristalina que cobre quase todo o estado quase não guarda água subterrânea, então o abastecimento do interior depende de reservatório e adutora, não de poço. Esta é a camada que responde à pergunta central do pilar: tem água ou não tem.',
      comoLer: 'O tamanho do círculo é a capacidade do açude e a cor é quanto dele está cheio hoje: laranja é vazio, azul é cheio. Cinza significa sem leitura recente. Clique em um açude para ver a série dos últimos meses. Alguns passam de 100% porque estão vertendo acima da capacidade nominal.',
    },
  },
  {
    kind: 'points',
    id: 'agua.postos_chuva',
    pillar: 'agua',
    label: 'Postos de chuva',
    geoPath: 'agua/postos_chuva.geojson',
    labelField: 'nome',
    sizeField: null,
    color: '#3a8f93',
    unit: 'posto',
    detailFields: [
      { field: 'codigo', label: 'Código' },
      { field: 'altitude_m', label: 'Altitude (m)' },
      { field: 'chuva_mm', label: 'Chuva (mm)' },
    ],
    card: {
      oQueE: 'A rede de pluviômetros que a AESA opera na Paraíba, herdada da antiga rede da SUDENE. São 175 postos com posição conferida, de um total de 181 cadastrados.',
      porQueImporta: 'A chuva no semiárido é irregular no espaço: dois municípios vizinhos podem receber volumes muito diferentes no mesmo mês. A densidade de postos mostra onde existe medição em terra para checar o que os modelos de clima estimam.',
      comoLer: 'Um ponto por posto. Seis postos cadastrados sem coordenada levantada ficam de fora. As leituras diárias exigem autenticação na AESA, então o mapa mostra onde se mede, não quanto choveu.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.homicidios',
    pillar: 'gente',
    label: 'Homicídios',
    path: 'gente/homicidios.json',
    format: 'decimal',
    card: {
      oQueE: 'Mortes por agressão a cada 100 mil habitantes, contadas pelo registro de óbitos do Ministério da Saúde. Vem do atestado de óbito, não do boletim de ocorrência, então independe de a polícia ter registrado o caso.',
      porQueImporta: 'É o indicador de violência mais confiável que existe no Brasil por município, porque um corpo sempre gera um registro. Na Paraíba a violência letal não está concentrada só na capital: cidades médias do interior aparecem em posições altas.',
      comoLer: 'Cores mais escuras indicam taxa maior.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.mortalidade_infantil',
    pillar: 'gente',
    label: 'Mortalidade infantil',
    path: 'gente/mortalidade_infantil.json',
    format: 'decimal',
    card: {
      oQueE: 'Quantas crianças morrem antes de completar um ano, a cada mil que nascem vivas.',
      porQueImporta: 'É o indicador clássico de qualidade de vida e de acesso a saúde, porque depende de pré-natal, parto assistido, saneamento e renda ao mesmo tempo. Quando cai, quase tudo melhorou junto.',
      comoLer: 'Cores mais escuras indicam mais mortes por mil nascimentos. Municípios que aparecem com zero geralmente têm poucos nascimentos no período, não saúde perfeita.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.saude_estabelecimentos',
    pillar: 'gente',
    label: 'Postos e hospitais',
    path: 'gente/saude_estabelecimentos.json',
    format: 'decimal',
    card: {
      oQueE: 'Quantos estabelecimentos de saúde existem para cada 10 mil moradores do município, segundo o cadastro nacional do Ministério da Saúde.',
      porQueImporta: 'Mostra quanta estrutura existe para cada morador. Não mede qualidade nem capacidade: um posto de saúde e um hospital regional contam igual.',
      comoLer: 'Cores mais escuras indicam mais estabelecimentos por habitante. Não existe lado bom nem ruim nesta camada, e por isso a comparação não marca melhor e pior aqui: João Pessoa aparece por último porque um município de 3 mil pessoas com um único posto marca uma taxa altíssima. Isto mede dispersão da rede, não fartura de atendimento.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.pib_per_capita',
    pillar: 'gente',
    label: 'PIB per capita',
    path: 'gente/pib_per_capita.json',
    format: 'currency',
    card: {
      oQueE: 'O valor de tudo o que se produziu no município em um ano, dividido pela população.',
      porQueImporta: 'Mostra onde está a atividade econômica, que não é o mesmo lugar onde está a renda das pessoas. É a camada que mais recompensa ser lida ao lado de outra: compare com a renda domiciliar per capita e os municípios onde as duas discordam contam uma história.',
      comoLer: 'Cores mais escuras indicam mais produção por habitante.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.idhm',
    pillar: 'gente',
    label: 'IDHM',
    path: 'gente/idhm.json',
    format: 'index',
    card: {
      oQueE: 'A versão municipal do IDH das Nações Unidas, calculada para cada município brasileiro.',
      porQueImporta: 'Junta em um só número três dimensões que costumam andar juntas, e por isso serve de retrato geral quando se quer comparar municípios de tamanhos muito diferentes.',
      comoLer: 'Cores mais escuras indicam índice maior. O dado é de 2010, então leia como retrato daquele ano.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.banda_larga',
    pillar: 'gente',
    label: 'Banda larga',
    path: 'gente/banda_larga.json',
    format: 'decimal',
    card: {
      oQueE: 'Quantos contratos de internet fixa existem para cada 100 moradores, segundo a Anatel.',
      porQueImporta: 'Internet fixa é a infraestrutura que decide se dá para estudar, trabalhar ou acessar serviço público de casa. É também a desigualdade menos visível no mapa: não deixa marca na paisagem.',
      comoLer: 'Cores mais escuras indicam mais contratos por habitante.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.ideb_anos_iniciais',
    pillar: 'gente',
    label: 'IDEB anos iniciais',
    path: 'gente/ideb_anos_iniciais.json',
    format: 'decimal',
    card: {
      oQueE: 'A nota do município no IDEB, o Índice de Desenvolvimento da Educação Básica, para o 1º ao 5º ano da rede pública. Vai de 0 a 10 e combina duas coisas: quanto os alunos aprenderam em português e matemática, e quantos passaram de ano.',
      porQueImporta: 'É a medida oficial de qualidade da escola pública brasileira, e a única comparável entre todos os municípios. Os anos iniciais são onde a Paraíba vai melhor: vários municípios pequenos do interior superam a capital.',
      comoLer: 'Cores mais escuras indicam nota maior. Seis municípios não têm nota publicada, geralmente por terem poucos alunos avaliados, e aparecem hachurados.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.ideb_anos_finais',
    pillar: 'gente',
    label: 'IDEB anos finais',
    path: 'gente/ideb_anos_finais.json',
    format: 'decimal',
    card: {
      oQueE: 'A mesma nota do IDEB, agora para o 6º ao 9º ano da rede pública.',
      porQueImporta: 'A comparação entre as duas faixas é o dado mais revelador da educação paraibana: a mediana cai de 5,2 nos anos iniciais para 4,3 nos anos finais, e 209 dos 217 municípios com nota nas duas faixas pioram do 5º para o 9º ano. O aprendizado construído até o 5º ano não se sustenta depois dele, e isso quase não depende de qual município se olhe.',
      comoLer: 'Cores mais escuras indicam nota maior. Compare com a camada dos anos iniciais no mesmo município: a queda entre as duas costuma ser maior que a distância entre municípios vizinhos. A maior queda do estado é em Coxixola, de 8,2 para 5,5.',
    },
  },
  {
    kind: 'points',
    id: 'gente.escolas',
    pillar: 'gente',
    label: 'Escolas mapeadas',
    geoPath: 'gente/escolas.geojson',
    labelField: 'nome',
    sizeField: null,
    color: '#9b2f1f',
    unit: 'escola',
    detailFields: [
      { field: 'municipio', label: 'Município' },
      { field: 'operador', label: 'Operador' },
      { field: 'operador_tipo', label: 'Rede' },
      { field: 'nivel', label: 'Nível' },
    ],
    card: {
      oQueE: 'Escolas com posição registrada no OpenStreetMap, o mapa colaborativo. São 926 pontos na Paraíba, cada um conferido contra o polígono do seu município.',
      porQueImporta: 'É a única forma de ver escola como lugar no mapa, e não como nota média do município. O censo escolar do INEP conta cada escola do país mas não publica coordenada nenhuma, então não existe base oficial de onde as escolas ficam.',
      comoLer: 'Leia como onde há escola mapeada, nunca como quantas escolas existem. O OpenStreetMap é feito por voluntários, e o mapa mostra onde alguém mapeou: 71 municípios, com 13% da população do estado, não têm um único ponto. Cuité e Cacimba de Dentro têm mais pontos que Patos, o que diz mais sobre quem mapeou do que sobre a rede de ensino.',
    },
  },
]

export const layerById = (id: string | null) => (id ? LAYERS.find((layer) => layer.id === id) ?? null : null)
export const isFillLayer = (layer: AtlasLayer | null): layer is FillLayer => layer?.kind === 'choropleth' || layer?.kind === 'categorical'
export const isPointLayer = (layer: AtlasLayer | null): layer is PointLayer => layer?.kind === 'points'
