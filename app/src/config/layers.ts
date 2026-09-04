import type { PillarId } from './pillars'

export interface LayerCardText {
  oQueE: string
  oQueMostra: string
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

export interface LineLayer extends LayerBase {
  kind: 'lines'
  geoPath: string
  labelField?: string
  /** Field whose value picks a color and width from `styles`. */
  classField?: string
  styles: Record<string, { color: string; width: number; label: string }>
  fallback: { color: string; width: number }
}

export type FillLayer = ChoroplethLayer | CategoricalLayer
export type AtlasLayer = FillLayer | PointLayer | LineLayer

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
      oQueMostra: 'A população é o denominador de quase todo indicador do atlas: crimes por 100 mil habitantes, postos de saúde por 10 mil, renda por pessoa. Também mostra onde a Paraíba se concentra: João Pessoa e Campina Grande somam cerca de um terço do estado.',
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
      oQueMostra: 'Existe para todos os 223 municípios, o que permite comparar o interior com a capital na mesma régua. Lida ao lado da pobreza, separa onde a renda vem de trabalho e onde vem de aposentadoria e transferência.',
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
      oQueMostra: 'Casas mais cheias costumam indicar famílias maiores, menos domicílios por pessoa ou moradia mais cara. É um dos poucos dados de moradia que existe para todos os municípios, já que não há índice oficial de preço de imóveis fora de João Pessoa.',
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
      oQueMostra: 'No semiárido, ter água encanada depende de um açude com volume e de uma adutora até a cidade. A cobertura por rede mostra onde a seca vira problema doméstico antes de virar problema agrícola.',
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
      oQueMostra: 'Esgoto coletado é o indicador de saneamento que mais separa cidade grande de interior. Também é o dado com mais lacunas: só uma parte dos municípios paraibanos informou o SINISA de esgoto em 2024.',
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
      oQueMostra: 'Municípios do interior envelhecem quando os jovens saem para estudar e trabalhar nas cidades grandes. A idade mediana mostra esse esvaziamento antes que a população total caia.',
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
      oQueMostra: 'Antecipa o que cada lugar vai precisar: escolas que esvaziam, postos que passam a atender mais idosos, aposentadorias que sustentam o comércio local.',
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
      oQueMostra: 'A escalada paraibana acontece nos mesmos granitos e gnaisses que formam os lajedos e as serras do pilar Terra. Sobrepor os setores ao mapa geológico mostra por que a rocha boa está onde está: quase tudo cai sobre embasamento cristalino do Pré-Cambriano.',
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
      oQueMostra: 'Quase toda a Paraíba está sobre rocha cristalina antiga, do Pré-Cambriano. Rocha cristalina não guarda água como areia guarda: a água só fica nas fraturas. É por isso que o Sertão depende de açude e não de poço, e é a mesma rocha que forma os lajedos e as paredes onde se escala.',
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
      oQueMostra: 'O solo decide o que cresce e quanta chuva fica guardada. Solo raso sobre rocha, comum na Borborema e no Cariri, perde água em dias; solo profundo do litoral segura por semanas. É a metade da história da seca que o mapa de chuva não conta.',
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
      oQueMostra: 'Onde há aquífero sedimentar, um poço resolve. Onde há só embasamento cristalino fraturado, que é a maior parte do estado, o poço depende de acertar uma fratura e a água costuma ser salobra. Isso explica por que o abastecimento do interior é feito de açude e adutora, não de poço.',
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
      oQueMostra: 'É onde a geologia da Paraíba fica visível a olho nu: as pegadas de dinossauro no Vale dos Dinossauros em Sousa, os blocos redondos do Lajedo de Pai Mateus em Cabaceiras, os campos de matacões do Cariri. Concentram-se em dois lugares, Sousa e o Cariri, e não por acaso.',
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
      oQueMostra: 'A Borborema é o degrau que separa o litoral úmido do Sertão seco. Ela barra a umidade que vem do mar, e por isso o Cariri, logo atrás dela, é uma das regiões mais secas do Brasil. Ver os pontos altos sobre o relevo 3D mostra esse muro.',
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
      oQueMostra: 'No semiárido o açude decide se a cidade tem água na torneira. A rocha cristalina que cobre quase todo o estado quase não guarda água subterrânea, então o abastecimento do interior depende de reservatório e adutora, não de poço. É onde o pilar responde se tem água ou não tem.',
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
      oQueMostra: 'A chuva no semiárido é irregular no espaço: dois municípios vizinhos podem receber volumes muito diferentes no mesmo mês. A densidade de postos mostra onde existe medição em terra para checar o que os modelos de clima estimam.',
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
      oQueMostra: 'Vem do atestado de óbito, então não depende de a polícia ter registrado o caso, que é a fragilidade das estatísticas criminais por município. Na Paraíba a violência letal não fica só na capital: cidades médias do interior aparecem em posições altas.',
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
      oQueMostra: 'Depende de pré-natal, parto assistido, saneamento e renda ao mesmo tempo, então quando cai é sinal de que várias coisas melhoraram juntas.',
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
      oQueMostra: 'Mostra quanta estrutura existe para cada morador. Não mede qualidade nem capacidade: um posto de saúde e um hospital regional contam igual.',
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
      oQueMostra: 'Mostra onde está a atividade econômica, que não é o mesmo lugar onde está a renda das pessoas. Compare com a renda domiciliar per capita: onde as duas discordam muito, a produção é de alguma planta industrial e não do trabalho local.',
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
      oQueMostra: 'Junta em um só número três dimensões que costumam andar juntas, e por isso serve de retrato geral quando se quer comparar municípios de tamanhos muito diferentes.',
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
      oQueMostra: 'Internet fixa é a infraestrutura que decide se dá para estudar, trabalhar ou acessar serviço público de casa. É também a desigualdade menos visível no mapa: não deixa marca na paisagem.',
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
      oQueMostra: 'É a medida oficial de qualidade da escola pública brasileira e existe para quase todos os municípios, o que permite comparar. Os anos iniciais são onde a Paraíba vai melhor: vários municípios pequenos do interior superam a capital.',
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
      oQueMostra: 'A comparação entre as duas faixas é o dado mais revelador da educação paraibana: a mediana cai de 5,2 nos anos iniciais para 4,3 nos anos finais, e 209 dos 217 municípios com nota nas duas faixas pioram do 5º para o 9º ano. O aprendizado construído até o 5º ano não se sustenta depois dele, e isso quase não depende de qual município se olhe.',
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
      oQueMostra: 'Mostra escola como lugar no mapa, e não como nota média do município. O censo escolar do INEP conta cada escola do país mas não publica coordenada nenhuma, então não existe base oficial de onde as escolas ficam.',
      comoLer: 'Leia como onde há escola mapeada, nunca como quantas escolas existem. O OpenStreetMap é feito por voluntários, e o mapa mostra onde alguém mapeou: 71 municípios, com 13% da população do estado, não têm um único ponto. Cuité e Cacimba de Dentro têm mais pontos que Patos, o que diz mais sobre quem mapeou do que sobre a rede de ensino.',
    },
  },
  {
    kind: 'categorical',
    id: 'terra.dominios_hidro',
    pillar: 'terra',
    label: 'Domínio hidrogeológico',
    geoPath: 'geo/terra/aquiferos.geojson',
    classesPath: 'geo/terra/aquiferos_classes.json',
    classesKey: 'dominio',
    classField: 'dominio',
    colors: {
      Fr: '#a8567c',
      Gr: '#d9a441',
      K: '#3f7a6b',
    },
    card: {
      oQueE: 'Como a rocha de cada área guarda água, em três tipos. Granular guarda entre os grãos, como uma esponja. Fraturada só guarda nas rachaduras da rocha. Cárstica guarda em cavidades dissolvidas no calcário.',
      oQueMostra: 'A rocha fraturada cobre 86% da área do estado, e nela um poço só dá água se acertar uma fratura, com vazão pequena e água muitas vezes salobra. As faixas granulares, que sustentariam poços de verdade, ficam nos vales e no litoral. Daí a seca ser um problema de rocha antes de ser de chuva.',
      comoLer: 'Três cores para três tipos de rocha. Repare no descompasso entre área e número de manchas: o domínio fraturado é uma massa contínua de 40 polígonos, enquanto o granular são 475 manchas estreitas ao longo dos rios. A porcentagem é da área do estado, não da contagem.',
    },
  },
  {
    kind: 'lines',
    id: 'terra.rodovias',
    pillar: 'terra',
    label: 'Rodovias',
    geoPath: 'terra/rodovias.geojson',
    labelField: 'ref',
    classField: 'jurisdicao',
    styles: {
      federal: { color: '#7d2b12', width: 2.6, label: 'Federal (BR)' },
      estadual: { color: '#b5762a', width: 1.4, label: 'Estadual (PB)' },
    },
    fallback: { color: '#8a7a66', width: 1 },
    card: {
      oQueE: 'As rodovias federais e estaduais da Paraíba, do OpenStreetMap. São 12 rodovias federais somando 1.962 km e 133 estaduais somando 4.508 km.',
      oQueMostra: 'Estrada é como a Paraíba se move: não há malha ferroviária de passageiros fora de um trecho no litoral, e nenhuma linha de ônibus do estado publica horário em formato aberto. A BR-230 atravessa o estado inteiro por 687 km, do litoral ao Sertão, e é o eixo ao longo do qual quase tudo se organiza.',
      comoLer: 'Traço grosso escuro é rodovia federal, traço fino claro é estadual. Aproxime o mapa para ver as siglas.',
    },
  },
  {
    kind: 'lines',
    id: 'terra.ferrovia',
    pillar: 'terra',
    label: 'Trem urbano',
    geoPath: 'terra/ferrovia.geojson',
    labelField: 'nome',
    classField: 'tipo',
    styles: {
      linha: { color: '#1e5f66', width: 3, label: 'Linha' },
      estacao: { color: '#1e5f66', width: 2, label: 'Estação' },
    },
    fallback: { color: '#1e5f66', width: 2 },
    card: {
      oQueE: 'A linha de trem urbano operada pela CBTU, com 31 km entre Santa Rita e Cabedelo passando por João Pessoa, e suas 13 estações.',
      oQueMostra: 'É o único transporte sobre trilhos de passageiros em atividade na Paraíba. Toda a malha ferroviária do interior, construída para escoar algodão, está desativada.',
      comoLer: 'A linha e as estações da única rota em operação. O mapa acaba aqui: não existe dado aberto de itinerário ou horário de ônibus em nenhum município do estado.',
    },
  },
  {
    kind: 'points',
    id: 'terra.rodoviarias',
    pillar: 'terra',
    label: 'Terminais de ônibus',
    geoPath: 'terra/rodoviarias.geojson',
    labelField: 'nome',
    sizeField: null,
    color: '#5c4630',
    unit: 'terminal',
    detailFields: [
      { field: 'municipio', label: 'Município' },
      { field: 'operador', label: 'Operador' },
    ],
    card: {
      oQueE: 'Terminais de ônibus mapeados no OpenStreetMap: 68 pontos em 38 dos 223 municípios, misturando rodoviárias intermunicipais e terminais urbanos, porque o mapa colaborativo usa a mesma etiqueta para os dois.',
      oQueMostra: 'O ônibus é como a maioria dos paraibanos viaja entre cidades, e a rodoviária é o ponto por onde isso passa.',
      comoLer: 'Leia como onde há terminal mapeado, não como a rede completa. Nenhuma operadora da Paraíba publica itinerário em formato aberto, então não há como mostrar para onde vai cada linha nem a que horas.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.cor_preta_parda',
    pillar: 'gente',
    label: 'População preta e parda',
    path: 'gente/cor_preta_parda.json',
    format: 'percent',
    card: {
      oQueE: 'A parcela dos moradores que se declarou preta ou parda ao Censo de 2022. As duas categorias somadas são como a estatística brasileira costuma medir a população negra, e a declaração é do próprio morador.',
      oQueMostra: 'Mostra como a população paraibana se distribui entre um Sertão de colonização pecuarista e um litoral de engenho, e permite ler qualquer outra camada do atlas contra essa distribuição.',
      comoLer: 'Cores mais escuras indicam parcela maior. Não há lado bom nem ruim nesta camada, então a comparação não marca melhor e pior. Marcação aparece com a menor parcela porque é terra indígena Potiguara, onde a maioria se declara indígena.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.pobreza',
    pillar: 'gente',
    label: 'Famílias no CadÚnico',
    path: 'gente/pobreza.json',
    format: 'decimal',
    card: {
      oQueE: 'Famílias inscritas no Cadastro Único, o registro federal de quem tem baixa renda e pode receber benefícios sociais, para cada 100 domicílios do município.',
      oQueMostra: 'É atualizada todo mês, enquanto o Censo sai a cada dez anos. Onde o número é alto, a maior parte das casas depende de transferência de renda.',
      comoLer: 'Cores mais escuras indicam mais famílias cadastradas por domicílio. Um município passa de 100 porque família do CadÚnico e domicílio do Censo não são a mesma unidade, e o cadastro acumula registros antigos.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.moradia_alugada',
    pillar: 'gente',
    label: 'Domicílios alugados',
    path: 'gente/moradia_alugada.json',
    format: 'percent',
    card: {
      oQueE: 'A parcela dos domicílios do município que é alugada, segundo o Censo de 2022.',
      oQueMostra: 'O Censo de 2022 não publicou valor de aluguel para nenhum município, então o que sobra é quantos alugam. Onde quase ninguém aluga, não há preço a medir: a casa se herda ou se constrói.',
      comoLer: 'Cores mais escuras indicam mais aluguel. Compare com a camada de domicílios próprios: as duas quase se completam, e a diferença é a moradia cedida, comum na zona rural.',
    },
  },
  {
    kind: 'choropleth',
    id: 'gente.moradia_propria',
    pillar: 'gente',
    label: 'Domicílios próprios',
    path: 'gente/moradia_propria.json',
    format: 'percent',
    card: {
      oQueE: 'A parcela dos domicílios do município cujos moradores são donos da casa, segundo o Censo de 2022.',
      oQueMostra: 'Casa própria em município pequeno raramente significa patrimônio: significa que não existe mercado de aluguel e que a casa foi construída ou herdada. É por isso que a camada não marca melhor e pior.',
      comoLer: 'Cores mais escuras indicam mais domicílios próprios. Os municípios com maior taxa são os menores do estado, não os mais ricos.',
    },
  },
]

export const layerById = (id: string | null) => (id ? LAYERS.find((layer) => layer.id === id) ?? null : null)
export const isFillLayer = (layer: AtlasLayer | null): layer is FillLayer => layer?.kind === 'choropleth' || layer?.kind === 'categorical'
export const isPointLayer = (layer: AtlasLayer | null): layer is PointLayer => layer?.kind === 'points'
export const isLineLayer = (layer: AtlasLayer | null): layer is LineLayer => layer?.kind === 'lines'
export const isOverlayLayer = (layer: AtlasLayer | null): layer is PointLayer | LineLayer =>
  isPointLayer(layer) || isLineLayer(layer)
