export interface BrazilState {
  sigla: string;
  nome: string;
  cidades: string[];
}

export const BRAZIL_STATES: BrazilState[] = [
  { sigla: "AC", nome: "Acre",              cidades: ["Rio Branco","Cruzeiro do Sul","Sena Madureira","Tarauacá","Feijó"] },
  { sigla: "AL", nome: "Alagoas",           cidades: ["Maceió","Arapiraca","Palmeira dos Índios","Rio Largo","Penedo","União dos Palmares"] },
  { sigla: "AM", nome: "Amazonas",          cidades: ["Manaus","Parintins","Itacoatiara","Manacapuru","Coari","Tefé"] },
  { sigla: "AP", nome: "Amapá",             cidades: ["Macapá","Santana","Laranjal do Jari","Oiapoque","Mazagão"] },
  { sigla: "BA", nome: "Bahia",             cidades: ["Salvador","Feira de Santana","Vitória da Conquista","Camaçari","Itabuna","Juazeiro","Lauro de Freitas","Ilhéus","Jequié","Alagoinhas","Barreiras"] },
  { sigla: "CE", nome: "Ceará",             cidades: ["Fortaleza","Caucaia","Juazeiro do Norte","Maracanaú","Sobral","Crato","Itapipoca","Maranguape","Iguatu","Quixadá"] },
  { sigla: "DF", nome: "Distrito Federal",  cidades: ["Brasília","Ceilândia","Taguatinga","Samambaia","Planaltina","Gama","Sobradinho","Recanto das Emas"] },
  { sigla: "ES", nome: "Espírito Santo",    cidades: ["Vitória","Serra","Vila Velha","Cariacica","Linhares","Cachoeiro de Itapemirim","Colatina","Guarapari"] },
  { sigla: "GO", nome: "Goiás",             cidades: ["Goiânia","Aparecida de Goiânia","Anápolis","Rio Verde","Luziânia","Águas Lindas de Goiás","Valparaíso de Goiás","Trindade","Formosa"] },
  { sigla: "MA", nome: "Maranhão",          cidades: ["São Luís","Imperatriz","São José de Ribamar","Timon","Caxias","Codó","Açailândia","Bacabal"] },
  { sigla: "MG", nome: "Minas Gerais",      cidades: ["Belo Horizonte","Uberlândia","Contagem","Juiz de Fora","Betim","Montes Claros","Ribeirão das Neves","Uberaba","Governador Valadares","Ipatinga","Sete Lagoas","Divinópolis","Patos de Minas","Poços de Caldas","Lavras"] },
  { sigla: "MS", nome: "Mato Grosso do Sul",cidades: ["Campo Grande","Dourados","Três Lagoas","Corumbá","Ponta Porã","Aquidauana"] },
  { sigla: "MT", nome: "Mato Grosso",       cidades: ["Cuiabá","Várzea Grande","Rondonópolis","Sinop","Tangará da Serra","Cáceres","Sorriso"] },
  { sigla: "PA", nome: "Pará",              cidades: ["Belém","Ananindeua","Santarém","Marabá","Parauapebas","Castanhal","Abaetetuba","Cametá"] },
  { sigla: "PB", nome: "Paraíba",           cidades: ["João Pessoa","Campina Grande","Santa Rita","Patos","Bayeux","Sousa","Cajazeiras"] },
  { sigla: "PE", nome: "Pernambuco",        cidades: ["Recife","Caruaru","Olinda","Petrolina","Paulista","Jaboatão dos Guararapes","Garanhuns","Vitória de Santo Antão","Cabo de Santo Agostinho"] },
  { sigla: "PI", nome: "Piauí",             cidades: ["Teresina","Parnaíba","Picos","Piripiri","Floriano","Campo Maior"] },
  { sigla: "PR", nome: "Paraná",            cidades: ["Curitiba","Londrina","Maringá","Ponta Grossa","Cascavel","São José dos Pinhais","Foz do Iguaçu","Colombo","Guarapuava","Paranaguá","Araucária","Toledo"] },
  { sigla: "RJ", nome: "Rio de Janeiro",    cidades: ["Rio de Janeiro","São Gonçalo","Duque de Caxias","Nova Iguaçu","Niterói","Belford Roxo","São João de Meriti","Petrópolis","Campos dos Goytacazes","Macaé","Volta Redonda"] },
  { sigla: "RN", nome: "Rio Grande do Norte",cidades: ["Natal","Mossoró","Parnamirim","São Gonçalo do Amarante","Ceará-Mirim","Caicó"] },
  { sigla: "RO", nome: "Rondônia",          cidades: ["Porto Velho","Ji-Paraná","Ariquemes","Vilhena","Cacoal","Rolim de Moura"] },
  { sigla: "RR", nome: "Roraima",           cidades: ["Boa Vista","Rorainópolis","Caracaraí","Caroebe"] },
  { sigla: "RS", nome: "Rio Grande do Sul", cidades: ["Porto Alegre","Caxias do Sul","Pelotas","Canoas","Santa Maria","Gravataí","Viamão","Novo Hamburgo","São Leopoldo","Rio Grande","Passo Fundo","Alvorada"] },
  { sigla: "SC", nome: "Santa Catarina",    cidades: ["Florianópolis","Joinville","Blumenau","São José","Chapecó","Itajaí","Jaraguá do Sul","Palhoça","Balneário Camboriú","Criciúma","Lages","Camboriú","Biguaçu","Tubarão","Concórdia"] },
  { sigla: "SE", nome: "Sergipe",           cidades: ["Aracaju","Nossa Senhora do Socorro","Lagarto","Itabaiana","São Cristóvão","Estância"] },
  { sigla: "SP", nome: "São Paulo",         cidades: ["São Paulo","Guarulhos","Campinas","São Bernardo do Campo","Santo André","Osasco","Ribeirão Preto","Sorocaba","São José dos Campos","Mauá","Santos","Mogi das Cruzes","Diadema","Jundiaí","Piracicaba","Carapicuíba","Bauru","São José do Rio Preto","Franca","Limeira","São Vicente","Taubaté","Praia Grande","Suzano","Guarujá"] },
  { sigla: "TO", nome: "Tocantins",         cidades: ["Palmas","Araguaína","Gurupi","Porto Nacional","Paraíso do Tocantins"] },
];
