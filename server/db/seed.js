import '../config.js'
import { pool } from '../db.js'

// Source: src/data/content.js + src/i18n/translations.js (FR/AR, verbatim).
// Prices are MAD. `null` price = price on request.

const services = [
  {
    // photo-identite
    category: 'photoVideo',
    icon: 'aperture',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
    price: 25,
    nameFr: "Photos d'Identité",
    nameAr: 'تصوير الهوية',
    descFr: 'Photos de carte nationale / passeport / école',
    descAr: 'صور البطاقة الوطنية / جواز السفر / المدرسة',
  },
  {
    // shooting
    category: 'photoVideo',
    icon: 'camera',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
    price: 199,
    nameFr: 'Shooting Photo',
    nameAr: 'جلسات تصوير (Shooting Photo)',
    descFr: 'Photographie de produits, portraits et événements',
    descAr: 'تصوير المنتجات / البورتري والأحداث',
  },
  {
    // logo-design
    category: 'design',
    icon: 'pentool',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
    price: 199,
    nameFr: 'Création de Logo',
    nameAr: 'تصميم شعار (Création de Logo)',
    descFr: "Conception d'un logo professionnel avec fichiers sources",
    descAr: 'تصميم لوغو احترافي مع ملفات العمل',
  },
  {
    // graphic-design
    category: 'design',
    icon: 'palette',
    image: 'https://images.unsplash.com/photo-1554224155-cfa08c2a758f?auto=format&fit=crop&w=800&q=80',
    price: 199,
    nameFr: 'Design Graphique',
    nameAr: 'تصميم جرافيك (Design Graphique)',
    descFr: 'Flyers, cartes de visite, affiches',
    descAr: 'فلاير، بطاقات زيارة، ملصقات',
  },
  {
    // montage-video
    category: 'photoVideo',
    icon: 'clapperboard',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    price: 199,
    nameFr: 'Montage Vidéo',
    nameAr: 'مونتاج الفيديو (Montage Vidéo)',
    descFr: 'Reels, TikTok, vidéos publicitaires et promotionnelles',
    descAr: 'ريلز، تيك توك، فيديوهات إعلانية وترويجية',
  },
  {
    // podcast
    category: 'photoVideo',
    icon: 'mic',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
    price: 299,
    nameFr: 'Podcast & Voix-off',
    nameAr: 'تسجيل وبودكاست (Podcast & Voix-off)',
    descFr: 'Enregistrement audio, montage et ingénierie du son',
    descAr: 'تسجيل صوتي، مونتاج وهندسة الصوت',
  },
  {
    // marketing
    category: 'marketing',
    icon: 'megaphone',
    image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=800&q=80',
    price: 299,
    nameFr: 'Marketing & Publicité',
    nameAr: 'إعلانات وتسويق (Marketing & Publicité)',
    descFr: 'Préparation et gestion de campagnes publicitaires financées',
    descAr: 'إعداد وإدارة الحملات الإعلانية الممولة',
  },
  {
    // site-web
    category: 'digital',
    icon: 'globe',
    image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=800&q=80',
    price: 1499,
    nameFr: 'Création de Site Internet',
    nameAr: 'تصميم المواقع (Création Site Internet)',
    descFr: 'Site vitrine ou boutique en ligne',
    descAr: 'موقع تعريفي أو متجر إلكتروني',
  },
  {
    // installation-it
    category: 'digital',
    icon: 'monitorcog',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    price: 49,
    nameFr: 'Installation & Maintenance IT',
    nameAr: 'تثبيت البرامج والصيانة (Installation & IT)',
    descFr: 'Installation de systèmes, logiciels de création, solutions techniques',
    descAr: 'تثبيت الأنظمة، برامج التصميم، حلول تقنية',
  },
  {
    // bureautique-impression
    category: 'printing',
    icon: 'filetext',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80',
    price: null,
    nameFr: 'Bureautique & Impression',
    nameAr: 'خدمات مكتبية وطباعة (Bureautique & Impression)',
    descFr: 'Impression, copie, numérisation, traitement de documents',
    descAr: 'طباعة، نسخ، سكان، معالجة الوثائق',
  },
]

