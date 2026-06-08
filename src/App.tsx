import React, { useState, useEffect } from "react";
import {
  FileText,
  Calculator,
  Truck,
  Layers,
  Wrench,
  TrendingUp,
  Globe,
  PlusCircle,
  Sparkles,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ChevronRight,
  ShieldCheck,
  Search,
  ExternalLink,
  Users,
  Info,
  DollarSign,
  Languages
} from "lucide-react";
import { LiftModel, BusModel, LogisticsSettings, CalculationResult, Inquiry } from "./types";
import AccessLiftLogo from "./components/AccessLiftLogo";

const STATUS_STEPS = [
  { key: "Pending", labelAr: "طلب معلق / تحت الدراسة", labelFr: "Demande en cours d'étude" },
  { key: "Customs Clearance", labelAr: "التخليص الجمركي بالميناء", labelFr: "Dédouanement Portuaire" },
  { key: "In Transit to Tlemcen", labelAr: "قيد نقل الترانزيت لتلمسان", labelFr: "En Transit vers Tlemcen" },
  { key: "Installed", labelAr: "تم التركيب والتسليم بنجاح", labelFr: "Installé & Livré au Client" }
];

export default function App() {
  // Localized Interface Language
  const [lang, setLang] = useState<"ar" | "fr">("ar");

  // Catalog State
  const [lifts, setLifts] = useState<LiftModel[]>([]);
  const [buses, setBuses] = useState<BusModel[]>([]);
  const [logisticsDefaults, setLogisticsDefaults] = useState<LogisticsSettings | null>(null);

  // Search and Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // B2B Calculator State
  const [calcBasePrice, setCalcBasePrice] = useState<number>(1850);
  const [calcFreight, setCalcFreight] = useState<number>(380);
  const [calcExchangeRate, setCalcExchangeRate] = useState<number>(135.5);
  const [calcCustomsDuty, setCalcCustomsDuty] = useState<number>(15);
  const [calcVat, setCalcVat] = useState<number>(9);
  const [calcPortFees, setCalcPortFees] = useState<number>(45000);
  const [calcLocalTransport, setCalcLocalTransport] = useState<number>(25000);
  const [calcMargin, setCalcMargin] = useState<number>(20);
  const [calcCustomExempt, setCalcCustomExempt] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  // Active Tab: "overview" | "catalog" | "calculator" | "ai-proposals" | "inquiries"
  const [activeTab, setActiveTab] = useState<string>("overview");

  // B2B Custom Inquiry Form State
  const [clientName, setClientName] = useState<string>("");
  const [clientType, setClientType] = useState<"ETUB Tlemcen (Public)" | "Ligne Privée Suburbaine" | "Association" | "Autre">("Ligne Privée Suburbaine");
  const [selectedBusId, setSelectedBusId] = useState<string>("snvi-safir");
  const [selectedLiftId, setSelectedLiftId] = useState<string>("CL-250");
  const [quantity, setQuantity] = useState<number>(5);
  const [routeDescription, setRouteDescription] = useState<string>("خط وسط مدينة تلمسان إلى سيدي بومدين وهضبة لالة سيتي (منحدرات حادة وطبيعة سياحية)");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState<boolean>(false);

  // AI Generator state
  const [aiResult, setAiResult] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  // Load Catalog and Logistics configurations from API on boot
  useEffect(() => {
    fetchLiftsAndBuses();
    fetchInquiries();
  }, []);

  const fetchLiftsAndBuses = async () => {
    try {
      const liftsRes = await fetch("/api/lifts");
      const liftsData = await liftsRes.json();
      setLifts(liftsData);

      const busesRes = await fetch("/api/buses");
      const busesData = await busesRes.json();
      setBuses(busesData);

      const logRes = await fetch("/api/logistics-defaults");
      const logData = await logRes.json();
      setLogisticsDefaults(logData);

      // Populate calculator defaults
      if (logData) {
        setCalcExchangeRate(logData.exchangeRateUSD_DZD);
        setCalcFreight(logData.seaFreightPerUnitUSD);
        setCalcCustomsDuty(logData.customsDutyPercent);
        setCalcVat(logData.vatPercent);
        setCalcPortFees(logData.customsPortAgencyFlatDZD);
        setCalcLocalTransport(logData.localTransportDZD);
        setCalcMargin(logData.marginPercent);
        setCalcCustomExempt(logData.customExempt);
      }
    } catch (e) {
      console.error("Error loading initial B2B catalogs", e);
    }
  };

  const fetchInquiries = async () => {
    try {
      const res = await fetch("/api/inquiries");
      const data = await res.json();
      setInquiries(data);
    } catch (e) {
      console.error("Error reading inquiry database", e);
    }
  };

  const handleUpdateStatus = async (inquiryId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchInquiries();
      }
    } catch (err) {
      console.error("Failed to update status on server", err);
    }
  };

  // Perform Algeria price calculations
  useEffect(() => {
    calculateB2BPrice();
  }, [
    calcBasePrice,
    calcFreight,
    calcExchangeRate,
    calcCustomsDuty,
    calcVat,
    calcPortFees,
    calcLocalTransport,
    calcMargin,
    calcCustomExempt
  ]);

  const calculateB2BPrice = async () => {
    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePriceUSD: calcBasePrice,
          customsDutyPercent: calcCustomExempt ? 0 : calcCustomsDuty,
          vatPercent: calcVat,
          exchangeRateUSD_DZD: calcExchangeRate,
          seaFreightPerUnitUSD: calcFreight,
          customsPortAgencyFlatDZD: calcPortFees,
          localTransportDZD: calcLocalTransport,
          marginPercent: calcMargin,
          customExempt: calcCustomExempt
        })
      });
      const data = await response.json();
      setCalculationResult(data);
    } catch (e) {
      console.error("Pricing estimation failure", e);
    }
  };

  // Submit Inquiry & Log Pipeline Action
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert(lang === "ar" ? "يرجى إدخال اسم المتعامل أو شركة النقل" : "Veuillez entrer le nom du client.");
      return;
    }
    
    setIsSubmittingInquiry(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientType,
          busModel: selectedBusId,
          selectedLiftId,
          quantity,
          routeDescription,
          dzdPriceBreakdown: calculationResult
        })
      });
      const data = await res.json();
      if (data.success) {
        setClientName("");
        fetchInquiries();
        // Redirect client to Inquiries Tab
        setActiveTab("inquiries");
        // Scroll to inquiries table
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error("Failed to add B2B inquiry to database", err);
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // Run Gemini API B2B route and compliance analyzer
  const handleAiAnalysis = async (selectedInquiry?: Inquiry) => {
    setIsAiLoading(true);
    setAiResult("");
    setAiError("");

    let payload = {
      busModelName: "",
      liftModelName: "",
      routeDescription: "",
      capacityKg: 300,
      platformSize: "1100mm x 800mm",
      costDZD: 0
    };

    if (selectedInquiry) {
      payload = {
        busModelName: selectedInquiry.busModel,
        liftModelName: selectedInquiry.selectedLift,
        routeDescription: selectedInquiry.routeDescription,
        capacityKg: selectedInquiry.priceBreakdown ? 300 : 300,
        platformSize: "1120mm x 800mm",
        costDZD: selectedInquiry.priceBreakdown ? selectedInquiry.priceBreakdown.sellingPriceDZD : 0
      };
    } else {
      const busObj = buses.find(b => b.id === selectedBusId);
      const liftObj = lifts.find(l => l.id === selectedLiftId);
      payload = {
        busModelName: busObj ? busObj.name : selectedBusId,
        liftModelName: liftObj ? liftObj.nameAr : selectedLiftId,
        routeDescription: routeDescription,
        capacityKg: liftObj ? liftObj.capacityKg : 300,
        platformSize: liftObj ? liftObj.platformSize : "Standard",
        costDZD: calculationResult ? calculationResult.sellingPriceDZD : 0
      };
    }

    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        setAiResult(data.analysis);
        // Switch to the analysis presentation screen
        setActiveTab("ai-proposals");
      } else {
        setAiError(data.message || "Failed to analyze layout compatibility via Gemini.");
      }
    } catch (err) {
      setAiError(lang === "ar" ? "عذراً، حدث خطأ أثناء الاتصال بخادم الذكاء الاصطناعي." : "Erreur de connexion avec l'IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper to filter lifts based on category and search
  const filteredLifts = lifts.filter(lift => {
    const matchesCategory = selectedCategory === "All" || lift.category.toLowerCase().includes(selectedCategory.toLowerCase()) || lift.id === selectedCategory;
    const matchesSearch = lift.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lift.nameAr.includes(searchQuery) ||
                          lift.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white" id="main-container">
      
      {/* Top Banner / Global Sub-header */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 border-b border-emerald-800/40 px-4 py-2 text-xs flex justify-between items-center" id="top-banner">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300 font-medium">B2B Import & Distribution Hub — China-Algeria Lanes</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400">Wilaya: <strong className="text-emerald-400">Tlemcen (تلمسان)</strong></span>
          <button 
            id="lang-toggle-btn"
            onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
            className="flex items-center gap-1.5 bg-emerald-800/50 hover:bg-emerald-700 text-emerald-200 hover:text-white px-2.5 py-1 rounded border border-emerald-700/65 transition-colors cursor-pointer"
          >
            <Languages size={13} />
            <span>{lang === "ar" ? "Changer en Français" : "تغيير للعربية"}</span>
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-5 sticky top-0 z-40 shadow-xl" id="main-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 shadow-md shrink-0 flex items-center justify-center" id="logo-icon-container">
              <AccessLiftLogo inline={true} showText={false} className="w-16 h-12" lang={lang} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white font-arabic flex items-center gap-2">
                  <span className="text-emerald-400 font-english font-black tracking-tighter italic">ACCESS LIFT</span>
                  <span className="text-slate-200">| بوابة تلمسان للرافعات</span>
                </h1>
                <span className="bg-emerald-900/80 border border-emerald-700 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">ALGERIA</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "ar" 
                  ? "استيراد رافعات مخصصة لذوي الاحتياجات الخاصة من الصين وإعادة بيعها لشركات النقل بولاية تلمسان" 
                  : "Importation de plateformes élévatrices de Chine & distribution B2B aux transporteurs de Tlemcen"}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800" id="navbar">
            <button
              id="tab-btn-overview"
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "overview" 
                  ? "bg-emerald-600 text-white shadow-md" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {lang === "ar" ? "نظرة عامة والجدوى" : "Aperçu & Viabilité"}
            </button>
            <button
              id="tab-btn-catalog"
              onClick={() => setActiveTab("catalog")}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "catalog" 
                  ? "bg-emerald-600 text-white shadow-md" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {lang === "ar" ? "كتالوج الرافعات & الحافلات" : "Catalogue Matériels"}
            </button>
            <button
              id="tab-btn-calculator"
              onClick={() => setActiveTab("calculator")}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "calculator" 
                  ? "bg-emerald-600 text-white shadow-md" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {lang === "ar" ? "حاسبة تكاليف الاستيراد والجمارك" : "Simulateur de Devis DZD"}
            </button>
            <button
              id="tab-btn-ai-proposals"
              onClick={() => setActiveTab("ai-proposals")}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "ai-proposals" 
                  ? "bg-emerald-600 text-white shadow-md animate-pulse" 
                  : "text-slate-300 hover:text-white hover:bg-emerald-900/20"
              }`}
            >
              <Sparkles size={12} className="text-emerald-400" />
              <span>{lang === "ar" ? "مستشار الذكاء الاصطناعي والخطوط" : "Analyses Terrain IA"}</span>
            </button>
            <button
              id="tab-btn-inquiries"
              onClick={() => setActiveTab("inquiries")}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "inquiries" 
                  ? "bg-emerald-600 text-white shadow-md" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <span>{lang === "ar" ? "سجل طلبات التجهيز" : "Dossiers & Pipelines"}</span>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {inquiries.length}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6" id="main-content">
        
        {/* TAB 1: OVERVIEW & STRATEGIC PLANNING */}
        {activeTab === "overview" && (
          <div className="space-y-6" id="overview-section">
            
            {/* Hero / Strategic Statement WITH THE EMBEDDED ACCESS LIFT LOGO */}
            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 rounded-2xl border border-emerald-800/40 p-6 md:p-8 shadow-2xl relative overflow-hidden" id="hero-banner">
              <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-800/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                <div className="max-w-3xl">
                  <span className="bg-emerald-900/80 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-700/60 uppercase tracking-widest inline-block mb-3">
                    {lang === "ar" ? "المخطط التجاري الاستراتيجي B2B" : "MODÈLE D'INTEGRATION ECONOMIQUE & ACCESSIBILITÉ"}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight font-arabic">
                    {lang === "ar" 
                      ? "تأمين وبناء شبكة النقل الشامل لولاية تلمسان"
                      : "Faciliter l'importation de solutions de mobilité inclusive pour la Wilaya de Tlemcen"}
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-sans">
                    {lang === "ar"
                      ? "يسعى هذا المشروع الرياضي إلى سد الفجوة في البنية التحتية لذوي الاحتياجات الخاصة (كبار السن، المقعدين، المرضى) من خلال استيراد رافعات كهرومائية متطورة ومطابقة للمعايير الدولية من كبار مصنعي وموردي التجهيزات في الصين، ثم توطين وتهيئة هذه المعدات لتلائم الحافلات الحضرية وشبه الحضرية العاملة عبر ولاية تلمسان. يشمل ذلك تلبية متطلبات مؤسسة النقل الحضري والشبه الحضري (ETUB) ومختلف خطوط الناقلين الخواص الشريكة."
                      : "Ce projet vise à équiper la flotte de bus urbains et inter-urbains de Tlemcen avec des élévateurs hydrauliques chinois robustes et économiques. Notre plateforme de distribution B2B automatise l'analyse de conformité douanière, simule le prix de revient final en DZD, et évalue par IA les contraintes topographiques de Tlemcen (pentes, virages serrés et routes anciennes)."}
                  </p>

                  <div className="flex flex-wrap gap-4" id="hero-quick-stats">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 min-w-[140px]">
                      <span className="text-xs text-slate-400 block">{lang === "ar" ? "ولاية التوزيع" : "Zone Cible"}</span>
                      <strong className="text-lg text-emerald-400 font-bold block mt-1">تلمسان (13) Tlemcen</strong>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 min-w-[140px]">
                      <span className="text-xs text-slate-400 block">{lang === "ar" ? "موانئ الاستيراد" : "Ports de Transit"}</span>
                      <strong className="text-lg text-white font-bold block mt-1">الغزوات / وهران / الجزائر</strong>
                    </div>
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 min-w-[140px]">
                      <span className="text-xs text-slate-400 block">{lang === "ar" ? "الرافعات المتوافقة" : "Matériel Certifié"}</span>
                      <strong className="text-lg text-white font-bold block mt-1">Hydraulic 12V/24V DC</strong>
                    </div>
                    <div className="bg-slate-900/90 border border-emerald-950 rounded-xl px-4 py-3 min-w-[140px]">
                      <span className="text-xs text-slate-400 block">{lang === "ar" ? "قانون ترقية ذوي الاحتياجات الخاصة" : "Législation Alentour"}</span>
                      <strong className="text-xs text-emerald-300 font-bold block mt-1">تخفيضات جمركية وإعفاءات DZD</strong>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-auto flex justify-center bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative" id="hero-brand-logo-card">
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-950 border border-emerald-800/60 rounded px-1.5 py-0.5 text-[8px] font-mono text-emerald-300 tracking-wide uppercase">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>ORIGINAL BRAND</span>
                  </div>
                  <AccessLiftLogo inline={false} showText={true} className="w-64 h-56" lang={lang} />
                </div>
              </div>
            </div>

            {/* Strategic Value Proposition & Local Impact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="service-pillars">
              
              {/* Pillar 1 */}
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-emerald-800/40 transition-all duration-300 relative group" id="pillar-import">
                <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Globe size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-arabic">
                  {lang === "ar" ? "1. الاستيراد المباشر من الصين" : "1. Importation Directe de Chine"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {lang === "ar"
                    ? "التعاقد مع مصنعين معتمدين في شنجن ونينغبو لتوفير رافعات كرسي متحرك كهرومائية متينة بجهد تيار مستمر 12فولت/24فولت يلائم تماماً النظام الكهربائي لحافلات SNVI المحلية والحافلات الآسيوية مثل يوتونغ وتشيري."
                    : "Partenariats avec des leaders industriels de Ningbo et Shanghai pour importer du matériel de levage conforme aux normes CE, sécurisé et adapté au circuit électrique 12V/24V de nos bus et minibus."}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center text-[11px] text-slate-400">
                  <span>{lang === "ar" ? "التوفير ومتابعة الجودة" : "Économie d'échelle importante"}</span>
                  <span className="text-emerald-400 font-mono">USD ➡️ DZD Official</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-emerald-800/40 transition-all duration-300 relative group" id="pillar-logistics">
                <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Truck size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-arabic">
                  {lang === "ar" ? "2. لوجستيات وتخفيضات جمركية" : "2. Logistique & Avantages Fiscaux"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {lang === "ar"
                    ? "تسهيل الاستخلاص الجمركي بموانئ الغزوات ووهران. الاستفادة من الإعفاءات المقررة قانوناً للتجهيزات الطبية لذوي الاحتياجات الخاصة (تخفيض الرسوم الجمركية والضريبة على القيمة المضافة المخفضة 9%) لضمان أقل سعر للمتعامل الجزائري."
                    : "Transit via le port de Ghazaouet ou d'Oran. Exploitation des exonérations et taux réduits de TVA (9%) sur les aides techniques destinées directement aux handicapés en Algérie, diminuant drastiquement le coût d'acquisition."}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center text-[11px] text-slate-400">
                  <span>{lang === "ar" ? "مرج مالي تنافسي" : "Impact fiscal maîtrisé"}</span>
                  <span className="text-emerald-400 font-semibold">{lang === "ar" ? "تخفيض 15% رسوم" : "Duty reduction"}</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-emerald-800/40 transition-all duration-300 relative group" id="pillar-tlemcen">
                <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Building2 size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-arabic">
                  {lang === "ar" ? "3. التوطين في ولاية تلمسان" : "3. Intégration Wilaya de Tlemcen"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {lang === "ar"
                    ? "توزيع وصيانة وتثبيت في ورشنا المحلية المجهزة في الحناية أو منصورة لتأهيل أسطول حافلات النقل الحضري لـ ETUB والبلديات المجاورة (شتوان، الرمشي، سبدو، مغنية) لضمان شبكة طرق مرنة خالية من الحواجز."
                    : "Service technique de proximité basé à Hennaya/Tlemcen pour l'installation, le câblage et la maintenance périodique. Partenariat privilégié avec l'ETUB et les syndicats de transporteurs privés de banlieues."}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between items-center text-[11px] text-slate-400">
                  <span>{lang === "ar" ? "دعم الصيانة والتدريب" : "Garantie locale et support informatique"}</span>
                  <span className="text-emerald-400 font-mono">Tlemcen (13)</span>
                </div>
              </div>

            </div>

            {/* Geographical Map of Tlemcen Challenge and Accessibility Info */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden" id="geographic-showcase">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white font-arabic flex items-center gap-2">
                    <MapPin className="text-emerald-400 shrink-0" size={22} />
                    <span>تحديات تضاريس وخطوط النقل في تلمسان | Topographie & Lignes Tlemcen</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {lang === "ar"
                      ? "تؤثر مرتفعات تلمسان وطبيعة طرقاتها الأثرية بشكل مباشر على سلامة تثبيت الرافعات ومرونة تشغيلها."
                      : "La topographie montagneuse de Tlemcen demande une sélection minutieuse et une installation robuste du matériel."}
                  </p>
                </div>
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-right">
                  <span className="text-slate-400 text-[10px] block">{lang === "ar" ? "أقصى ميل محتمل بالطرق" : "Pente de crête max"}</span>
                  <span className="text-emerald-400 font-mono font-bold">12% (Lalla Setti Hills)</span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Visual Map Layout using standard flex and indicators representing Tlemcen's high/low sectors */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    {lang === "ar" ? "خريطة الملاءمة الجغرافية والمناطق المستهدفة" : "Cartographie d'adéquation territoriale"}
                  </h4>
                  
                  {/* Custom Styled Map Cards representation */}
                  <div className="space-y-3">
                    
                    {/* Zone High */}
                    <div className="p-4 bg-slate-950 rounded-xl border-l-4 border-amber-500 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">هضبة لالة سيتي وتلمسان العلوية (Lalla Setti High Slopes)</span>
                          <span className="bg-amber-900/45 text-amber-300 text-[9px] px-2 py-0.5 rounded border border-amber-800">تضاريس جبلية حادة</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {lang === "ar" 
                            ? "خطوط الحافلات الصاعدة من وسط المدينة نحو المرتفعات السياحية. تتطلب رافعات ثنائية الذراع (CL-250) مع أنظمة قفل ثقيلة مانعة للانزلاق تحسباً للاهتزاز والميول الحادة."
                            : "Bus reliant le Centre-ville de Tlemcen aux hauteurs touristiques. Nécessite des élévateurs double bras ultra-robustes munis de barrières d'arrêt automatiques de secours."}
                        </p>
                      </div>
                      <span className="text-amber-400 text-right text-xs shrink-0 font-mono pl-4">350kg Spec</span>
                    </div>

                    {/* Zone Historical */}
                    <div className="p-4 bg-slate-950 rounded-xl border-l-4 border-cyan-500 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">وسط المدينة، قلعة المشور، والحناية القديمة (Historical Hubs)</span>
                          <span className="bg-cyan-900/45 text-cyan-300 text-[9px] px-2 py-0.5 rounded border border-cyan-800">شوارع مرصوفة ضيقة</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {lang === "ar"
                            ? "عتبات صعود مرتفعة، وأرصفة ضيقة. تناسبها رافعات هيدروليكية ذات حجم لوح متوسط تفتح بسلاسة دون التسبب في عرقلة حركة المرور حول الأسواق التاريخية."
                            : "Pavés anciens, fortes vibrations routières. Le matériel nécessite un graissage de qualité supérieure et un système de retenue mécanique robuste anti-vibrations."}
                        </p>
                      </div>
                      <span className="text-cyan-400 text-right text-xs shrink-0 font-mono pl-4">Standard Size</span>
                    </div>

                    {/* Zone Suburb */}
                    <div className="p-4 bg-slate-950 rounded-xl border-l-4 border-emerald-500 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">خطوط شتوان، الرمشي، ومغنية (Suburban Long Routes)</span>
                          <span className="bg-emerald-950 text-emerald-300 text-[9px] px-2 py-0.5 rounded border border-emerald-800">حافلات نقل المسافات القصيرة</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {lang === "ar"
                            ? "تتميز حافلات هذه الخطوط بالحجم المتوسط (Toyota Coaster). يسهل فيها دمج الرافعات أحادية الذراع (CL-100) المثبتة بالأبواب الخلفية أو الجانبية لسهولة الاستعمال من طرف الطاقم."
                            : "Trajets inter-communes à forte affluence. Les minibus de type Coaster / County sont parfaits pour recevoir les modèles mono-bras (CL-100) montés à l'arrière."}
                        </p>
                      </div>
                      <span className="text-emerald-400 text-right text-xs shrink-0 font-mono pl-4">12V/24V Multi</span>
                    </div>

                  </div>
                </div>

                {/* Economic / Financial Viability & Projections Box */}
                <div className="lg:col-span-5 bg-slate-950 rounded-xl p-6 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="text-emerald-400" size={18} />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">{lang === "ar" ? "الجدوى الاقتصادية والطلب المحلي" : "Viabilité Commerciale"}</h4>
                    </div>

                    <div className="space-y-4 text-xs text-slate-300">
                      <p>
                        {lang === "ar" 
                          ? "تمتلك ولاية تلمسان أسطولاً نشطاً يفوق 350 حافلة نقل ركاب حضرية وشبه حضرية مقسمة بين شركة النقل العمومية والخطوط الفرعية للناقلين الخواص. بموجب القوانين الجزائرية الجديدة الرامية لدعم الإدماج الشامل للمواطنين من ذوي الاحتياجات الخاصة، من المتوقع أن تشهد الولاية إلزامية تجهيز ما لا يقل عن 15% من الأسطول برافعات متخصصة بآلية كهربائية."
                          : "Le marché potentiel de la wilaya de Tlemcen compte plus de 350 autobus et minibus actifs d'entreprises publiques (ETUB) et d'exploitants privés indépendants. Les nouvelles circulaires ministérielles encouragent activement l'attribution de subventions pour la mise aux normes PMR de ces parcs de véhicules."}
                      </p>

                      <div className="border-t border-slate-800/80 pt-3 space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">{lang === "ar" ? "تقدير حجم السوق بتلمسان" : "Taille estimée du marché local"}</span>
                          <span className="text-slate-200 font-bold">50 - 80 Units (Total)</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">{lang === "ar" ? "متوسط التكلفة للرافعة المستوردة" : "Prix de revient moyen (DZD)"}</span>
                          <span className="text-emerald-400 font-mono font-bold">~ 280,000 - 450,000 DZD</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">{lang === "ar" ? "مرج الربح قبل الضرائب" : "Marge bénéficiaire distributeur"}</span>
                          <span className="text-emerald-400 font-bold">15% - 25%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80">
                    <button
                      id="goto-calc-btn-overview"
                      onClick={() => setActiveTab("calculator")}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transition-colors cursor-pointer shadow-lg shadow-emerald-900/30"
                    >
                      <Calculator size={14} />
                      <span>{lang === "ar" ? "الانتقال المباشر لحاسبة الأسعار والربح" : "Accéder au Calculateur de Prix"}</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>

            {/* Quick action shortcut to simulate an inquiry */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-900/55 flex items-center justify-center text-emerald-400">
                  <span className="text-xs font-bold">B2B</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white text-right sm:text-left">
                    {lang === "ar" ? "هل ترغب في محاكاة تقديم عرض لشركة نقل في تلمسان؟" : "Besoin de simuler un dossier client ?"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === "ar" ? "اختر نوع الحافلة والرافعة المستوردة، ثم احصل على دراسة جدوى وتوافق بالذكاء الاصطناعي." : "Configurez une simulation pour l'ETUB ou un transporteur privé."}
                  </p>
                </div>
              </div>
              <button
                id="simulate-inquiry-shortcut-btn"
                onClick={() => {
                  setActiveTab("calculator");
                  // Scroll to inquiry form below
                  setTimeout(() => {
                    document.getElementById("simulation-form-card")?.scrollIntoView({ behavior: 'smooth' });
                  }, 200);
                }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold py-2 px-4 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                {lang === "ar" ? "ابدأ المحاكاة الآن" : "Simuler un dossier"}
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: CURRENT OFFERS & CHINESE MATERIAL CATALOG */}
        {activeTab === "catalog" && (
          <div className="space-y-6" id="catalog-section">

            {/* Catalog Info & Controls */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4" id="filters-container">
              <div>
                <h3 className="text-lg font-bold text-white font-arabic">
                  {lang === "ar" ? "كتالوج الرافعات المستوردة ومواصفات الحافلات" : "Catalogue Matériels d'Importation & Véhicules Algérie"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "ar"
                    ? "اختر طراز الرافعة الصينية لمشاهدة الميزات الفنية والقدرات ونظام الطاقة اللازم لكل حافلة جزائرية متوافقة."
                    : "Caractéristiques techniques des élévateurs hydrauliques chinois et des bus en Algérie."}
                </p>
              </div>

              {/* Dynamic Categories selection */}
              <div className="flex flex-wrap items-center gap-2" id="filter-buttons">
                <button
                  id="cat-all-btn"
                  onClick={() => setSelectedCategory("All")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedCategory === "All"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850"
                  }`}
                >
                  {lang === "ar" ? "كل الرافعات" : "Tous les Élévateurs"}
                </button>
                <button
                  id="cat-minibus-btn"
                  onClick={() => setSelectedCategory("Minibus")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedCategory === "Minibus"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850"
                  }`}
                >
                  {lang === "ar" ? "مخصصة للمينيباص والـ Van" : "Minibus & Fourgon"}
                </button>
                <button
                  id="cat-bus-btn"
                  onClick={() => setSelectedCategory("Bus")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedCategory === "Bus"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850"
                  }`}
                >
                  {lang === "ar" ? "للحافلات الكبيرة والمتوسطة" : "Grands Autocars"}
                </button>
                
                {/* Search input to test filters */}
                <div className="relative ml-2" id="catalog-search-container">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    id="catalog-search-input"
                    type="text"
                    placeholder={lang === "ar" ? "بحث برقم الموديل..." : "Rechercher..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-600 max-w-[150px]"
                  />
                </div>
              </div>
            </div>

            {/* Chinese Lifts Catalog Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="lifts-grid">
              {filteredLifts.map((lift) => (
                <div 
                  key={lift.id} 
                  className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between hover:border-emerald-700/60 transition-all duration-300"
                  id={`lift-card-${lift.id}`}
                >
                  {/* Card Header & Badge */}
                  <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded">
                        Model: {lift.id}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Layers size={12} />
                        <span>{lift.category}</span>
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white font-arabic mt-1">
                      {lang === "ar" ? lift.nameAr : lift.name}
                    </h4>
                  </div>

                  {/* Body Specs */}
                  <div className="p-5 space-y-4 text-xs">
                    
                    {/* Visual specs block */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-850">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{lang === "ar" ? "حمولة الرفع الطبية" : "Capacité de levage"}</span>
                        <strong className="text-emerald-400 font-mono font-bold text-sm block mt-0.5">{lift.capacityKg} KG</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{lang === "ar" ? "أبعاد المنصة" : "Dimension Plateforme"}</span>
                        <strong className="text-white block mt-0.5 font-mono">{lift.platformSize}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{lang === "ar" ? "مصدر الطاقة الكهربائي" : "Tension Requise"}</span>
                        <strong className="text-teal-400 block mt-0.5 font-mono">{lift.powerRequired}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{lang === "ar" ? "سعر الاستيراد المرجعي" : "Prix d'Origine (USD)"}</span>
                        <strong className="text-amber-500 font-mono block mt-0.5">${lift.basePriceUSD.toLocaleString()} FOB</strong>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                        {lang === "ar" ? "المزايا وحلول الحماية الذاتية:" : "Atouts techniques:"}
                      </span>
                      {(lang === "ar" ? lift.features : lift.featuresFr).map((feat, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-xs text-slate-300">
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Install and testing notes */}
                    <div className="bg-slate-950/65 p-2 rounded-lg border border-dashed border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                      <Wrench size={13} className="text-slate-400 shrink-0" />
                      <span>
                        {lang === "ar" 
                          ? `زمن التركيب الفني المقدر بورش التوزيع: ~ ${lift.installationTimeHours} ساعات عمل.`
                          : `Temps d'intégration mécanique requis: ~ ${lift.installationTimeHours} heures de labeur.`}
                      </span>
                    </div>

                  </div>

                  {/* Actions footer */}
                  <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 flex gap-2">
                    <button
                      id={`action-load-calc-btn-${lift.id}`}
                      onClick={() => {
                        setCalcBasePrice(lift.basePriceUSD);
                        setActiveTab("calculator");
                        // Toast alert in title
                        window.scrollTo({ top: 150, behavior: "smooth" });
                      }}
                      className="flex-grow bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Calculator size={13} />
                      <span>{lang === "ar" ? "تحميل في حاسبة الاستيراد" : "Simuler Devis de Revient"}</span>
                    </button>
                    <a
                      href={lift.manufacturerUrl || "https://www.alibaba.com/trade/search?SearchText=wheelchair+lift+bus"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded text-xs transition-all flex items-center justify-center"
                      title={lang === "ar" ? "البحث والمقارنة في أسواق الجملة بالصين" : "Inspecter les fournisseurs chinois"}
                      id={`inspect-supplier-link-${lift.id}`}
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>

                </div>
              ))}
            </div>

            {/* Algerian Vehicle Compatibility Matrix list */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6" id="buses-matrix">
              <div className="mb-4">
                <h4 className="text-lg font-bold text-white font-arabic flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  <span>دليل الأسطول الجزائري المتوافق | Registre de Compatibilité des Autobus d'Algérie</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "ar"
                    ? "قاعدة بيانات بمقاسات الأبواب ومستويات الجهد الكهربائي لأبرز خطوط النقل المعتمدة بولاية تلمسان."
                    : "Caractéristiques techniques d'intégration sur les véhicules de transport en circulation à Tlemcen."}
                </p>
              </div>

              <div className="overflow-x-auto" id="buses-table-container">
                <table className="w-full text-right sm:text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-950/50">
                      <th className="py-3 px-4 text-center sm:text-right">{lang === "ar" ? "طراز الحافلة المحلي" : "Modèle local de Bus"}</th>
                      <th className="py-3 px-4">{lang === "ar" ? "المصنع والبلد" : "Constructeur / Assemblage"}</th>
                      <th className="py-3 px-4">{lang === "ar" ? "عرض الباب المتاح" : "Largeur Porte (mm)"}</th>
                      <th className="py-3 px-4">{lang === "ar" ? "ارتفاع الأرضية" : "Hauteur Plancher (mm)"}</th>
                      <th className="py-3 px-4">{lang === "ar" ? "نظام تغذية الكهرباء" : "Tension Électrique"}</th>
                      <th className="py-3 px-4">{lang === "ar" ? "موقع التركيب المقترح" : "Position Recommandée"}</th>
                      <th className="py-3 px-4 text-center">{lang === "ar" ? "الرافعة الصينية الأنسب" : "Élévateur Idéal"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {buses.map((bus) => (
                      <tr key={bus.id} className="hover:bg-slate-950/60 transition-colors" id={`bus-row-${bus.id}`}>
                        <td className="py-3.5 px-4 font-semibold text-white text-right sm:text-left font-arabic">
                          {bus.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{bus.maker}</td>
                        <td className="py-3.5 px-4 font-mono">{bus.doorWidthMm} mm</td>
                        <td className="py-3.5 px-4 font-mono">{bus.floorHeightMm} mm</td>
                        <td className="py-3.5 px-4"><span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px]">{bus.voltage}</span></td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">{bus.doorPositionRecommended}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs px-2.5 py-1 rounded font-bold font-mono">
                            {bus.bestLiftId}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CUSTOMS, LOGISTICS & B2B COMMISSION CALCULATOR */}
        {activeTab === "calculator" && (
          <div className="space-y-6" id="calculator-section">

            {/* Sub header for calc */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <h3 className="text-xl font-bold text-white font-arabic">
                {lang === "ar" ? "حاسبة تكاليف استيراد التجهيزات اللوجستية بالعملة المحلية (DZD)" : "Simulateur de Devis & Calculatrice Douanière Algérie"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "ar"
                  ? "محاكي دقيق لحساب تكلفة شحن الرافعات الطبية من الصين وتخليصها بجمارك موانئ الغرب الجزائري، مع تحديد السعر النهائي بالدينار ومقدار أرباح متعاملي تلمسان مع خيار التقدم بطلب إعفاء جمركي لمساندة العمل الإنساني."
                  : "Calculez fidèlement la conversion USD en DZD, le transit maritime, les taxes de douane et de port, les péages puis la livraison routière à Tlemcen."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Calculator Settings Column */}
              <div className="lg:col-span-5 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl space-y-4" id="calculator-inputs-card">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                    <Calculator size={16} className="text-emerald-400" />
                    <span>{lang === "ar" ? "عوامل تقدير الأسعار للشحنة" : "Données de la Simulation"}</span>
                  </span>
                  <button
                    id="calc-reset-btn"
                    onClick={() => {
                      setCalcBasePrice(1850);
                      setCalcCustomsDuty(15);
                      setCalcVat(9);
                      setCalcFreight(380);
                      setCalcExchangeRate(135.5);
                      setCalcPortFees(45000);
                      setCalcLocalTransport(25000);
                      setCalcMargin(20);
                      setCalcCustomExempt(false);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    title={lang === "ar" ? "إعادة تعيين للقيم الافتراضية للجمارك والجمهورية" : "Réinitialiser aux valeurs d'origine"}
                  >
                    <RefreshCw size={11} />
                    <span>{lang === "ar" ? "افتراضي" : "Reset"}</span>
                  </button>
                </div>

                {/* Custom exemption checkbox toggle */}
                <div className="bg-emerald-950/40 border border-emerald-800/40 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="custom-exempt-checkbox" className="text-xs font-bold text-emerald-300 font-arabic flex items-center gap-1.5 cursor-pointer">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span>{lang === "ar" ? "تفعيل طلب الإعفاء من الرسوم الجمركية" : "Bénéficier de l'Exonération Médicale"}</span>
                    </label>
                    <input
                      type="checkbox"
                      id="custom-exempt-checkbox"
                      checked={calcCustomExempt}
                      onChange={(e) => setCalcCustomExempt(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 bg-slate-800 rounded border-slate-700 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-sans">
                    {lang === "ar"
                      ? "بموجب المادة الخاصة بدعم ذوي الاحتياجات الخاصة، يمكن للمستوردين تقديم ملف لإعفاء الأجهزة المساعدة على التنقل من الرسوم الجمركية (تخفيض الرسوم من 15% إلى 0%)."
                      : "Exonération totale des droits de douane pour le matériel destiné exclusivement aux personnes à mobilité réduite (Taux réduit à 0% au lieu de 15%)."}
                  </p>
                </div>

                {/* Input Fields */}
                <div className="space-y-3.5 text-xs">
                  
                  {/* Base Price */}
                  <div>
                    <label className="block text-slate-400 mb-1">{lang === "ar" ? "السعر الأصلي للرافعة من الصين (USD FOB):" : "Prix FOB unitaire de l'élévateur (USD):"}</label>
                    <div className="relative">
                      <input
                        id="input-base-price"
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-white font-mono font-bold focus:outline-none focus:border-emerald-600"
                        value={calcBasePrice}
                        onChange={(e) => setCalcBasePrice(Number(e.target.value))}
                      />
                      <span className="absolute right-3 top-2 text-slate-500 font-bold">$</span>
                    </div>
                  </div>

                  {/* Freight */}
                  <div>
                    <label className="block text-slate-400 mb-1">{lang === "ar" ? "تكلفة الشحن البحري للوحدة (USD):" : "Transit Maritime unitaire (USD) de Chine à l'Algérie:"}</label>
                    <div className="relative">
                      <input
                        id="input-freight"
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-white font-mono focus:outline-none focus:border-emerald-600"
                        value={calcFreight}
                        onChange={(e) => setCalcFreight(Number(e.target.value))}
                      />
                      <span className="absolute right-3 top-2 text-slate-500 font-bold">$</span>
                    </div>
                  </div>

                  {/* Exchange Rate */}
                  <div>
                    <label className="block text-slate-400 mb-1">{lang === "ar" ? "سعر صرف الدولار مقابل الدينار الجزائري لولاية تلمسان (DZD):" : "Taux de change légal (\$ = DZD):"}</label>
                    <div className="relative">
                      <input
                        id="input-exchange-rate"
                        type="number"
                        step="0.1"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-12 text-white font-mono focus:outline-none focus:border-emerald-600"
                        value={calcExchangeRate}
                        onChange={(e) => setCalcExchangeRate(Number(e.target.value))}
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-[10px]">DZD / USD</span>
                    </div>
                  </div>

                  {/* Customs tax percentage */}
                  <div className={calcCustomExempt ? "opacity-40" : ""}>
                    <label className="block text-slate-400 mb-1">{lang === "ar" ? "نسبة التعريفة الجمركية للبضائع المستوردة (%):" : "Taux douanier d'importation (%):"}</label>
                    <div className="relative">
                      <input
                        id="input-customs-duty"
                        type="number"
                        disabled={calcCustomExempt}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-white font-mono focus:outline-none focus:border-emerald-600"
                        value={calcCustomExempt ? 0 : calcCustomsDuty}
                        onChange={(e) => setCalcCustomsDuty(Number(e.target.value))}
                      />
                      <span className="absolute right-3 top-2 text-slate-500 font-bold">%</span>
                    </div>
                  </div>

                  {/* Value Added Tax percentage */}
                  <div>
                    <label className="block text-slate-400 mb-1">
                      {lang === "ar" ? "ضريبة القيمة المضافة بالجزائر - مخفضة لذوي الاحتياجات (%):" : "TVA applicable réduite handicap (%):"}
                    </label>
                    <div className="relative">
                      <input
                        id="input-vat"
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-white font-mono focus:outline-none focus:border-emerald-600"
                        value={calcVat}
                        onChange={(e) => setCalcVat(Number(e.target.value))}
                      />
                      <span className="absolute right-3 top-2 text-slate-500 font-bold">%</span>
                    </div>
                  </div>

                  {/* Customs port flat fees */}
                  <div>
                    <label className="block text-slate-400 mb-1">{lang === "ar" ? "رسوم الميناء وأتعاب وكيل الترانزيت (DZD):" : "Frais de transit, port & stockage local (DZD):"}</label>
                    <div className="relative">
                      <input
                        id="input-port-fees"
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-12 text-white font-mono focus:outline-none focus:border-emerald-600"
                        value={calcPortFees}
                        onChange={(e) => setCalcPortFees(Number(e.target.value))}
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-[10px]">DZD</span>
                    </div>
                  </div>

                  {/* Local route transport fee from port to Tlemcen */}
                  <div>
                    <label className="block text-slate-400 mb-1">
                      {lang === "ar" ? "تكلفة النقل البري بالشاحنة إلى مخازن تلمسان (DZD):" : "Frais de transport routier vers Tlemcen (DZD):"}
                    </label>
                    <div className="relative">
                      <input
                        id="input-local-transport"
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-12 text-white font-mono focus:outline-none focus:border-emerald-600"
                        value={calcLocalTransport}
                        onChange={(e) => setCalcLocalTransport(Number(e.target.value))}
                      />
                      <span className="absolute right-3 top-2 text-slate-500 text-[10px]">DZD</span>
                    </div>
                  </div>

                  {/* Profit Margin */}
                  <div>
                    <label className="block text-slate-400 mb-1">{lang === "ar" ? "هامش ربح الشركة المستوردة لمشروع تلمسان (%):" : "Marge bénéficiaire de notre hub B2B (%):"}</label>
                    <div className="relative">
                      <input
                        id="input-margin"
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-white font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-600"
                        value={calcMargin}
                        onChange={(e) => setCalcMargin(Number(e.target.value))}
                      />
                      <span className="absolute right-3 top-2 text-slate-500 font-bold">%</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Calculator Summary Column */}
              <div className="lg:col-span-7 space-y-6">
                
                {calculationResult && (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl" id="calc-results-output">
                    
                    {/* Header showing final DZD selling price */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block">
                          {lang === "ar" ? "السعر النهائي المقترح للبيع لشركات النقل" : "PRIX DE VENTE B2B ESTIMÉ (H.T)"}
                        </span>
                        <strong className="text-3xl font-extrabold text-white font-mono block mt-1" id="calculated-sell-price">
                          {Math.round(calculationResult.sellingPriceDZD).toLocaleString()} <span className="text-emerald-400 text-xl font-bold">DZD</span>
                        </strong>
                      </div>
                      <div className="bg-emerald-900/40 border border-emerald-800 px-3 py-1.5 rounded-lg text-emerald-300 text-xs shrink-0 select-none">
                        {lang === "ar" ? `نسبة الأرباح: +${calculationResult.marginRate}%` : `Marge brute: +${calculationResult.marginRate}%`}
                      </div>
                    </div>

                    {/* Step-by-Step pricing cost chain illustration */}
                    <div className="p-6 space-y-4">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                        {lang === "ar" ? "تحليل تشعب التكاليف وإجراءات التوطين بالتفصيل" : "Éclatement analytique du prix de revient"}
                      </h4>

                      <div className="space-y-2.5 text-xs text-slate-300">
                        
                        {/* 1. CIF Price */}
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/60 hover:bg-slate-950/40 px-2 rounded">
                          <span className="text-slate-400">
                            {lang === "ar" ? "1. سعر شراء السلعة شامل الشحن CIF (بالدولار):" : "Prix d'Achat & Fret (CIF USD):"}
                          </span>
                          <span className="font-mono text-white">
                            ${(calculationResult.baseUSD + calculationResult.freightUSD).toLocaleString()} USD
                          </span>
                        </div>

                        {/* 2. Base DZD Cost equivalent */}
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/60 hover:bg-slate-950/40 px-2 rounded">
                          <span className="text-slate-400">
                            {lang === "ar" ? "2. السعر الأساسي بالدينار الجزائري الجزئي (حسب بنك الجزائر):" : "Contre-valeur DZD de base (Banque d'Algérie):"}
                          </span>
                          <span className="font-mono text-white font-semibold">
                            {Math.round(calculationResult.baseCostDZD).toLocaleString()} DZD
                          </span>
                        </div>

                        {/* 3. Customs Duty */}
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/60 hover:bg-slate-950/40 px-2 rounded">
                          <span className="text-slate-400 flex items-center gap-1">
                            <span>{lang === "ar" ? "3. التعريفة الجمركية بالمرفأ المائي (الجمارك):" : "Droits de Douane à l'import:"}</span>
                            {calcCustomExempt && (
                              <span className="bg-emerald-950/80 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded border border-emerald-800">
                                {lang === "ar" ? "معفاة إنساني" : "Exonéré"}
                              </span>
                            )}
                          </span>
                          <span className={`font-mono ${calcCustomExempt ? "text-emerald-500 line-through font-bold" : "text-white"}`}>
                            {Math.round(calculationResult.customsDutyDZD).toLocaleString()} DZD
                          </span>
                        </div>

                        {/* 4. VAT Value */}
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/60 hover:bg-slate-950/40 px-2 rounded">
                          <span className="text-slate-400">
                            {lang === "ar" ? `4. ضريبة القيمة المضافة المحصلة بجمارك الاستيراد (${calcVat}%):` : `Taxe sur la Valeur Ajoutée (TVA) (${calcVat}%):`}
                          </span>
                          <span className="font-mono text-white">
                            {Math.round(calculationResult.vatValueDZD).toLocaleString()} DZD
                          </span>
                        </div>

                        {/* 5. Transit & Port */}
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/60 hover:bg-slate-950/40 px-2 rounded">
                          <span className="text-slate-400">
                            {lang === "ar" ? "5. رسوم تخليص وأوراق جمركية بميناء الوصول:" : "Agréé en Douane & frais portuaires fixes:"}
                          </span>
                          <span className="font-mono text-right text-white">
                            {Math.round(calculationResult.transitFlatDZD).toLocaleString()} DZD
                          </span>
                        </div>

                        {/* 6. Port to Tlemcen */}
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/60 hover:bg-slate-950/40 px-2 rounded">
                          <span className="text-slate-400 flex items-center gap-1">
                            <span>{lang === "ar" ? "6. الشحن الداخلي البري (من وهران/الغزوات إلى تلمسان):" : "Acheminement logistique routier vers Tlemcen Depot:"}</span>
                          </span>
                          <span className="font-mono text-white">
                            {Math.round(calculationResult.transportToTlemcenDZD).toLocaleString()} DZD
                          </span>
                        </div>

                        {/* 7. Total Cost Price (Prix de Revient) */}
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-800 bg-slate-950/80 px-2.5 rounded text-emerald-400 font-bold">
                          <span>
                            {lang === "ar" ? "7. التكلفة الإجمالية للشراء والتوصيل (سعر التكلفة الصافي):" : "Prix de Revient total (Tlemcen Importer Cost):"}
                          </span>
                          <span className="font-mono text-base">
                            {Math.round(calculationResult.totalCostPriceDZD).toLocaleString()} DZD
                          </span>
                        </div>

                        {/* 8. Net MarkUp Profit */}
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/60 hover:bg-slate-950/40 px-2 rounded text-emerald-300">
                          <span className="text-slate-400 font-medium">
                            {lang === "ar" ? "8. الربح المحقق لشركة التوزيع بموجب الهامش:" : "Bénéfice de Distribution B2B à Tlemcen:"}
                          </span>
                          <span className="font-mono">
                            +{Math.round(calculationResult.profitAmountDZD).toLocaleString()} DZD
                          </span>
                        </div>

                      </div>

                    </div>
                  </div>
                )}

                {/* Subsidies, Fundings & Regulatory Support Context Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-bold text-white font-arabic flex items-center gap-2">
                    <Info className="text-emerald-400" size={16} />
                    <span>سياق الدعم والتمويل الحكومي للأجهزة الطبية بالجزائر</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {lang === "ar"
                      ? "تنص القوانين الجزائرية على منح تسهيلات مالية بالتعاون مع صندوق دعم ترقية ذوي الاحتياجات الخاصة، حيث يمكن للحافلات المجهزة التمتع بنقاط أفضلية في مناقصات خطوط النقل الحضري للولاية. كما أن الإعفاء الجمركي المذكور في النموذج يقلص بشكل ملموس سعر البيع للخواص، ليمكّنهم من تحديث حافلاتهم القديمة دون أي عبء مالي باهظ."
                      : "La réglementation encourage l'installation locale de ces aides techniques. En éliminant 15% de taxes d'entrée, les petites lignes suburbaines de Tlemcen peuvent équiper un minibus pour moins de 30 millions de centimes (DZD), ce qui garantit la rentabilité immédiate de l'investissement."}
                  </p>
                </div>

              </div>

            </div>

            {/* B2B INQUIRY SIMULATION SYSTEM CONTEXT CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6" id="simulation-form-card">
              <div className="border-b border-slate-800 pb-4 mb-6">
                <h3 className="text-lg font-bold text-white font-arabic flex items-center gap-2">
                  <PlusCircle className="text-emerald-400" size={20} />
                  <span>تسجيل استفسار طلب تجهيز ومحاكاة عرض B2B لعقد تلمسان</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === "ar" 
                    ? "أدخل تفاصيل المتعامل أو الشركة الناقلة محلياً لبناء ملف عرض تجاري مخصص يتم تقييمه بواسطة الذكاء الاصطناعي."
                    : "Saisissez les coordonnées d'un transporteur local de Tlemcen voulant soulever son dossier à la DTW."}
                </p>
              </div>

              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  
                  {/* Name or Company */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-arabic">{lang === "ar" ? "اسم المتعامل أو المؤسسة الناقلة:" : "Client / Compagnie de Transport:"}</label>
                    <input
                      id="inquiry-client-name"
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600"
                      placeholder="مثال: مؤسسة النقل الحضري والشبه حضري لتلمسان ETUB"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>

                  {/* Type of transport */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-arabic">{lang === "ar" ? "تصنيف الناقل بالولاية:" : "Type d'Opérateur:"}</label>
                    <select
                      id="inquiry-client-type"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-600 cursor-pointer"
                      value={clientType}
                      onChange={(e) => setClientType(e.target.value as any)}
                    >
                      <option value="ETUB Tlemcen (Public)">{lang === "ar" ? "مؤسسة عمومية (ETUB Tlemcen)" : "Société Publique d'État"}</option>
                      <option value="Ligne Privée Suburbaine">{lang === "ar" ? "ناقل خاص / خطوط حضرية شبه معتمدة" : "Exploitant de Ligne Privée"}</option>
                      <option value="Association">{lang === "ar" ? "جمعية رعاية ذوي الاحتياجات الخاصة تلمسان" : "Association Caritative / Médico-sociale"}</option>
                      <option value="Autre">{lang === "ar" ? "هيئات ومرافق عمومية أخرى" : "Autre collectivité locale"}</option>
                    </select>
                  </div>

                  {/* Select Bus */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-arabic">{lang === "ar" ? "طراز الحافلة المراد ترقيتها بالورشة:" : "Modèle de Bus à Convertir:"}</label>
                    <select
                      id="inquiry-bus-model"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-600 cursor-pointer"
                      value={selectedBusId}
                      onChange={(e) => {
                        setSelectedBusId(e.target.value);
                        // Auto match best lift for better defaults
                        const matchedBus = buses.find(b => b.id === e.target.value);
                        if (matchedBus) {
                          setSelectedLiftId(matchedBus.bestLiftId);
                          const matchedLift = lifts.find(l => l.id === matchedBus.bestLiftId);
                          if (matchedLift) {
                            setCalcBasePrice(matchedLift.basePriceUSD);
                          }
                        }
                      }}
                    >
                      {buses.map(bus => (
                        <option key={bus.id} value={bus.id}>{bus.name} ({bus.maker})</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Lift to Install */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-arabic">{lang === "ar" ? "المنصة الصينية المختارة للتجهيز:" : "Élévateur Chinois Recommandé:"}</label>
                    <select
                      id="inquiry-lift-model"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-600 cursor-pointer"
                      value={selectedLiftId}
                      onChange={(e) => {
                        setSelectedLiftId(e.target.value);
                        const matchedLift = lifts.find(l => l.id === e.target.value);
                        if (matchedLift) {
                          setCalcBasePrice(matchedLift.basePriceUSD);
                        }
                      }}
                    >
                      {lifts.map(lift => (
                        <option key={lift.id} value={lift.id}>{lift.id} - {lang === "ar" ? lift.nameAr : lift.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity to Purchase */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-arabic">{lang === "ar" ? "كمية الرافعات المطلوبة (وحدات الأسطول):" : "Quantité d'équipements (Unités):"}</label>
                    <input
                      id="inquiry-quantity"
                      type="number"
                      min="1"
                      max="100"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-600"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                  </div>

                  {/* Pricing Display during form submission */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-end">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">{lang === "ar" ? "القيمة التقريبية للصفقة بالدينار" : "Montant Estimé du Contrat:"}</span>
                    <strong className="text-sm text-emerald-400 font-mono mt-0.5" id="form-pricing-preview">
                      {calculationResult ? (Math.round(calculationResult.sellingPriceDZD) * quantity).toLocaleString() : 0} DZD
                    </strong>
                  </div>

                </div>

                {/* Road and Route analysis specification */}
                <div className="text-xs">
                  <label className="block text-slate-400 mb-1 font-arabic">
                    {lang === "ar" ? "مسار سير الحافلة تلمسان والنقاط الحرجة (تأثير المنحدرات والطبيعة الجغرافية):" : "Ligne de bus & Contraintes Topographiques à Tlemcen:"}
                  </label>
                  <textarea
                    id="inquiry-route-description"
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 h-20"
                    placeholder="امثلة: مسار شتوان الوعر، أو صعود لالة سيتي، الطرق الأثرية بجوار السور التاريخي لمنصورة، درجات حرارة مرتفعة صيفاً..."
                    value={routeDescription}
                    onChange={(e) => setRouteDescription(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    id="submit-inquiry-btn"
                    type="submit"
                    disabled={isSubmittingInquiry}
                    className="flex-grow bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-900/30"
                  >
                    {isSubmittingInquiry ? (
                      <span>{lang === "ar" ? "جاري الحفظ..." : "Enregistrement..."}</span>
                    ) : (
                      <>
                        <PlusCircle size={15} />
                        <span>{lang === "ar" ? "حفظ كشحنة مستهدفة للأنبوب التجاري وعرض السعر" : "Enregistrer et Préparer l'Offre B2B"}</span>
                      </>
                    )}
                  </button>

                  <button
                    id="ai-generate-immediate-btn"
                    type="button"
                    onClick={() => handleAiAnalysis()}
                    disabled={isAiLoading}
                    className="bg-slate-950 hover:bg-slate-900 text-emerald-300 font-bold py-3 px-6 rounded-lg border border-emerald-800/60 transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs"
                  >
                    {isAiLoading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>{lang === "ar" ? "جاري بناء دراسة الذكاء الاصطناعي..." : "Analyse IA en cours..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-emerald-400" />
                        <span>{lang === "ar" ? "بناء وصياغة العرض ومطابقة الخطوط فوراً" : "Générer Proposition d'Inclusion par IA"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* TAB 4: GEMINI-POWERED DECISION COMPLIANCE & PROPOSAL COMPILER */}
        {activeTab === "ai-proposals" && (
          <div className="space-y-6" id="ai-section">
            
            {/* AI Advisor Presentation panel */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles size={180} className="text-emerald-500" />
              </div>

              <div className="relative z-10 max-w-4xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-900/50 rounded-lg text-emerald-400">
                    <Sparkles size={20} className="animate-ping" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white font-arabic">
                      {lang === "ar" ? "مستشار الذكاء الاصطناعي لترقية النقل والامتثال الإداري بتلمسان" : "Consultant d'Accessibilité IA — Rapport de Conformité Wilaya"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {lang === "ar" 
                        ? "توليد ملفات إدارية وتقنية لدعم قرارات استيراد الرافعات وتسهيل حصولها على إعفاءات الرسوم أمام مديرية النقل لولاية تلمسان."
                        : "Rapports de conformité technique et d'évaluation topographique pour la direction des transports de Tlemcen (DTW)."}
                    </p>
                  </div>
                </div>

                {/* Form shortcut if empty */}
                {!aiResult && !isAiLoading && (
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-4 max-w-xl mx-auto">
                    <AlertTriangle className="text-emerald-500 mx-auto" size={40} />
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white">{lang === "ar" ? "لم يتم بناء أي دراسة توافق حتى الآن" : "Aucun rapport généré pour l'instant"}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {lang === "ar" 
                          ? "استخدم الخيار أدناه لتوليد ملف دراسة استشرافية لتقييم ملاءمة تركيب إحدى الرافعات الصينية المختارة على متن أسطول الحافلات العابر لمتعرجات تلمسان الشاهقة وضواحيها الأثرية."
                          : "Sélectionnez un modèle de bus, un élévateur et décrivez le trajet pour obtenir une étude de viabilité d'ingénierie fine alimentée par Gemini."}
                      </p>
                    </div>

                    <button
                      id="ai-tab-redirect-btn"
                      onClick={() => {
                        setActiveTab("calculator");
                        setTimeout(() => {
                          document.getElementById("simulation-form-card")?.scrollIntoView({ behavior: 'smooth' });
                        }, 200);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-555 text-white text-xs font-bold py-2 px-5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <PlusCircle size={14} />
                      <span>{lang === "ar" ? "الرجوع لحاسبة الجدوى وتوليد ملف دراسة" : "Configurer un dossier de simulation"}</span>
                    </button>
                  </div>
                )}

                {/* Loading state indicator */}
                {isAiLoading && (
                  <div className="bg-slate-950 p-12 rounded-xl border border-slate-805 text-center space-y-4 flex flex-col items-center justify-center">
                    <RefreshCw className="text-emerald-400 animate-spin" size={48} />
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-white font-arabic">
                        {lang === "ar" ? "جاري الاتصال بـ Gemini AI لتهيئة وصياغة الملف الاستشاري تلمسان..." : "Rédaction de l'étude ministérielle par Gemini..."}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        {lang === "ar"
                          ? "يقوم الذكاء الاصطناعي الآن بمراجعة مخطط الارتفاع الهيدروليكي، ومطابقة جهد التيار، وحساب تأثير الاهتزازات فوق شوارع المشور المرصوفة، وصياغة عريضة لمديرية النقل لطلب رعاية الإعفاء الجمركي."
                          : "Fusion des caractéristiques de l'autobus et du dispositif de levage chinois. Analyse du relief tlemcénien et formulation de la requête administrative de détaxation fiscale."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Rendered prompt result */}
                {aiResult && (
                  <div className="space-y-4" id="ai-report-presentation font-sans">
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs text-slate-300 font-bold font-sans">
                          {lang === "ar" ? "تم توليد التقرير بنجاح وهو جاهز للطباعة والترجمة" : "Rapport d'expertise commerciale généré avec succès"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          id="ai-print-btn"
                          onClick={() => window.print()}
                          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-200 px-4 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <FileText size={13} />
                          <span>{lang === "ar" ? "طباعة بصيغة PDF / ميرية النقل" : "Imprimer / PDF"}</span>
                        </button>
                        <button
                          id="ai-clear-btn"
                          onClick={() => setAiResult("")}
                          className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs text-red-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {lang === "ar" ? "مسح وإعادة المحاكاة" : "Effacer"}
                        </button>
                      </div>
                    </div>

                    {/* Styled simulation output */}
                    <div className="bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-800 text-sm leading-relaxed text-slate-250 font-sans space-y-4 shadow-inner" id="ai-markdown-rendered-final">
                      <div className="border-b-2 border-emerald-900/60 pb-4 mb-4 text-center space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 tracking-widest block font-arabic">الجمهورية الجزائرية الديمقراطية الشعبية</h4>
                        <div className="flex justify-between text-[11px] text-slate-400 font-sans">
                          <span>ولاية تلمسان</span>
                          <span>مستند دراسة جدوى وتكامل تكنولوجية PMR B2B</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-2 font-arabic">
                          {lang === "ar" ? "تقرير مطابقة فنية وقيم لوجستية: تجهيزات الولوجية المستوردة لذوي الاحتياجات الخاصة" : "RAPPORT D'INTEGRATION ET PROPOSITION DE SUBVENTION ADAPTATION"}
                        </h4>
                      </div>

                      <div className="whitespace-pre-line text-xs md:text-sm text-slate-300 space-y-4 font-sans">
                        {aiResult}
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-800/80 flex justify-between items-center text-[11px] font-sans" id="proposal-footer-stamps">
                        <div className="text-right">
                          <span className="text-slate-500 block">{lang === "ar" ? "إعداد:" : "Rédigé par:"}</span>
                          <span className="font-bold text-slate-300">Algeria B2B Lifts Platform</span>
                        </div>
                        <div className="text-left border border-dashed border-emerald-800/60 bg-emerald-950/20 px-3 py-1.5 rounded">
                          <span className="text-emerald-400 font-bold block">Tlemcen Hub Distributor</span>
                          <span className="text-[10px] text-slate-500 block font-sans">B2B Compliance Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INQUIRIES PIPELINE & B2B PROGRESS */}
        {activeTab === "inquiries" && (
          <div className="space-y-6" id="inquiries-section">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-right sm:text-left">
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-900/50 px-2.5 py-1 rounded inline-block font-mono font-bold tracking-wider mb-2">
                  B2B PIPELINE HUB & LOGISTICS (TLMC)
                </span>
                <h3 className="text-xl font-bold text-white font-arabic">
                  {lang === "ar" ? "متابعة مسار تعاقدات وطلبيات توريد الرافعات" : "Suivi d'Adaptation & Approvisionnement"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === "ar"
                    ? "متابعة فورية لمراحل الطلب الجمركية واللوجستية ووصولها إلى مستودعات المتعاملين بولاية تلمسان."
                    : "Suivi en temps réel des commandes, états des exonérations de taxes de douane et valeurs globales."}
                </p>
              </div>
              <button
                id="add-inquiry-shortcut-from-list"
                onClick={() => {
                  setActiveTab("calculator");
                  // Focus the form
                  setTimeout(() => {
                    document.getElementById("simulation-form-card")?.scrollIntoView({ behavior: 'smooth' });
                  }, 200);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>{lang === "ar" ? "إضافة محاكاة متعامل جديد" : "Créer Demande"}</span>
              </button>
            </div>

            {/* Inquiries table */}
            {inquiries.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center" id="empty-inquiries-state">
                <Users className="text-slate-600 mx-auto mb-3" size={42} />
                <h4 className="text-sm font-bold text-slate-300 font-arabic">{lang === "ar" ? "لا توجد أي استفسارات مسجلة حالياً" : "Aucun dossier client enregistré pour l'instant"}</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  {lang === "ar"
                    ? "استخدم نافذة الحاسبة لتسجيل طلبات الشركات والمتعاملين في Hennaya أو Chetouane للتجهيز."
                    : "Les opportunités d'affaires auprès de l'ETUB et des lignes privées s'afficheront ici."}
                </p>
              </div>
            ) : (
              <div className="space-y-4" id="inquiries-pipeline-container animate-fade-in">
                {inquiries.map((inq) => {
                  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === inq.status);
                  const stepIndexNormalized = stepIndex !== -1 ? stepIndex : 0;

                  return (
                    <div 
                      key={inq.id} 
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-800/30 transition-all flex flex-col gap-6"
                      id={`inquiry-card-${inq.id}`}
                    >
                      {/* Top Row containing Metadata & Price breakdown */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        
                        {/* Left Meta info */}
                        <div className="space-y-2 max-w-xl">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="bg-slate-950 text-slate-400 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                              {inq.id}
                            </span>
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/60 text-[10px] px-2 py-0.5 rounded font-bold font-arabic">
                              {inq.clientType === "Bus Company" ? (lang === "ar" ? "مؤسسة نقل حضري" : "Transport Urbain") : (lang === "ar" ? "ناقل خاص / مدرسة" : "Transport Privé / Scolaire")}
                            </span>
                            <span className="text-slate-500 text-[11px] font-mono">
                              {new Date(inq.date).toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-FR")}
                            </span>
                          </div>
                          
                          <h4 className="text-base font-bold text-white font-arabic">
                            {inq.clientName}
                          </h4>

                          <div className="space-y-1 font-sans">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                              <span className="text-slate-400">
                                {lang === "ar" ? "أجهزة الأسطول المستوردة:" : "Dispositifs d'Importation:"} <strong className="text-slate-200">{inq.selectedLift}</strong>
                              </span>
                              <span className="text-slate-400">
                                {lang === "ar" ? "الحافلة لولاية تلمسان:" : "Véhicule cible:"} <strong className="text-slate-200">{inq.busModel}</strong>
                              </span>
                              <span className="text-slate-400">
                                {lang === "ar" ? "الكمية المطلوبة:" : "Quantité commandée:"} <strong className="text-white bg-slate-950 font-mono text-[11px] px-2 py-0.5 rounded">{inq.quantity}</strong>
                              </span>
                            </div>
                            
                            {inq.routeDescription && (
                              <p className="text-xs text-slate-420 italic bg-slate-950 p-2.5 rounded-lg border border-slate-850 mt-1 lines-clamp-1 flex items-start gap-1">
                                <MapPin size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span>{inq.routeDescription}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Price display & AI Actions */}
                        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-end lg:items-center gap-3 shrink-0 w-full md:w-auto text-right">
                          <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 text-right w-full md:w-auto">
                            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">{lang === "ar" ? "القيمة الكلية التقديرية" : "Valeur Estimation DZD"}</span>
                            <strong className="text-base font-mono font-bold text-emerald-400 block mt-0.5">
                              {inq.priceBreakdown 
                                ? (Math.round(inq.priceBreakdown.sellingPriceDZD) * inq.quantity).toLocaleString() 
                                : "Calculating..."}{" "}
                              <span className="text-xs text-emerald-300 font-bold">DZD</span>
                            </strong>
                          </div>

                          <div className="flex gap-2">
                            <button
                              id={`run-inquiry-ai-btn-${inq.id}`}
                              onClick={() => handleAiAnalysis(inq)}
                              disabled={isAiLoading}
                              className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-bold py-2.5 px-4 rounded-lg border border-emerald-700/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-grow sm:flex-grow-0"
                              title={lang === "ar" ? "توليد ملف دراسة ملاءمة خط السير فورا" : "Lancer diagnostic d'accessibilité par IA"}
                            >
                              <Sparkles size={13} className="text-emerald-400" />
                              <span>{lang === "ar" ? "بناء ملف دراسة الجدوى" : "Générer Rapport IA"}</span>
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Interactive Visual Tracker Progress Line */}
                      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 w-full" id={`tracker-${inq.id}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-2 border-b border-slate-900/40 gap-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 font-sans">
                            <Truck size={12} className="text-emerald-400" />
                            <span>{lang === "ar" ? "حالة تنفيذ الطلب ومسار التوريد" : "Suivi et étapes du pipeline logistique"}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded text-left sm:text-right font-arabic">
                              {lang === "ar" ? "انقر على أي خطوة لتحديث حالة التوريد" : "Cliquez sur une étape pour changer"}
                            </span>
                            <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-900/50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                              <span>{lang === "ar" ? STATUS_STEPS[stepIndexNormalized].labelAr : STATUS_STEPS[stepIndexNormalized].labelFr}</span>
                            </span>
                          </div>
                        </div>

                        {/* Progress track nodes */}
                        <div className="relative flex flex-col sm:flex-row justify-between items-center w-full px-2 py-4 gap-6 sm:gap-0">
                          {/* Background line */}
                          <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-800 -translate-y-1/2 z-0 hidden sm:block" />
                          
                          {/* Active completed path line */}
                          <div 
                            className="absolute top-1/2 left-10 h-0.5 bg-gradient-to-r from-emerald-600 to-cyan-500 -translate-y-1/2 z-0 transition-all duration-500 hidden sm:block" 
                            style={{ width: `${(stepIndexNormalized / (STATUS_STEPS.length - 1)) * 88}%` }}
                          />

                          {STATUS_STEPS.map((step, idx) => {
                            const isCompleted = idx < stepIndexNormalized;
                            const isActive = idx === stepIndexNormalized;
                            
                            let NodeIcon = Info;
                            if (step.key === "Pending") NodeIcon = Info;
                            if (step.key === "Customs Clearance") NodeIcon = ShieldCheck;
                            if (step.key === "In Transit to Tlemcen") NodeIcon = Truck;
                            if (step.key === "Installed") NodeIcon = Wrench;

                            return (
                              <button
                                key={step.key}
                                type="button"
                                onClick={() => handleUpdateStatus(inq.id, step.key)}
                                className="relative z-10 flex flex-row sm:flex-col items-center gap-3 sm:gap-1.5 group transition-transform hover:scale-105 cursor-pointer focus:outline-none w-full sm:w-auto"
                                id={`step-node-${inq.id}-${step.key}`}
                                title={lang === "ar" ? `تغيير الحالة إلى: ${step.labelAr}` : `Changer le statut en : ${step.labelFr}`}
                              >
                                {/* Circular Node */}
                                <div 
                                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                                    isCompleted 
                                      ? "bg-slate-900 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/20" 
                                      : isActive 
                                        ? "bg-emerald-600 border-white text-white shadow-lg shadow-emerald-500/40 animate-pulse" 
                                        : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                                  }`}
                                >
                                  <NodeIcon size={16} />
                                </div>

                                {/* Text labels beside or under */}
                                <div className="text-left sm:text-center">
                                  <span 
                                    className={`block text-[11px] font-bold font-arabic transition-all ${
                                      isActive ? "text-emerald-400 font-extrabold" : isCompleted ? "text-slate-300" : "text-slate-500 hover:text-slate-400"
                                    }`}
                                  >
                                    {lang === "ar" ? step.labelAr : step.labelFr}
                                  </span>
                                  <span className="block text-[8px] text-slate-500 uppercase font-mono tracking-tighter mt-0.5">
                                    {lang === "ar" ? step.labelFr : step.labelAr}
                                  </span>
                                </div>

                                {/* Hover action label */}
                                <div className="absolute -top-10 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-[9px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl text-emerald-300 font-mono z-30 hidden sm:block">
                                  {isActive ? "✓ CURRENT" : "★ CLICK TO UPDATE"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* B2B Pipeline Analytics Context Graphic representation */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6" id="pipeline-analytics">
              <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-right sm:text-left">
                {lang === "ar" ? "تحليل مؤشرات الامتثال وتوطين النقل لولاية تلمسان" : "Statistiques d'Intégration d'Accessibilité dans la Wilaya"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="pipeline-stats-grid">
                
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <span className="text-xs text-slate-450 block">{lang === "ar" ? "القيمة المتوقعة للصفقات الجارية" : "Encours Total Estimé (DZD)"}</span>
                  <strong className="text-2xl font-mono text-emerald-400 mt-1 block">
                    {inquiries.reduce((sum, item) => sum + (item.priceBreakdown ? item.priceBreakdown.sellingPriceDZD * item.quantity : 0), 0).toLocaleString()} DZD
                  </strong>
                  <p className="text-[10px] text-slate-500 mt-1">{lang === "ar" ? "بناءً على طلبات الناقلين الحالية" : "Converti au taux officiel"}</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <span className="text-xs text-slate-450 block">{lang === "ar" ? "إجمالي الأجهزة المستهدفة لولاية تلمسان" : "Total Équipements Commandés"}</span>
                  <strong className="text-2xl font-mono text-white mt-1 block">
                    {inquiries.reduce((sum, item) => sum + item.quantity, 0)} Units
                  </strong>
                  <p className="text-[10px] text-slate-500 mt-1">{lang === "ar" ? "رافعات 12V/24V كهرومائية متفرقة" : "Matériels de levage chinois"}</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <span className="text-xs text-slate-450 block">{lang === "ar" ? "الولاية المستهدفة" : "Région Admin"}</span>
                  <strong className="text-2xl text-white mt-1 block">Tlemcen (13)</strong>
                  <p className="text-[10px] text-slate-500 mt-1">Hennaya, Chetouane, Maghnia</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <span className="text-xs text-slate-450 block">{lang === "ar" ? "اعتمادات الإعفاء الجمركي الموجهة" : "Économie Fiscale Réalisée (DZD)"}</span>
                  <strong className="text-2xl font-mono text-teal-400 mt-1 block">
                    {inquiries.reduce((sum, item) => {
                      if (item.priceBreakdown) {
                        // Estimated customs duty saved if exempt (15% of CIF)
                        const saved = item.priceBreakdown.isDutyExempt ? item.priceBreakdown.customsDutyDZD : 0;
                        return sum + (saved * item.quantity);
                      }
                      return sum;
                    }, 0).toLocaleString()} DZD
                  </strong>
                  <p className="text-[10px] text-slate-500 mt-1">{lang === "ar" ? "تأثير الإعفاءات الطبية" : "Grâce à l'exonération ministérielle"}</p>
                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-8 mt-12 text-xs text-slate-400" id="main-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-right font-sans">
            <span className="font-bold text-white text-sm block font-arabic">بوابة تلمسان لرافعات الكراسي المتحركة B2B</span>
            <p className="mt-1">
              {lang === "ar"
                ? "مشروع التمكين اللوجستي والإدماج الإنساني لنقل ذوي الاحتياجات الخاصة بولاية تلمسان."
                : "Plateforme B2B algérienne d'importation et d'adaptation PMR pour le parc roulant de Tlemcen."}
            </p>
          </div>
          <div className="text-center md:text-left text-slate-500 space-y-1">
            <p>China-Algeria B2B Logistics Compliance Engine V1.1</p>
            <p>Official Bank rates applied &bull; Port of Ghazaouet / Oran &bull; Hennaya Depot</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
