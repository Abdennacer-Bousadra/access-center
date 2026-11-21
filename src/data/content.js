/**
 * ACCESS CENTER — Central data file.
 * Brand info + services + courses. Localized copy (titles, descriptions…) lives
 * in @src/i18n/translations.js under `servicesItem.*` / `coursesItem.*` and is
 * referenced here via the `i18nKey` of each item (resolved with t()).
 */

export const site = {
  name: 'ACCESS CENTER',
  // Single official phone / WhatsApp number
  whatsapp: '212762934592',
  phone: '+212 762-934592',
  email: 'contact@accesscenter.ma',
  // Canonical origin — single source of truth for every website link
  url: 'https://accesscenter.ma',
  // Human-readable label shown in the footer
  website: 'www.accesscenter.ma',
  city: 'Loudaya, Marrakech',
  country: 'Morocco',
  socials: {
    instagram: 'https://www.instagram.com/societe_access_center',
    facebook: 'https://www.facebook.com/profile.php?id=61593337464349',
    youtube: 'http://www.youtube.com/@AccessCenter-m2p',
  },
}

/* -------------------------------------------------------------------------- */
/*  SERVICES                                                                   */
/* -------------------------------------------------------------------------- */

// Category keys — labels are localized in the i18n dictionary under `categories.*`
export const serviceCategories = ['all', 'printing', 'photoVideo', 'design', 'digital', 'marketing']

export const services = [
  {
    id: 'photo-identite',
    icon: 'aperture',
    category: 'photoVideo',
    image:
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
    price: 25, // DH
    i18nKey: 'servicesItem.photoId',
  },
  {
    id: 'shooting',
    icon: 'camera',
    category: 'photoVideo',
    image:
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
    price: 199, // DH
    i18nKey: 'servicesItem.shooting',
  },
  {
    id: 'logo-design',
    icon: 'pentool',
    category: 'design',
    image:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
    price: 199, // DH
    i18nKey: 'servicesItem.logoDesign',
  },
  {
    id: 'graphic-design',
    icon: 'palette',
    category: 'design',
    image:
      'https://images.unsplash.com/photo-1554224155-cfa08c2a758f?auto=format&fit=crop&w=800&q=80',
    price: 199, // DH
    i18nKey: 'servicesItem.graphicDesign',
  },
  {
    id: 'montage-video',
    icon: 'clapperboard',
    category: 'photoVideo',
    image:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    price: 199, // DH
    i18nKey: 'servicesItem.videoEditing',
  },
  {
    id: 'podcast',
    icon: 'mic',
    category: 'photoVideo',
    image:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
    price: 299, // DH
    i18nKey: 'servicesItem.podcast',
  },
  {
    id: 'marketing',
    icon: 'megaphone',
    category: 'marketing',
    image:
      'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=800&q=80',
    price: 299, // DH
    i18nKey: 'servicesItem.marketing',
  },
  {
    id: 'site-web',
    icon: 'globe',
    category: 'digital',
    image:
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=800&q=80',
    price: 1499, // DH
    i18nKey: 'servicesItem.website',
  },
  {
    id: 'installation-it',
    icon: 'monitorcog',
    category: 'digital',
    image:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    price: 49, // DH
    i18nKey: 'servicesItem.itInstall',
  },
  {
    id: 'bureautique-impression',
    icon: 'filetext',
    category: 'printing',
    image:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80',
    price: null, // on request — see onRequest flag
    onRequest: true,
    i18nKey: 'servicesItem.office',
  },
]

/* -------------------------------------------------------------------------- */
/*  COURSES / FORMATIONS                                                       */
/* -------------------------------------------------------------------------- */

// Category keys — labels are localized under `categories.*`
export const courseCategories = ['all', 'digitalIT', 'designMedia', 'culinary', 'languages']

// Registration fee is identical for every course (200 DH).
export const courseRegistrationFee = 200

