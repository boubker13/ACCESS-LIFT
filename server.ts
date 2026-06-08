import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    })
  : null;

// Product Database - Wheelchair Lift Models imported from China
const LIFT_CATALOG = [
  {
    id: "CL-100",
    name: "Elevador Hidráulico Mono-Braço (Série Compacta)",
    nameAr: "رافعة هيدروليكية ذات ذراع أحادية (السلسلة المدمجة)",
    manufacturerUrl: "https://www.alibaba.com/trade/search?SearchText=wheelchair+lift+bus",
    category: "Minibus / Van",
    capacityKg: 300,
    platformSize: "1050mm x 750mm",
    powerRequired: "12V / 24V DC",
    basePriceUSD: 1250,
    features: [
      "تصميم مدمج وموفر للمساحة يناسب الأبواب الخلفية أو الجانبية",
      "لوحة منصة مضادة للانزلاق مع مصدات حماية أوتوماتيكية",
      "مثالي لحافلات Toyota Coaster وحافلات Mercedes Sprinter"
    ],
    featuresFr: [
      "Conception compacte idéale pour les portes arrière ou latérales",
      "Plateforme antidérapante avec barrières de sécurité automatiques",
      "Parfaitement adapté aux minibus de type Toyota Coaster et Mercedes Sprinter"
    ],
    installationTimeHours: 6
  },
  {
    id: "CL-250",
    name: "Elevador Automático de Braço Duplo (Série Pesada)",
    nameAr: "رافعة أوتوماتيكية ذات ذراع مزدوجة (السلسلة الثقيلة)",
    manufacturerUrl: "https://www.alibaba.com/trade/search?SearchText=double+arm+wheelchair+lift+bus",
    category: "Bus Urbain",
    capacityKg: 350,
    platformSize: "1200mm x 800mm",
    powerRequired: "24V DC",
    basePriceUSD: 1850,
    features: [
      "هيكل فولاذي متين ذو قوة تحمل عالية للمحطات الحضرية المزدحمة",
      "نظام تشغيل هيدروليكي كهربائي بالكامل مع تحكم يدوي للطوارئ",
      "متوافقة تماماً مع حافلات النقل الحضري الكبيرة (مثل SNVI Safir)"
    ],
    featuresFr: [
      "Structure en acier renforcé à haute résistance pour un usage urbain intensif",
      "Système électro-hydraulique complet avec commande de secours manuelle",
      "Entièrement compatible avec les grands bus urbains (ex: SNVI Safir)"
    ],
    installationTimeHours: 10
  },
  {
    id: "CL-500",
    name: "Elevador Embutido de Baixo do Chassi (Série Gaveta)",
    nameAr: "رافعة مدمجة تحت هيكل الحافلة (سلسلة الدرج)",
    category: "Bus Moderne",
    capacityKg: 300,
    platformSize: "1150mm x 800mm",
    powerRequired: "24V DC",
    basePriceUSD: 2450,
    features: [
      "يتم تركيبها تحت هيكل الحافلة للحفاظ على المساحة الكلية للمدخل وسهولة صعود الركاب العاديين",
      "تفتح أوتوماتيكياً كدرج مخفي عند الحاجة بريموت كنترول",
      "مناسبة للحافلات الحضرية الحديثة منخفضة الأرضية (Yutong / King Long)"
    ],
    featuresFr: [
      "Installation sous châssis pour préserver l'espace d'accès des portes du bus",
      "Déploiement automatique en tiroir masqué via télécommande",
      "Idéal pour les bus urbains modernes surbaissés (Yutong, King Long, etc.)"
    ],
    installationTimeHours: 14
  }
];

