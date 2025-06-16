
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

type Language = "it" | "en" | "fr" | "ar" | "fa";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Default translations for common phrases
const translations: Record<Language, Record<string, string>> = {
  it: {
    "home": "Home",
    "specialties": "Categorie",
    "about": "Chi Siamo",
    "menu": "Prodotti",
    "gallery": "Galleria",
    "reviews": "Recensioni",
    "contact": "Contatti",
    "discover": "Scopri",
    "ourSpecialties": "Le Nostre Categorie",
    "reservations": "Ordini",
    "contactUs": "Contattaci",
    "makeReservation": "Fai un Ordine",
    "yourName": "Il Tuo Nome",
    "phoneNumber": "Numero di Telefono",
    "date": "Data",
    "time": "Ora",
    "numberOfGuests": "Quantità",
    "specialRequests": "Richieste Speciali",
    "requestReservation": "Invia Ordine",
    "processingRequest": "Elaborazione...",
    "findUs": "Trovaci",
    "address": "Indirizzo",
    "phone": "Telefono",
    "email": "Email",
    "hours": "Orari",
    "ourMenu": "I Nostri Prodotti",
    "menuDescription": "Esplora la nostra varietà di composizioni floreali e servizi",
    "downloadMenu": "Scarica Catalogo",
    "menuUnavailable": "Il catalogo PDF non è ancora disponibile",
    "menuComingSoon": "Il nostro catalogo completo sarà presto disponibile",
    "freshFlowers": "Fiori freschi per ogni occasione",
    "indoorOutdoorPlants": "Piante da interno ed esterno per decorare con la natura",
    "highQualityFakeFlowers": "Fiori finti di alta qualità, ideali per decorazioni durature",
    "tailorMadeServices": "Servizi floreali su misura per cerimonie, eventi e ambienti",
    "yearsExperience": "Anni di Esperienza",
    "happyCustomers": "Clienti Felici",
    "flowerVarieties": "Varietà di Fiori",
  },
  en: {
    "home": "Home",
    "specialties": "Categories",
    "about": "About",
    "menu": "Products",
    "gallery": "Gallery",
    "reviews": "Reviews",
    "contact": "Contact",
    "discover": "Discover",
    "ourSpecialties": "Our Categories",
    "reservations": "Orders",
    "contactUs": "Contact Us",
    "makeReservation": "Place an Order",
    "yourName": "Your Name",
    "phoneNumber": "Phone Number",
    "date": "Date",
    "time": "Time",
    "numberOfGuests": "Quantity",
    "specialRequests": "Special Requests",
    "requestReservation": "Submit Order",
    "processingRequest": "Processing...",
    "findUs": "Find Us",
    "address": "Address",
    "phone": "Phone",
    "email": "Email",
    "hours": "Hours",
    "ourMenu": "Our Products",
    "menuDescription": "Explore our diverse selection of floral arrangements and services",
    "downloadMenu": "Download Catalog",
    "menuUnavailable": "Product catalog PDF is not available yet",
    "menuComingSoon": "Our complete catalog will be available soon",
  },
  fr: {
    "home": "Accueil",
    "specialties": "Catégories",
    "about": "À Propos",
    "menu": "Produits",
    "gallery": "Galerie",
    "reviews": "Avis",
    "contact": "Contact",
    "discover": "Découvrir",
    "ourSpecialties": "Nos Catégories",
    "reservations": "Commandes",
    "contactUs": "Nous Contacter",
    "makeReservation": "Passer Commande",
    "yourName": "Votre Nom",
    "phoneNumber": "Numéro de Téléphone",
    "date": "Date",
    "time": "Heure",
    "numberOfGuests": "Quantité",
    "specialRequests": "Demandes Spéciales",
    "requestReservation": "Envoyer Commande",
    "processingRequest": "Traitement...",
    "findUs": "Nous Trouver",
    "address": "Adresse",
    "phone": "Téléphone",
    "email": "Email",
    "hours": "Horaires",
    "ourMenu": "Nos Produits",
    "menuDescription": "Explorez notre sélection variée d'arrangements floraux et services",
    "downloadMenu": "Télécharger Catalogue",
    "menuUnavailable": "Le catalogue PDF n'est pas encore disponible",
    "menuComingSoon": "Notre catalogue complet sera bientôt disponible",
  },
  ar: {
    "home": "الرئيسية",
    "specialties": "الفئات",
    "about": "من نحن",
    "menu": "المنتجات",
    "gallery": "المعرض",
    "reviews": "التقييمات",
    "contact": "اتصل بنا",
    "discover": "اكتشف",
    "ourSpecialties": "فئاتنا",
    "reservations": "الطلبات",
    "contactUs": "اتصل بنا",
    "makeReservation": "اطلب الآن",
    "yourName": "اسمك",
    "phoneNumber": "رقم الهاتف",
    "date": "التاريخ",
    "time": "الوقت",
    "numberOfGuests": "الكمية",
    "specialRequests": "طلبات خاصة",
    "requestReservation": "إرسال الطلب",
    "processingRequest": "جاري المعالجة...",
    "findUs": "جدنا",
    "address": "العنوان",
    "phone": "الهاتف",
    "email": "البريد الإلكتروني",
    "hours": "ساعات العمل",
    "ourMenu": "منتجاتنا",
    "menuDescription": "استكشف مجموعتنا المتنوعة من التنسيقات الزهرية والخدمات",
    "downloadMenu": "تحميل الكتالوج",
    "menuUnavailable": "كتالوج المنتجات PDF غير متوفر بعد",
    "menuComingSoon": "سيكون كتالوجنا الكامل متاحًا قريبًا",
  },
  fa: {
    "home": "خانه",
    "specialties": "دسته‌بندی‌ها",
    "about": "درباره ما",
    "menu": "محصولات",
    "gallery": "گالری",
    "reviews": "نظرات",
    "contact": "تماس با ما",
    "discover": "کشف کنید",
    "ourSpecialties": "دسته‌بندی‌های ما",
    "reservations": "سفارشات",
    "contactUs": "با ما تماس بگیرید",
    "makeReservation": "ثبت سفارش",
    "yourName": "نام شما",
    "phoneNumber": "شماره تلفن",
    "date": "تاریخ",
    "time": "زمان",
    "numberOfGuests": "تعداد",
    "specialRequests": "درخواست های خاص",
    "requestReservation": "ارسال سفارش",
    "processingRequest": "در حال پردازش...",
    "findUs": "ما را پیدا کنید",
    "address": "آدرس",
    "phone": "تلفن",
    "email": "ایمیل",
    "hours": "ساعات کاری",
    "ourMenu": "محصولات ما",
    "menuDescription": "مجموعه متنوعی از تنظیمات گل و خدمات ما را کاوش کنید",
    "downloadMenu": "دانلود کاتالوگ",
    "menuUnavailable": "کاتالوگ محصولات PDF هنوز در دسترس نیست",
    "menuComingSoon": "کاتالوگ کامل ما به زودی در دسترس خواهد بود",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("it"); // Default to Italian
  
  useEffect(() => {
    // Initialize default language settings if they don't exist
    const savedSettings = localStorage.getItem('flowerShopSettings');
    if (!savedSettings) {
      const defaultSettings = {
        totalSeats: 50,
        reservationDuration: 120,
        openingTime: "08:00",
        closingTime: "19:00",
        languages: ["it", "en", "fr", "ar", "fa"],
        defaultLanguage: "it"
      };
      localStorage.setItem('flowerShopSettings', JSON.stringify(defaultSettings));
    } else {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.defaultLanguage) {
          setLanguageState(parsedSettings.defaultLanguage as Language);
        }
      } catch (e) {
        console.error('Failed to parse settings for language');
      }
    }
    
    // Set the html lang attribute
    document.documentElement.lang = language;
    
    // Set RTL for Arabic and Persian
    if (language === "ar" || language === "fa") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    
    // Update settings in localStorage
    const savedSettings = localStorage.getItem('flowerShopSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        parsedSettings.defaultLanguage = lang;
        localStorage.setItem('flowerShopSettings', JSON.stringify(parsedSettings));
      } catch (e) {
        console.error('Failed to update language setting');
      }
    }
  };

  const t = (key: string) => {
    return translations[language][key] || translations.en[key] || key;
  };

  const value = { language, setLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