const courses = [
  {
    // formation-3d
    category: 'digitalIT',
    icon: 'box',
    image: 'https://images.unsplash.com/photo-1492551557933-34265f7af79e?auto=format&fit=crop&w=800&q=80',
    price: 1500,
    durationMonths: 3,
    nameFr: 'Formation 3D',
    nameAr: 'تكوين 3D',
    descFr:
      'Modélisation 3D, texturing et rendu pour l’animation, l’architecture et la création de contenu.',
    descAr:
      'تعلّم النمذجة، التضبيب (Texturing) والإخراج (Rendering) ثلاثي الأبعاد للرسوم المتحركة والهندسة المعمارية وإنشاء المحتوى.',
  },
  {
    // cuisine-patisserie
    category: 'culinary',
    icon: 'chefhat',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    price: 1300,
    durationMonths: 3,
    nameFr: 'Cuisine & Pâtisserie',
    nameAr: 'الطبخ والحلوات',
    descFr:
      'Maîtrisez les techniques de cuisine et de pâtisserie, la présentation et les traditions gastronomiques.',
    descAr: 'أتقن تقنيات الطبخ والحلويات، التقديم والتقاليد الغذائية.',
  },
  {
    // camera-installation
    category: 'digitalIT',
    icon: 'shieldcheck',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    price: 800,
    durationMonths: 1,
    nameFr: 'Installation de Caméras de Surveillance',
    nameAr: 'تركيب كاميرات المراقبة',
    descFr: 'Installation et configuration de caméras de surveillance et de systèmes de sécurité.',
    descAr: 'تركيب وإعداد كاميرات المراقبة وأنظمة الأمن.',
  },
  {
    // solaire-installation
    category: 'digitalIT',
    icon: 'sun',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    price: 1300,
    durationMonths: 1,
    nameFr: 'Installation de Panneaux Solaires',
    nameAr: 'تركيب ألواح الطاقة الشمسية',
    descFr: 'Installation et branchement d’onduleurs, panneaux solaires et systèmes d’énergie.',
    descAr: 'تركيب وتوصيل العواكس والألواح الشمسية وأنظمة الطاقة.',
  },
  {
    // montage-premiere
    category: 'designMedia',
    icon: 'video',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    price: 800,
    durationMonths: 1,
    nameFr: 'Montage Vidéo (Adobe Premiere)',
    nameAr: 'تكوين المونتاج (Adobe Premiere)',
    descFr: 'Montage vidéo professionnel avec Adobe Premiere pour des contenus de qualité.',
    descAr: 'مونتاج فيديو احترافي باستخدام برنامج Adobe Premiere لإنتاج محتوى عالي الجودة.',
  },
  {
    // photographie
    category: 'designMedia',
    icon: 'camera',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
    price: 800,
    durationMonths: 1,
    nameFr: 'Formation Photographie',
    nameAr: 'تكوين التصوير الفوتوغرافي',
    descFr: 'Fondamentaux de la photographie : cadrage, lumière, composition et retouche.',
    descAr: 'أساسيات التصوير الفوتوغرافي: التكوين، الإضاءة، الزاوية والمعالجة.',
  },
  {
    // montage-capcut
    category: 'designMedia',
    icon: 'clapperboard',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    price: 500,
    durationMonths: 1,
    nameFr: 'Montage Vidéo (CapCut)',
    nameAr: 'تكوين المونتاج (CapCut)',
    descFr: 'Montez facilement des vidéos pour les réseaux sociaux avec CapCut.',
    descAr: 'مونتاج سهل للفيديوهات على مواقع التواصل باستخدام CapCut.',
  },
  {
    // design
    category: 'designMedia',
    icon: 'palette',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
    price: 300,
    durationMonths: 3,
    nameFr: 'Formation Design',
    nameAr: 'تكوين الديزاين',
    descFr:
      'Le design graphique de A à Z : couleurs, typographie, logos et visuels professionnels.',
    descAr: 'التصميم الجرافيكي من الألف إلى الياء: الألوان، الخطوط، الشعارات والتصاميم.',
  },
  {
    // langues
    category: 'languages',
    icon: 'languages',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    price: 250,
    durationMonths: 3,
    nameFr: 'Formation Langues',
    nameAr: 'تكوين اللغات',
    descFr: 'Cours de langues (arabe, français, anglais) pour tous les niveaux.',
    descAr: 'دروس اللغات (العربية، الفرنسية، الإنجليزية) لجميع المستويات.',
  },
  {
    // studio-photo
    category: 'designMedia',
    icon: 'camera',
    image: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&w=800&q=80',
    price: 500,
    durationMonths: 1,
    nameFr: 'Création de Studio Photo Professionnel',
    nameAr: 'إنشاء ستوديو تصوير احترافي',
    descFr: 'Montez et équipez votre propre studio photo professionnel.',
    descAr: 'أنشئ وجهّز استوديو تصوير احترافي خاص بك.',
  },
  {
    // video-techniques
    category: 'designMedia',
    icon: 'video',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
    price: 500,
    durationMonths: 1,
    nameFr: 'Techniques de Tournage Vidéo Professionnel',
    nameAr: 'تقنيات تصوير الفيديو الاحترافي',
    descFr: 'Techniques de tournage vidéo professionnel (cadrage, mouvement, lumière).',
    descAr: 'تعلّم تقنيات تصوير الفيديو الاحترافي (التكوين، الحركة، الإضاءة).',
  },
  {
    // ecommerce
    category: 'digitalIT',
    icon: 'shoppingcart',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    price: 300,
    durationMonths: 6,
    nameFr: 'E-commerce',
    nameAr: 'التجارة الإلكترونية (E-commerce)',
    descFr: 'Créez et gérez une boutique en ligne : produits, paiements, livraison et marketing.',
    descAr: 'أنشئ وأدِر متجراً إلكترونياً: المنتجات، الدفع، التوصيل والتسويق.',
  },
  {
    // informatique
    category: 'digitalIT',
    icon: 'monitorcog',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    price: 300,
    durationMonths: 3,
    nameFr: 'Formation Informatique',
    nameAr: 'تكوين الإعلاميات',
    descFr: 'Maîtrisez l’informatique et les logiciels essentiels pour un usage professionnel.',
    descAr: 'أتقن الإعلاميات والبرمجيات الأساسية للاستخدام المهني.',
  },
  {
    // voice-over
    category: 'designMedia',
    icon: 'radio',
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
    price: 500,
    durationMonths: 1,
    nameFr: 'Formation Voice Over',
    nameAr: 'تكوين الفويس أوفر (Voice Over)',
    descFr: 'Développez votre voix pour le voice over, la publicité et le doublage.',
    descAr: 'طوّر صوتك للفويس أوفر والإعلانات والدبلجة.',
  },
]

