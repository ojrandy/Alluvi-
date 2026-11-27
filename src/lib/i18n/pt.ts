/**
 * Brazilian Portuguese (pt-BR) copy, keyed by the exact English source string (ADR-018).
 * A missing key falls back to English, so untranslated text never disappears.
 *
 * Scope: site chrome (nav, footer, notices), home page, cart and checkout, and the research-use
 * disclaimers. Product descriptions and legal policies stay in English until a human translator
 * has reviewed them. Compliance wording must stay a faithful translation: no dosing or human-use language.
 */
export const PT: Record<string, string> = {
  // --- nav / chrome ---
  Shop: "Loja",
  Verify: "Verificar",
  "About Us": "Sobre nós",
  Track: "Rastrear",
  "Alluvi Brazil": "Alluvi Brasil",
  "Skip to content": "Pular para o conteúdo",
  "My account": "Minha conta",
  "Open menu": "Abrir menu",
  "Site navigation": "Navegação do site",
  Mobile: "Navegação móvel",
  "Browse Research Peptides": "Ver peptídeos de pesquisa",
  Announcements: "Comunicados",
  "Spot a Fake": "Identifique falsificações",
  Wholesale: "Atacado",
  "Press Release": "Comunicado de imprensa",
  "(opens in a new tab)": "(abre em uma nova aba)",
  "Join us on Telegram": "Junte-se a nós no Telegram",
  "Important notices": "Avisos importantes",
  "Alluvi home": "Página inicial da Alluvi",

  // --- announcements ---
  "FREE SHIPPING": "FRETE GRÁTIS",
  "Free shipping on every order for our first 60 days.": "Frete grátis em todos os pedidos nos nossos primeiros 60 dias.",
  "SOCIAL MEDIA WARNING": "AVISO SOBRE REDES SOCIAIS",
  "Our only official channels are Telegram @ukalluvi and our WhatsApp linked on this site. Please don't make any payments or fall victim to anything else claiming to be Alluvi on social media platforms.":
    "Nossos únicos canais oficiais são o Telegram @ukalluvi e o nosso WhatsApp indicado neste site. Não faça pagamentos nem caia em golpes de perfis que se passam pela Alluvi nas redes sociais.",
  "OFFICIAL SITE": "SITE OFICIAL",
  "Our official site is www.alluvihealthcare.co, we are only handling this site. Please Beware of other scam sites.":
    "Nosso site oficial é www.alluvihealthcare.co e operamos somente este site. Cuidado com outros sites fraudulentos.",
  "SECURITY ALERT": "ALERTA DE SEGURANÇA",
  "Fake websites impersonating Alluvi are appearing in Google search results. These sites are not affiliated with us in any way. Please do not interact with them or share any personal or payment information.":
    "Sites falsos que se passam pela Alluvi estão aparecendo nos resultados de busca do Google. Esses sites não têm nenhuma ligação conosco. Não interaja com eles nem compartilhe dados pessoais ou de pagamento.",
  "RESEARCH USE ONLY, NOT FOR HUMAN CONSUMPTION": "SOMENTE PARA PESQUISA, NÃO PARA CONSUMO HUMANO",
  "All products are for laboratory research and in vitro studies only. Not for human or veterinary use.":
    "Todos os produtos destinam-se exclusivamente à pesquisa laboratorial e a estudos in vitro. Não destinados a uso humano ou veterinário.",

  // --- footer ---
  "Janoshik third-party tested": "Testado de forma independente pela Janoshik",
  "UV authenticity mark": "Marca de autenticidade UV",
  "Tracked UK & EU dispatch": "Envio rastreado para Reino Unido e UE",
  "25+ ways to pay": "Mais de 25 formas de pagamento",
  "Alluvi Labs develops and evaluates premium peptides and supplements, produced exclusively for controlled research and development purposes.":
    "A Alluvi Labs desenvolve e avalia peptídeos e suplementos premium, produzidos exclusivamente para fins controlados de pesquisa e desenvolvimento.",
  Footer: "Rodapé",
  "All research peptides": "Todos os peptídeos de pesquisa",
  "Track your order": "Rastreie seu pedido",
  "Order on Telegram": "Peça pelo Telegram",
  "Chat on WhatsApp": "Converse pelo WhatsApp",
  Company: "Empresa",
  Home: "Início",
  "Our Location": "Nossa localização",
  Contact: "Contato",
  Authenticity: "Autenticidade",
  "Verify your product": "Verifique seu produto",
  "Fake sellers watchlist": "Lista de vendedores falsos",
  Policies: "Políticas",
  "Refund Policy": "Política de reembolso",
  "Shipping Policy": "Política de envio",
  "Privacy Policy": "Política de privacidade",
  "Terms Of Service": "Termos de serviço",
  "FOR LABORATORY RESEARCH AND DEVELOPMENT USE ONLY — NOT FOR HUMAN OR VETERINARY CONSUMPTION.":
    "SOMENTE PARA USO EM PESQUISA E DESENVOLVIMENTO LABORATORIAL — NÃO DESTINADO AO CONSUMO HUMANO OU VETERINÁRIO.",
  "© {year} Alluvi. All rights reserved.": "© {year} Alluvi. Todos os direitos reservados.",

  // --- disclaimers ---
  "For laboratory research use only. Not for human consumption.":
    "Somente para uso em pesquisa laboratorial. Não destinado ao consumo humano.",
  "For laboratory research and development use only — not for human or veterinary consumption.":
    "Somente para uso em pesquisa e desenvolvimento laboratorial — não destinado ao consumo humano ou veterinário.",
  "For laboratory research and development use only. Not for human or veterinary consumption.":
    "Somente para uso em pesquisa e desenvolvimento laboratorial. Não destinado ao consumo humano ou veterinário.",
  "Not for human or veterinary consumption.": "Não destinado ao consumo humano ou veterinário.",

  "MANDATORY DISCLAIMER: This product is used solely for in vitro experiments and cannot be: (1) Used in clinical trials involving humans, (2) Administered to humans as part of an experiment or investigation, or (3) Supplied to another party for human investigational use. The information provided is for educational purposes only.":
    "AVISO OBRIGATÓRIO: Este produto destina-se exclusivamente a experimentos in vitro e não pode ser: (1) utilizado em ensaios clínicos envolvendo seres humanos, (2) administrado a seres humanos como parte de um experimento ou investigação, nem (3) fornecido a terceiros para uso investigacional em seres humanos. As informações fornecidas têm finalidade exclusivamente educacional.",

  // --- cart / product card ---
  "Your cart": "Seu carrinho",
  "Review the items in your cart and go to checkout.": "Revise os itens do seu carrinho e siga para o checkout.",
  "Your cart is empty": "Seu carrinho está vazio",
  "Browse our Janoshik-tested research compounds.": "Conheça nossos compostos de pesquisa testados pela Janoshik.",
  "Shop research peptides": "Comprar peptídeos de pesquisa",
  "Cart items": "Itens do carrinho",
  each: "cada",
  Subtotal: "Subtotal",
  "Shipping and final total are calculated at checkout.": "O frete e o total final são calculados no checkout.",
  Checkout: "Finalizar compra",
  "Out of stock": "Esgotado",
  "Max in cart": "Máximo no carrinho",
  "Add to cart": "Adicionar ao carrinho",
  "Maximum quantity in cart": "Quantidade máxima no carrinho",
  Quantity: "Quantidade",
  "Decrease quantity": "Diminuir quantidade",
  "Increase quantity": "Aumentar quantidade",
  "Open cart": "Abrir carrinho",
  Was: "De",
  Now: "Por",

  // --- home: hero ---
  "Advancing discovery through": "Impulsionando a descoberta por meio da pesquisa",
  research: "",
  "Alluvi Labs develops and evaluates": "A Alluvi Labs desenvolve e avalia",
  "premium peptides and supplements": "peptídeos e suplementos premium",
  "All products are produced exclusively": "Todos os produtos são produzidos exclusivamente",
  "for controlled research and development purposes, guided by science.":
    "para fins controlados de pesquisa e desenvolvimento, guiados pela ciência.",
  "Learn About Alluvi": "Conheça a Alluvi",
  "Alluvi research app on iPhone": "App de pesquisa Alluvi no iPhone",

  // --- home: product marquee ---
  "Engineered for": "Desenvolvido para",
  "research precision.": "precisão em pesquisa.",

  // --- home: testing steps ---
  "Quality Assurance Protocol": "Protocolo de garantia de qualidade",
  "Independently verified.": "Verificado de forma independente.",
  "Trusted through testing.": "Confiável porque é testado.",
  "Protocol steps": "Etapas do protocolo",
  Step: "Etapa",
  "Batch Production": "Produção do lote",
  "Research peptides are synthesised under controlled laboratory conditions, with weekly internal documented formulation testing.":
    "Os peptídeos de pesquisa são sintetizados em condições laboratoriais controladas, com testes internos semanais e documentados da formulação.",
  "Third-Party Lab Testing": "Testes em laboratório independente",
  "Alluvi randomly selects a batch of pens from thousands to be sent to Janoshik, a globally recognised laboratory, for fully independent verification. Janoshik then randomly selects one pen for testing.":
    "A Alluvi seleciona aleatoriamente um lote de canetas, entre milhares, para envio à Janoshik, um laboratório reconhecido mundialmente, para verificação totalmente independente. A Janoshik então escolhe aleatoriamente uma caneta para teste.",
  "Purity & Potency Analysis": "Análise de pureza e potência",
  "Analytical testing confirms purity percentage and potency before any batch is approved for release.":
    "Testes analíticos confirmam o percentual de pureza e a potência antes de qualquer lote ser aprovado para liberação.",
  "Weekly Internal QC": "Controle de qualidade interno semanal",
  "Weekly internal quality-control testing checks consistency and traceability across all research products.":
    "Testes semanais de controle de qualidade interno verificam a consistência e a rastreabilidade de todos os produtos de pesquisa.",
  "Verified & Released": "Verificado e liberado",
  "A certificate of analysis is recorded and released to the public, strictly for research and development use.":
    "Um certificado de análise é registrado e divulgado ao público, estritamente para uso em pesquisa e desenvolvimento.",
  "Certificate of Analysis": "Certificado de análise",
  "Request Certificate of Analysis": "Solicitar certificado de análise",
  "View Janoshik Analytical Report": "Ver relatório analítico da Janoshik",
  "Independent Janoshik verification for this batch is in progress. The certificate and its verification link will be published here once issued.":
    "A verificação independente da Janoshik para este lote está em andamento. O certificado e o link de verificação serão publicados aqui assim que forem emitidos.",
  Document: "Documento",
  Laboratory: "Laboratório",
  Pending: "Pendente",
  Verified: "Verificado",
  Analyzing: "Analisando",
  "Previous step": "Etapa anterior",
  "Next step": "Próxima etapa",

  // --- home: pens stability ---
  "Stability Record — RT·56": "Registro de estabilidade — TA·56",
  "What Makes Alluvi Pens Better?": "O que torna as canetas Alluvi melhores?",
  "Alluvi peptides from Alluvi Labs creates its own solution process designed to keep Alluvi APIs in the right environment from start to finish.":
    "Os peptídeos da Alluvi Labs usam um processo de solução próprio, projetado para manter os IFAs da Alluvi no ambiente certo do início ao fim.",
  "That means stronger support for purity, target pH, and consistent peptide content, once in an Alluvi pen, under the harshest storage conditions.":
    "Isso significa mais suporte à pureza, ao pH ideal e a um teor de peptídeo consistente dentro de uma caneta Alluvi, mesmo nas condições de armazenamento mais severas.",
  "While others say 28 days in the fridge then throw it away,": "Enquanto outros dizem 28 dias na geladeira e depois descarte,",
  "Alluvi put it to the test.": "a Alluvi colocou isso à prova.",
  "Room-temperature hold": "Armazenamento em temperatura ambiente",
  "Janoshik · Independent": "Janoshik · Independente",
  "Days held at": "Dias mantida em",
  "room temperature": "temperatura ambiente",
  "Day 0": "Dia 0",
  "Day 56": "Dia 56",
  "A 40 mg Retatrutide Alluvi pen was held at room temperature for 56 days and independently tested through Janoshik.":
    "Uma caneta Alluvi de Retatrutide 40 mg foi mantida em temperatura ambiente por 56 dias e testada de forma independente pela Janoshik.",
  Purity: "Pureza",
  Strong: "Alta",
  Content: "Teor",
  Stable: "Estável",
  "Within range": "Dentro da faixa",
  "This is why vials and Temu version peptide brands don't come close. Don't put your health at risk to save some quid.":
    "É por isso que frascos e marcas de peptídeos genéricas nem chegam perto. Não arrisque a qualidade da sua pesquisa para economizar alguns trocados.",

  // --- home: stability stages ---
  "Alluvi Retatrutide 40mg Long Term Stability Test": "Teste de estabilidade de longo prazo — Alluvi Retatrutide 40 mg",
  "56 Day Room Temperature, Purity and Degradation Test": "Teste de 56 dias em temperatura ambiente: pureza e degradação",
  "Tracking the purity & stability of a 40 mg Retatrutide filled Alluvi pen across a full 56 day hold, with independent Janoshik verification at each checkpoint.":
    "Acompanhamento da pureza e da estabilidade de uma caneta Alluvi com 40 mg de Retatrutide durante 56 dias completos, com verificação independente da Janoshik em cada etapa.",
  "Stage 1": "Etapa 1",
  "Stage 2": "Etapa 2",
  "Exactly 40 mg Retatrutide 2.4ml filled into an Alluvi pen, held at room temperature for 22 days.":
    "Exatamente 40 mg de Retatrutide em 2,4 ml envasados em uma caneta Alluvi, mantida em temperatura ambiente por 22 dias.",
  "Sent to Janoshik for independent testing on day 28.": "Enviada à Janoshik para teste independente no dia 28.",
  "Purity:": "Pureza:",
  "Verified content:": "Teor verificado:",
  "Measured difference:": "Diferença medida:",
  "View Test Result": "Ver resultado do teste",
  "Further 33 day room temperature hold in Janoshik custody.":
    "Mais 33 dias em temperatura ambiente sob custódia da Janoshik.",
  "Result:": "Resultado:",
  "pH:": "pH:",
  "Total change:": "Variação total:",
  "Purity change:": "Variação de pureza:",
  "Total days room temp storage:": "Total de dias em temperatura ambiente:",
  "Link to Degradation test": "Link para o teste de degradação",
  "Link to pH test": "Link para o teste de pH",
  change: "de variação",
  days: "dias",

  // --- home: app coming soon ---
  "The Alluvi research and development App is Coming Soon": "O app de pesquisa e desenvolvimento da Alluvi chega em breve",
  "Start your free trial soon and see how easy it is to track, manage, and optimize your time.":
    "Em breve, comece seu teste grátis e veja como é fácil acompanhar, gerenciar e otimizar seu tempo.",
  "Download on the App Store (coming soon)": "Baixar na App Store (em breve)",
  "Get it on Google Play (coming soon)": "Disponível no Google Play (em breve)",
  "Alluvi research app home screen, dark mode": "Tela inicial do app de pesquisa Alluvi, modo escuro",

  // --- home: research platform ---
  "More than peptides.": "Mais do que peptídeos.",
  "A Complete Research Platform.": "Uma plataforma de pesquisa completa.",
  "From research-grade compounds to structured data collection and nutritional analysis – Alluvi provides an integrated system designed for controlled research and development programs.":
    "De compostos de grau de pesquisa à coleta estruturada de dados e análise nutricional – a Alluvi oferece um sistema integrado, projetado para programas controlados de pesquisa e desenvolvimento.",
  "Smart Tracking": "Acompanhamento inteligente",
  "Log every research observation with structured data capture built for controlled R&D programs.":
    "Registre cada observação de pesquisa com captura estruturada de dados, criada para programas controlados de P&D.",
  "Alluvi research dashboard": "Painel de pesquisa da Alluvi",
  "Consistency Is Key": "Consistência é fundamental",
  "Stay on track with monthly research supply boxes.": "Mantenha o ritmo com caixas mensais de suprimentos de pesquisa.",
  "Alluvi monthly research supply box": "Caixa mensal de suprimentos de pesquisa Alluvi",
  "Scheduled Supply": "Fornecimento programado",
  "Precision Pens": "Canetas de precisão",
  "Pre-filled Retatrutide systems – sleek, pre-measured, and designed for evaluation in controlled research settings only.":
    "Sistemas de Retatrutide pré-envasados – elegantes, pré-medidos e projetados apenas para avaliação em ambientes controlados de pesquisa.",
  "Alluvi precision dosing pen": "Caneta de precisão Alluvi",
  "From compound": "Do composto",
  "to data.": "aos dados.",
  "Research-grade compounds, structured data capture, scheduled supply, and precision dosing devices — one connected system for controlled R&D programs.":
    "Compostos de grau de pesquisa, captura estruturada de dados, fornecimento programado e dispositivos de precisão — um sistema conectado para programas controlados de P&D.",

  // --- home: verify popup ---
  "Is your Alluvi fake? Packaging and security update": "Sua Alluvi é falsa? Atualização de embalagem e segurança",
  "Check your product's authenticity marks with the official Alluvi verifier.":
    "Confira as marcas de autenticidade do seu produto no verificador oficial da Alluvi.",
  "Verify now": "Verificar agora",
  Close: "Fechar",

  // --- contact page ---
  "Get in touch with Alluvi": "Fale com a Alluvi",
  "Our only official channels are listed here. Please don't make payments to anyone claiming to be Alluvi elsewhere.":
    "Nossos únicos canais oficiais estão listados aqui. Não faça pagamentos a ninguém que diga ser a Alluvi em outros lugares.",
  "Certificates of analysis": "Certificados de análise",
  "Request a certificate": "Solicitar um certificado",
  "Official channels": "Canais oficiais",

  // --- checkout ---
  "Secure checkout": "Checkout seguro",
  "Loading checkout": "Carregando checkout",
  "Add a research compound to your cart to check out.": "Adicione um composto de pesquisa ao carrinho para finalizar a compra.",
  "Browse the shop": "Ver a loja",
  "Signed in. This order will be saved to your account.": "Você está conectado. Este pedido será salvo na sua conta.",
  "Have an account?": "Já tem uma conta?",
  "Sign in": "Entre",
  "to use your saved details. Or continue as a guest.": "para usar seus dados salvos. Ou continue como visitante.",
  Email: "E-mail",
  Phone: "Telefone",
  "For delivery updates from the courier.": "Para atualizações de entrega da transportadora.",
  "Delivery address": "Endereço de entrega",
  "First name": "Nome",
  "Last name": "Sobrenome",
  Country: "País",
  Address: "Endereço",
  "Apartment, suite, etc.": "Complemento (apto., sala etc.)",
  "Town / city": "Cidade",
  Postcode: "CEP / código postal",
  "(optional)": "(opcional)",
  Shipping: "Frete",
  Free: "Grátis",
  Payment: "Pagamento",
  // payment method picker (ADR-021); brand names stay as they are
  "How would you like to pay?": "Como você prefere pagar?",
  "Select a payment method": "Selecione uma forma de pagamento",
  "Choose how you'd like to pay": "Escolha como você prefere pagar",
  "That payment method is no longer available. Please choose another.": "Essa forma de pagamento não está mais disponível. Escolha outra.",
  "Nothing to pay now.": "Nada a pagar agora.",
  "Choose your preferred method. After you order, our team emails you the payment details for it.":
    "Escolha sua forma preferida. Depois do pedido, nossa equipe envia por e-mail os dados de pagamento correspondentes.",
  "We dispatch as soon as your payment is confirmed.": "Enviamos assim que o pagamento for confirmado.",
  "Bank transfer": "Transferência bancária",
  "Payment apps & wallets": "Apps de pagamento e carteiras",
  "Money transfer services": "Serviços de transferência de dinheiro",
  Cryptocurrency: "Criptomoedas",
  Other: "Outro",
  "Faster Payments, GBP": "Faster Payments, GBP",
  "ACH or domestic wire, USD": "ACH ou transferência doméstica, USD",
  "Euro bank transfer": "Transferência bancária em euros",
  "SWIFT transfer, any country": "Transferência SWIFT, qualquer país",
  Worldwide: "Mundial",
  "US bank accounts": "Contas bancárias nos EUA",
  "US & UK": "EUA e Reino Unido",
  US: "EUA",
  "US, via Messages or Wallet": "EUA, via Mensagens ou Wallet",
  "UK, EU & worldwide": "Reino Unido, UE e mundo",
  "Worldwide, multi-currency": "Mundial, várias moedas",
  UK: "Reino Unido",
  EU: "UE",
  "Worldwide, cash or bank": "Mundial, em dinheiro ou banco",
  "International transfers": "Transferências internacionais",
  "Bitcoin network": "Rede Bitcoin",
  "Ethereum mainnet": "Rede principal Ethereum",
  "TRC-20 or ERC-20": "TRC-20 ou ERC-20",
  "ERC-20, Solana or Base": "ERC-20, Solana ou Base",
  "Litecoin network": "Rede Litecoin",
  "Solana network": "Rede Solana",
  "XRP Ledger": "XRP Ledger",
  "Any supported coin": "Qualquer moeda suportada",
  "Tell us in the order note": "Informe na observação do pedido",
  "Order note": "Observação do pedido",
  "Create an account with these details": "Criar uma conta com estes dados",
  Password: "Senha",
  "At least 10 characters.": "Pelo menos 10 caracteres.",
  "Optional. Guest checkout works exactly the same.": "Opcional. A compra como visitante funciona exatamente igual.",
  "I confirm I am 18 or over, that these products are for laboratory research use only and not for human consumption, and I agree to the":
    "Confirmo que tenho 18 anos ou mais, que estes produtos destinam-se somente ao uso em pesquisa laboratorial e não ao consumo humano, e concordo com os",
  "Terms of Service": "Termos de serviço",
  and: "e a",
  "Placing order…": "Enviando pedido…",
  "Place order": "Fazer pedido",
  "Order summary": "Resumo do pedido",
  "Updating totals": "Atualizando totais",
  Qty: "Qtd.",
  "Not available in this quantity": "Indisponível nesta quantidade",
  Total: "Total",
  "Prices are confirmed from our catalogue when you place the order. Payment details are emailed to you after you order.":
    "Os preços são confirmados pelo nosso catálogo no momento do pedido. Os dados de pagamento são enviados por e-mail após o pedido.",
  "Free shipping": "Frete grátis",
  // default shipping options + promo (admin-editable; edited labels fall back to English)
  "UK tracked & signed for": "Reino Unido — rastreado e com assinatura",
  "Typically delivered the next working day after dispatch.": "Normalmente entregue no próximo dia útil após o envio.",
  "International tracked": "Internacional rastreado",
  "Usually 3–10 working days. Customs duties are the buyer's responsibility.": "Normalmente de 3 a 10 dias úteis. Taxas alfandegárias são de responsabilidade do comprador.",
  "Free shipping on every order for our first 60 days": "Frete grátis em todos os pedidos nos nossos primeiros 60 dias",

  // --- checkout validation / server messages ---
  "Enter a valid email address": "Informe um e-mail válido",
  "Enter a valid phone number": "Informe um telefone válido",
  "Enter a valid UK postcode": "Informe um código postal válido do Reino Unido",
  "First name is required": "Informe o nome",
  "Last name is required": "Informe o sobrenome",
  "Address is required": "Informe o endereço",
  "Town / city is required": "Informe a cidade",
  "Postcode is required": "Informe o CEP / código postal",
  "First name is too long": "Nome muito longo",
  "Last name is too long": "Sobrenome muito longo",
  "Address is too long": "Endereço muito longo",
  "Town / city is too long": "Nome da cidade muito longo",
  "Postcode is too long": "CEP / código postal muito longo",
  "Too long": "Muito longo",
  "Select a country": "Selecione um país",
  "Choose a shipping option": "Escolha uma opção de frete",
  "Choose a shipping option.": "Escolha uma opção de frete.",
  "Use at least 10 characters": "Use pelo menos 10 caracteres",
  "Password is too long": "Senha muito longa",
  "You must confirm research use, age and terms to continue":
    "Você precisa confirmar o uso em pesquisa, a idade e os termos para continuar",
  "Your cart is empty.": "Seu carrinho está vazio.",
  "Please check the highlighted fields.": "Verifique os campos destacados.",
  "Too many order attempts. Please wait a few minutes and try again.":
    "Muitas tentativas de pedido. Aguarde alguns minutos e tente novamente.",
  "We couldn't place your order. Please try again, or contact support if it keeps happening.":
    "Não foi possível fazer o seu pedido. Tente novamente ou fale com o suporte se o problema continuar.",
  "This shipping option is only available for UK addresses.": "Esta opção de frete está disponível apenas para endereços no Reino Unido.",
  "Choose UK shipping for a UK address.": "Escolha o frete do Reino Unido para um endereço no Reino Unido.",
};