// Algeria standard transit vehicles
const BUS_MODELS = [
  {
    id: "snvi-safir",
    name: "SNVI Safir (S45 / S120)",
    maker: "SNVI (Algeria)",
    type: "Bus Urbain / Inter-urbain",
    doorWidthMm: 1100,
    floorHeightMm: 950,
    voltage: "24V",
    doorPositionRecommended: "Porte Milieu (Folding)",
    bestLiftId: "CL-250"
  },
  {
    id: "toyota-coaster",
    name: "Toyota Coaster / Huyndai County",
    maker: "Toyota / Hyundai",
    type: "Minibus Suburbain",
    doorWidthMm: 850,
    floorHeightMm: 750,
    voltage: "12V/24V",
    doorPositionRecommended: "Porte Arrière ou Battante Latérale",
    bestLiftId: "CL-100"
  },
  {
    id: "mercedes-sprinter",
    name: "Mercedes-Benz Sprinter",
    maker: "Mercedes-Benz (Tiaret assembled / Imported)",
    type: "Fourgon de Ligne / Transport d'Élite",
    doorWidthMm: 900,
    floorHeightMm: 650,
    voltage: "12V",
    doorPositionRecommended: "Porte Latérale Coulissante / Double Porte Arrière",
    bestLiftId: "CL-100"
  },
  {
    id: "etub-kinglong",
    name: "King Long / Yutong ETUB Standard",
    maker: "Chinese Manufacturers",
    type: "Bus Urbain Bas (ETUB Tlemcen)",
    doorWidthMm: 1200,
    floorHeightMm: 380,
    voltage: "24V",
    doorPositionRecommended: "Porte Centrale Basse",
    bestLiftId: "CL-500"
  }
];

// Flat-rate local expenses in Algeria
const ALGERIAN_LOGISTICS_DEFAULTS = {
  exchangeRateUSD_DZD: 135.5, // Official Bank Rate
  seaFreightPerUnitUSD: 380, // Transit from Chinese ports (Ningbo/Shanghai) to Port of Oran / Ghazazaout / Algiers
  customsDutyPercent: 15, // Custom duty (reducible or normal)
  vatPercent: 9, // Reduced VAT (9%) for medical/disability assistance, or 19% standard
  customsPortAgencyFlatDZD: 45000, // Port services, transit agent fees
  localTransportDZD: 25000, // Transport from Oran/Ghazazaout to Tlemcen (Hennaya, Mansourah, Chetouane)
  marginPercent: 20 // Importer markup
};

// In-Memory Database for local simulations / logged B2B submissions from transport operators in Tlemcen
let simulatedInquiries: any[] = [
  {
    id: "INQ-20260608-01",
    date: "2026-06-08T09:15:00.000Z",
    clientName: "مؤسسة النقل الحضري والشبه حضري لتلمسان ETUB",
    clientType: "ETUB Tlemcen (Public)",
    busModel: "King Long / Yutong ETUB Standard (Chinese Manufacturers)",
    selectedLift: "CL-500 - رافعة مدمجة تحت هيكل الحافلة (سلسلة الدرج)",
    quantity: 12,
    routeDescription: "خط سير وسط الدائرة الحضرية لتلمسان، من محطة الكيفان إلى لالة سيتي وتمنراست (طرق جبلية ومنعطفات حادة مائلة تزيد عن 8 ٪)",
    status: "Customs Clearance",
    priceBreakdown: {
      baseUSD: 2450,
      freightUSD: 380,
      exchangeRate: 135.5,
      baseCostDZD: 383465,
      customsDutyDZD: 57519.75,
      vatValueDZD: 39688.6275,
      transitFlatDZD: 45000,
      transportToTlemcenDZD: 25000,
      totalCostPriceDZD: 550673.3775,
      marginRate: 20,
      profitAmountDZD: 110134.6755,
      sellingPriceDZD: 660808.053,
      isDutyExempt: false
    }
  },
  {
    id: "INQ-20260606-02",
    date: "2026-06-06T14:22:00.000Z",
    clientName: "ناقلي خطوط الحناية وشتوان الخواص",
    clientType: "Ligne Privée Suburbaine",
    busModel: "SNVI Safir (S45 / S120) (SNVI (Algeria))",
    selectedLift: "CL-250 - رافعة أوتوماتيكية ذات ذراع مزدوجة (السلسلة الثقيلة)",
    quantity: 5,
    routeDescription: "خط الحناية لولاية تلمسان (شوارع ضيقة، وتطبيقات توقف ركاب سريعة، اهتزازات الرصف الممتد)",
    status: "Installed",
    priceBreakdown: {
      baseUSD: 1850,
      freightUSD: 380,
      exchangeRate: 135.5,
      baseCostDZD: 302165,
      customsDutyDZD: 45324.75,
      vatValueDZD: 31274.0775,
      transitFlatDZD: 45000,
      transportToTlemcenDZD: 25000,
      totalCostPriceDZD: 448763.8275,
      marginRate: 20,
      profitAmountDZD: 89752.7655,
      sellingPriceDZD: 538516.593,
      isDutyExempt: false
    }
  },
  {
    id: "INQ-20260604-03",
    date: "2026-06-04T10:05:00.000Z",
    clientName: "جمعية رعاية مرضى الكراسي والمقعدين لمغنية",
    clientType: "Association",
    busModel: "Toyota Coaster / Huyndai County (Toyota / Hyundai)",
    selectedLift: "CL-100 - رافعة هيدروليكية ذات ذراع أحادية (السلسلة المدمجة)",
    quantity: 2,
    routeDescription: "تحويل حافلة نقل من مغنية لتسهيل نقل المرضى إلى غاية العيادات المتخصصة ومحطة تلمسان الاستشفائية",
    status: "Pending",
    priceBreakdown: {
      baseUSD: 1250,
      freightUSD: 380,
      exchangeRate: 135.5,
      baseCostDZD: 220865,
      customsDutyDZD: 0,
      vatValueDZD: 19877.85,
      transitFlatDZD: 45000,
      transportToTlemcenDZD: 25000,
      totalCostPriceDZD: 310742.85,
      marginRate: 20,
      profitAmountDZD: 62148.57,
      sellingPriceDZD: 372891.42,
      isDutyExempt: true
    }
  }
];