const INSERT_SERVICE = `
  INSERT INTO services
    (name_fr, name_ar, description_fr, description_ar, category, icon, image, price, currency, is_active, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'MAD', 1, ?)
`

const INSERT_COURSE = `
  INSERT INTO courses
    (name_fr, name_ar, description_fr, description_ar, category, icon, image, price, duration_months, currency, is_active, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'MAD', 1, ?)
`

async function main() {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [[serviceCount]] = await connection.execute('SELECT COUNT(*) AS count FROM services')
    if (serviceCount.count > 0) {
      console.log(`services: already has ${serviceCount.count} row(s) — skipped.`)
    } else {
      for (const [index, service] of services.entries()) {
        await connection.execute(INSERT_SERVICE, [
          service.nameFr,
          service.nameAr,
          service.descFr,
          service.descAr,
          service.category,
          service.icon,
          service.image,
          service.price,
          index + 1,
        ])
      }
      console.log(`services: inserted ${services.length}.`)
    }

    const [[courseCount]] = await connection.execute('SELECT COUNT(*) AS count FROM courses')
    if (courseCount.count > 0) {
      console.log(`courses: already has ${courseCount.count} row(s) — skipped.`)
    } else {
      for (const [index, course] of courses.entries()) {
        await connection.execute(INSERT_COURSE, [
          course.nameFr,
          course.nameAr,
          course.descFr,
          course.descAr,
          course.category,
          course.icon,
          course.image,
          course.price,
          course.durationMonths,
          index + 1,
        ])
      }
      console.log(`courses: inserted ${courses.length}.`)
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Seed failed:', error.message)
  process.exitCode = 1
})