export const courses = [
  {
    id: 'formation-3d',
    icon: 'box',
    category: 'digitalIT',
    arabic: 'تكوين 3D',
    image:
      'https://images.unsplash.com/photo-1492551557933-34265f7af79e?auto=format&fit=crop&w=800&q=80',
    durationMonths: 3,
    fee: 1500, // DH / month
    i18nKey: 'coursesItem.model3d',
  },
  {
    id: 'cuisine-patisserie',
    icon: 'chefhat',
    category: 'culinary',
    arabic: 'الطبخ والحلوات',
    image:
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    durationMonths: 3,
    fee: 1300, // DH / month
    i18nKey: 'coursesItem.cooking',
  },
  {
    id: 'camera-installation',
    icon: 'shieldcheck',
    category: 'digitalIT',
    arabic: 'تركيب كاميرات المراقبة',
    image:
      'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    durationMonths: 1,
    fee: 800, // DH / month
    i18nKey: 'coursesItem.cameras',
  },
  {
    id: 'solaire-installation',
    icon: 'sun',
    category: 'digitalIT',
    arabic: 'تركيب ألواح الطاقة الشمسية',
    image:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    durationMonths: 1,
    fee: 1300, // DH / month
    i18nKey: 'coursesItem.solar',
  },
  {
    id: 'montage-premiere',
    icon: 'video',
    category: 'designMedia',
    arabic: 'تكوين المونتاج (Adobe Premiere)',
    image:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    durationMonths: 1,
    fee: 800, // DH / month
    i18nKey: 'coursesItem.premiere',
  },
  {
    id: 'photographie',
    icon: 'camera',
    category: 'designMedia',
    arabic: 'تكوين التصوير الفوتوغرافي',
    image:
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
    durationMonths: 1,
    fee: 800, // DH / month
    i18nKey: 'coursesItem.photography',
  },
  {
    id: 'montage-capcut',
    icon: 'clapperboard',
    category: 'designMedia',
    arabic: 'تكوين المونتاج (CapCut)',
    image:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    durationMonths: 1,
    fee: 500, // DH / month
    i18nKey: 'coursesItem.capcut',
  },
  {
    id: 'design',
    icon: 'palette',
    category: 'designMedia',
    arabic: 'تكوين الديزاين',
    image:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
    durationMonths: 3,
    fee: 300, // DH / month
    i18nKey: 'coursesItem.design',
  },
  {
    id: 'langues',
    icon: 'languages',
    category: 'languages',
    arabic: 'تكوين اللغات',
    image:
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    durationMonths: 3,
    fee: 250, // DH / month
    i18nKey: 'coursesItem.languages',
  },
  {
    id: 'studio-photo',
    icon: 'camera',
    category: 'designMedia',
    arabic: 'إنشاء ستوديو تصوير احترافي',
    image:
      'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&w=800&q=80',
    durationMonths: 1,
    fee: 500, // DH / month
    i18nKey: 'coursesItem.studio',
  },
  {
    id: 'video-techniques',
    icon: 'video',
    category: 'designMedia',
    arabic: 'تقنيات تصوير الفيديو الاحترافي',
    image:
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
    durationMonths: 1,
    fee: 500, // DH / month
    i18nKey: 'coursesItem.videoTech',
  },
  {
    id: 'ecommerce',
    icon: 'shoppingcart',
    category: 'digitalIT',
    arabic: 'التجارة الإلكترونية (E-commerce)',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    durationMonths: 6,
    fee: 300, // DH / month
    i18nKey: 'coursesItem.ecommerce',
  },
  {
    id: 'informatique',
    icon: 'monitorcog',
    category: 'digitalIT',
    arabic: 'تكوين الإعلاميات',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    durationMonths: 3,
    fee: 300, // DH / month
    i18nKey: 'coursesItem.it',
  },
  {
    id: 'voice-over',
    icon: 'radio',
    category: 'designMedia',
    arabic: 'تكوين الفويس أوفر (Voice Over)',
    image:
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
    durationMonths: 1,
    fee: 500, // DH / month
    i18nKey: 'coursesItem.voiceover',
  },
]