// API Endpoints
app.get("/api/lifts", (req, res) => {
  res.json(LIFT_CATALOG);
});

app.get("/api/buses", (req, res) => {
  res.json(BUS_MODELS);
});

app.get("/api/logistics-defaults", (req, res) => {
  res.json(ALGERIAN_LOGISTICS_DEFAULTS);
});

// Calculate full Algerian DZD Importation & Reselling breakdown
app.post("/api/calculate", (req, res) => {
  const {
    basePriceUSD,
    customsDutyPercent,
    vatPercent,
    exchangeRateUSD_DZD,
    seaFreightPerUnitUSD,
    customsPortAgencyFlatDZD,
    localTransportDZD,
    marginPercent,
    customExempt
  } = req.body;

  const currentExchangeRate = exchangeRateUSD_DZD || ALGERIAN_LOGISTICS_DEFAULTS.exchangeRateUSD_DZD;
  const freightUSD = seaFreightPerUnitUSD ?? ALGERIAN_LOGISTICS_DEFAULTS.seaFreightPerUnitUSD;
  const isDutyExempt = customExempt === true;
  
  // Cost Calculations
  const dutyRate = isDutyExempt ? 0 : (customsDutyPercent ?? ALGERIAN_LOGISTICS_DEFAULTS.customsDutyPercent);
  const vatRate = vatPercent ?? ALGERIAN_LOGISTICS_DEFAULTS.vatPercent;
  
  const priceWithFreightUSD = basePriceUSD + freightUSD;
  const baseCostDZD = priceWithFreightUSD * currentExchangeRate;
  
  const customsDutyDZD = baseCostDZD * (dutyRate / 100);
  const costAfterCustomsDZD = baseCostDZD + customsDutyDZD;
  
  const vatValueDZD = costAfterCustomsDZD * (vatRate / 100);
  
  const transitFlatDZD = customsPortAgencyFlatDZD ?? ALGERIAN_LOGISTICS_DEFAULTS.customsPortAgencyFlatDZD;
  const transportToTlemcenDZD = localTransportDZD ?? ALGERIAN_LOGISTICS_DEFAULTS.localTransportDZD;
  
  // Total Cost Price (Prix de Revient) to the Tlemcen Importer
  const totalCostPriceDZD = baseCostDZD + customsDutyDZD + vatValueDZD + transitFlatDZD + transportToTlemcenDZD;
  
  // Margin & Selling Price
  const marginRate = marginPercent ?? ALGERIAN_LOGISTICS_DEFAULTS.marginPercent;
  const profitAmountDZD = totalCostPriceDZD * (marginRate / 100);
  const sellingPriceDZD = totalCostPriceDZD + profitAmountDZD;
  
  res.json({
    baseUSD: basePriceUSD,
    freightUSD,
    exchangeRate: currentExchangeRate,
    baseCostDZD,
    customsDutyDZD,
    vatValueDZD,
    transitFlatDZD,
    transportToTlemcenDZD,
    totalCostPriceDZD,
    marginRate,
    profitAmountDZD,
    sellingPriceDZD,
    isDutyExempt
  });
});

