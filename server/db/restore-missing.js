/**
 * Restores formation(s) that are present in the original site data
 * (src/data/content.js + src/i18n/translations.js) but missing from the
 * `courses` table (is_online = 0).
 *
 * Idempotent: existing rows are only read, never updated or deleted.
 * Re-running the script after a successful restore inserts nothing.
 *
 * Usage: node server/db/restore-missing.js
 */

import '../config.js'
import { pool } from '../db.js'
import { courses } from '../../src/data/content.js'
import { translations } from '../../src/i18n/translations.js'

const CURRENCY = 'MAD'

function resolveCourseCopy(locale, key) {
  return key.split('.').reduce((node, part) => node?.[part], translations[locale])
}

function buildOriginalFormations() {
  return courses.map((course, index) => {
    const fr = resolveCourseCopy('fr', course.i18nKey)
    const ar = resolveCourseCopy('ar', course.i18nKey)

    if (!fr?.title || !ar?.title) {
      throw new Error(`Missing FR/AR copy for course "${course.id}".`)
    }

    return {
      nameFr: fr.title,
      nameAr: ar.title,
      descriptionFr: fr.description ?? '',
      descriptionAr: ar.description ?? '',
      category: course.category,
      icon: course.icon,
      image: course.image,
      price: course.fee,
      durationMonths: course.durationMonths,
      currency: CURRENCY,
      isOnline: 0,
      isActive: 1,
      sortOrder: index + 1,
    }
  })
}

async function main() {
  const originals = buildOriginalFormations()

  const [existingRows] = await pool.execute(
    `SELECT id, name_fr, sort_order
       FROM courses
      WHERE is_online = 0`
  )
  const existingNames = new Set(existingRows.map((row) => row.name_fr))
  const missing = originals.filter((formation) => !existingNames.has(formation.nameFr))

  if (missing.length === 0) {
    console.log(`All ${originals.length} formations are present — nothing to restore.`)
  } else {
    console.log(`Missing formation(s): ${missing.length}`)
    for (const formation of missing) {
      console.log(
        JSON.stringify(
          {
            nameFr: formation.nameFr,
            nameAr: formation.nameAr,
            descriptionFr: formation.descriptionFr,
            descriptionAr: formation.descriptionAr,
            price: formation.price,
            currency: formation.currency,
            durationMonths: formation.durationMonths,
            category: formation.category,
            icon: formation.icon,
            image: formation.image,
            sortOrder: formation.sortOrder,
          },
          null,
          2
        )
      )
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      for (const formation of missing) {
        await connection.execute(
          `INSERT INTO courses
             (name_fr, name_ar, description_fr, description_ar, category, icon, image,
              price, duration_months, currency, is_online, is_active, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            formation.nameFr,
            formation.nameAr,
            formation.descriptionFr,
            formation.descriptionAr,
            formation.category,
            formation.icon,
            formation.image,
            formation.price,
            formation.durationMonths,
            formation.currency,
            formation.isOnline,
            formation.isActive,
            formation.sortOrder,
          ]
        )
      }
      await connection.commit()
      console.log(`Inserted ${missing.length} formation(s).`)
    } catch (error) {
      await connection.rollback().catch(() => {})
      throw error
    } finally {
      connection.release()
    }
  }

  const [rows] = await pool.execute(
    `SELECT id, name_fr, is_online, sort_order
       FROM courses
      WHERE is_online = 0
      ORDER BY sort_order ASC, id ASC`
  )
  console.log(`Formations now in the database: ${rows.length}`)
  console.table(rows)
}

main()
  .catch((error) => {
    console.error('Restore failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
