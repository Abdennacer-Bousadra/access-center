import '../config.js'
import { pool } from '../db.js'

/**
 * PLACEHOLDER content for the "Informatique" online course (FR + AR).
 *
 * - Idempotent: safe to run repeatedly; it only inserts missing axes/lessons.
 * - Lessons are created with `video_ref = NULL` on purpose (no fake videos).
 * - The Informatique course itself already comes from `seed.js`.
 * - Nothing here promises certificates, durations or prices.
 *
 * To remove this placeholder content later:
 *   DELETE l FROM lessons l
 *     JOIN courses c ON c.id = l.course_id
 *    WHERE c.name_fr = 'Formation Informatique';
 *   DELETE a FROM course_axes a
 *     JOIN courses c ON c.id = a.course_id
 *    WHERE c.name_fr = 'Formation Informatique';
 *   UPDATE courses SET is_online = 0 WHERE name_fr = 'Formation Informatique';
 */

const COURSE_NAME_FR = 'Formation Informatique'
const COURSE_NAME_AR = 'تكوين الإعلاميات'

const axes = [
  {
    titleFr: "Initiation à l'ordinateur",
    titleAr: 'مقدمة في الحاسوب',
    lessons: [
      {
        titleFr: 'Découvrir le matériel et les périphériques',
        titleAr: 'التعرف على العتاد والملحقات',
      },
      {
        titleFr: 'Utiliser le clavier et la souris',
        titleAr: 'استخدام لوحة المفاتيح والفأرة',
      },
      {
        titleFr: 'Gérer les fichiers et les dossiers',
        titleAr: 'إدارة الملفات والمجلدات',
      },
    ],
  },
  {
    titleFr: "Système d'exploitation Windows",
    titleAr: 'نظام التشغيل Windows',
    lessons: [
      {
        titleFr: 'Le bureau et les fenêtres',
        titleAr: 'سطح المكتب والنوافذ',
      },
      {
        titleFr: 'Paramètres et personnalisation',
        titleAr: 'الإعدادات والتخصيص',
      },
      {
        titleFr: 'Installation et désinstallation de logiciels',
        titleAr: 'تثبيت البرامج وإزالتها',
      },
    ],
  },
  {
    titleFr: 'Traitement de texte (Word)',
    titleAr: 'معالجة النصوص (Word)',
    lessons: [
      {
        titleFr: 'Créer et mettre en forme un document',
        titleAr: 'إنشاء مستند وتنسيقه',
      },
      {
        titleFr: 'Tableaux, images et mise en page',
        titleAr: 'الجداول والصور وتنسيق الصفحة',
      },
      {
        titleFr: 'Préparer et imprimer un document',
        titleAr: 'تحضير مستند وطباعته',
      },
    ],
  },
  {
    titleFr: 'Tableur (Excel)',
    titleAr: 'الجداول الإلكترونية (Excel)',
    lessons: [
      {
        titleFr: 'Saisir et organiser des données',
        titleAr: 'إدخال البيانات وتنظيمها',
      },
      {
        titleFr: 'Formules et fonctions de base',
        titleAr: 'الصيغ والدوال الأساسية',
      },
      {
        titleFr: 'Créer des tableaux et des graphiques',
        titleAr: 'إنشاء الجداول والرسوم البيانية',
      },
    ],
  },
  {
    titleFr: 'Internet, email et sécurité',
    titleAr: 'الإنترنت والبريد الإلكتروني والأمان',
    lessons: [
      {
        titleFr: 'Naviguer sur le Web et rechercher',
        titleAr: 'التنقل في الويب والبحث',
      },
      {
        titleFr: 'Créer et gérer une boîte email',
        titleAr: 'إنشاء بريد إلكتروني وإدارته',
      },
      {
        titleFr: 'Bonnes pratiques de sécurité en ligne',
        titleAr: 'ممارسات الأمان الجيدة على الإنترنت',
      },
    ],
  },
]

async function main() {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [courseRows] = await connection.execute(
      'SELECT id FROM courses WHERE name_fr = ? AND name_ar = ? LIMIT 1',
      [COURSE_NAME_FR, COURSE_NAME_AR]
    )

    if (courseRows.length === 0) {
      throw new Error('Informatique course not found. Run "npm run db:seed" first.')
    }

    const courseId = courseRows[0].id
    await connection.execute('UPDATE courses SET is_online = 1 WHERE id = ?', [courseId])

    let insertedAxes = 0
    let insertedLessons = 0

    for (const [axisIndex, axis] of axes.entries()) {
      const [existingAxes] = await connection.execute(
        'SELECT id FROM course_axes WHERE course_id = ? AND title_fr = ? LIMIT 1',
        [courseId, axis.titleFr]
      )

      let axisId
      if (existingAxes.length > 0) {
        axisId = existingAxes[0].id
        await connection.execute(
          'UPDATE course_axes SET title_ar = ?, position = ? WHERE id = ?',
          [axis.titleAr, axisIndex + 1, axisId]
        )
      } else {
        const [result] = await connection.execute(
          `INSERT INTO course_axes (course_id, title_fr, title_ar, position)
           VALUES (?, ?, ?, ?)`,
          [courseId, axis.titleFr, axis.titleAr, axisIndex + 1]
        )
        axisId = result.insertId
        insertedAxes += 1
      }

      for (const [lessonIndex, lesson] of axis.lessons.entries()) {
        const [existingLessons] = await connection.execute(
          'SELECT id FROM lessons WHERE course_id = ? AND axis_id = ? AND title_fr = ? LIMIT 1',
          [courseId, axisId, lesson.titleFr]
        )

        if (existingLessons.length > 0) {
          await connection.execute(
            'UPDATE lessons SET title_ar = ?, position = ? WHERE id = ?',
            [lesson.titleAr, lessonIndex + 1, existingLessons[0].id]
          )
        } else {
          await connection.execute(
            `INSERT INTO lessons
               (course_id, axis_id, title_fr, title_ar, video_ref, position)
             VALUES (?, ?, ?, ?, NULL, ?)`,
            [courseId, axisId, lesson.titleFr, lesson.titleAr, lessonIndex + 1]
          )
          insertedLessons += 1
        }
      }
    }

    await connection.commit()
    console.log(
      `Informatique online: course ${courseId}, ${axes.length} axes, ` +
        `${insertedAxes} axes inserted, ${insertedLessons} lessons inserted.`
    )
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Informatique seed failed:', error.message)
  process.exitCode = 1
})