// Post a new configuration inquiry
app.post("/api/inquiries", (req, res) => {
  const { clientName, clientType, busModel, selectedLiftId, quantity, routeDescription, dzdPriceBreakdown } = req.body;
  
  const selectedLift = LIFT_CATALOG.find(l => l.id === selectedLiftId);
  const selectedBus = BUS_MODELS.find(b => b.id === busModel);
  
  const newInquiry = {
    id: `INQ-${Date.now()}`,
    date: new Date().toISOString(),
    clientName,
    clientType, // "ETUB Tlemcen (Public)", "Ligne Privée Suburbaine", "Association", "Autre"
    busModel: selectedBus ? selectedBus.name : busModel,
    selectedLift: selectedLift ? selectedLift.nameAr : "رافعة مخصصة",
    quantity: quantity || 1,
    routeDescription: routeDescription || "",
    priceBreakdown: dzdPriceBreakdown,
    status: "Pending"
  };
  
  simulatedInquiries.unshift(newInquiry);
  res.json({ success: true, inquiry: newInquiry });
});

// Update an inquiry status
app.patch("/api/inquiries/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const inquiry = simulatedInquiries.find(inq => inq.id === id);
  if (inquiry) {
    inquiry.status = status;
    res.json({ success: true, inquiry });
  } else {
    res.status(404).json({ error: "Inquiry not found" });
  }
});

app.get("/api/inquiries", (req, res) => {
  res.json(simulatedInquiries);
});

// Gemini compliance, route suitability, and proposal generator
app.post("/api/gemini/analyze", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ 
      error: "Gemini API config error", 
      message: "مفتاح Gemini API غير مكوّن حالياً. يرجى تهيئته في لوحة الإعدادات." 
    });
  }

  const { busModelName, liftModelName, routeDescription, capacityKg, platformSize, costDZD } = req.body;

  const prompt = `
    Vous êtes un consultant expert en logistique d'accessibilité et en transport en Algérie, spécialement pour la Wilaya de Tlemcen.
    Un importateur propose d'équiper des bus en Algérie avec le matériel suivant :
    - Modèle de Bus : ${busModelName}
    - Modèle de Rallonge de levage / Elevateur Chinois : ${liftModelName} (Capacité : ${capacityKg} kg, Taille Plateforme : ${platformSize})
    - Itinéraire/Région spécifié par le client à Tlemcen : "${routeDescription || "Lignes urbaines de Tlemcen (ex: Mansourah, Chetouane, Bel Horizon)"}"
    - Prix de vente estimé par unité en DZD : ${costDZD ? `${costDZD.toLocaleString()} DZD` : "Non spécifié"}
    
    Veuillez générer un rapport complet et professionnel et une proposition commerciale structurée. Le rapport doit comprendre trois grandes parties rédigées de la manière suivante (mélange de Français professionnel et d'Arabe élégant pour faciliter l'intégration administrative locale en Algérie) :

    1. **Analyse de compatibilité technique (Français/Arabe) :** Évaluer si cet élévateur chinois s'adapte bien au bus choisi (SNVI Safir, Toyota Coaster, ou fourgons) et sa facilité d'installation mécanique.
    2. **Évaluation géographique de l'itinéraire à Tlemcen (Français/Arabe) :** Analyser comment le relief de Tlemcen affecte l'utilisation de l'élévateur (les pentes fortes vers Lalla Setti, les pavés historiques d'El-Méchouar ou de Mansourah, les arrêts étroits de Chetouane ou Hennaya). Proposer des recommandations de sécurité.
    3. **Proposition Commerciale Formelle de Subvention / Intégration (en Arabe majoritairement avec termes clés en Français) :** Rédiger une proposition prête à être déposée à la Direction du Transport de la Wilaya de Tlemcen (DTW) ou à l'APW pour défendre l'achat et justifier son impact social crucial pour les personnes aux besoins spécifiques (ذوي الاحتياجات الخاصة).

    Veillez à ce que le rapport soit structuré avec des titres propres, des puces claires, un ton de conseiller expert rigoureux, et aucune mention technique d'API ou de logs système.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite B2B mobility accessibility consultant in Algeria, assisting importing businesses and the Wilaya municipal transit authority to modernize public transportation for disabled citizens using specialized Chinese wheelchair lifts."
      }
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze layout compatibility." });
  }
});

// Serve frontend assets
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
