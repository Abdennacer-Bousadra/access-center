/**
 * One-time Phase 7b-3 data fix.
 *
 * 1. Course 13 "Formation Informatique" is the Informatique online course:
 *    set is_online = 1 and keep its axes, lessons and enrollment row.
 * 2. Delete only enrollment #4 ("Formation Voice Over" test data).
 *
 * Nothing else is modified. Safe to re-run:
 * - the course update is idempotent;
 * - the enrollment delete reports 0 rows once it is gone.
 *
 * Usage: node server/db/fix-separation.js
 */

import '../config.js'
import { pool } from '../db.js'

const INFORMATIQUE_COURSE_ID = 13
const INFORMATIQUE_NAME_FR = 'Formation Informatique'
const TEST_ENROLLMENT_ID = 4
const TEST_ENROLLMENT_COURSE_ID = 14

async function main() {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [courses] = await connection.execute(
      'SELECT id, name_fr, is_online FROM courses WHERE id = ? LIMIT 1 FOR UPDATE',
      [INFORMATIQUE_COURSE_ID]
    )
    if (courses.length === 0 || courses[0].name_fr !== INFORMATIQUE_NAME_FR) {
      throw new Error(
        `Course ${INFORMATIQUE_COURSE_ID} is not "${INFORMATIQUE_NAME_FR}" — aborting.`
      )
    }

    const wasOnline = Boolean(courses[0].is_online)
    await connection.execute('UPDATE courses SET is_online = 1 WHERE id = ?', [
      INFORMATIQUE_COURSE_ID,
    ])
    console.log(
      `Course ${INFORMATIQUE_COURSE_ID} (${INFORMATIQUE_NAME_FR}): is_online ${wasOnline ? 'already 1' : '0 -> 1'}.`
    )

    const [enrollments] = await connection.execute(
      'SELECT id, course_id, user_id FROM enrollments WHERE id = ? AND course_id = ? LIMIT 1 FOR UPDATE',
      [TEST_ENROLLMENT_ID, TEST_ENROLLMENT_COURSE_ID]
    )
    if (enrollments.length === 0) {
      console.log(`Enrollment #${TEST_ENROLLMENT_ID} is already absent — nothing to delete.`)
    } else {
      await connection.execute(
        'DELETE FROM enrollments WHERE id = ? AND course_id = ?',
        [TEST_ENROLLMENT_ID, TEST_ENROLLMENT_COURSE_ID]
      )
      console.log(
        `Enrollment #${TEST_ENROLLMENT_ID} (course ${TEST_ENROLLMENT_COURSE_ID}, user ${enrollments[0].user_id}) deleted.`
      )
    }

    await connection.commit()
  } catch (error) {
    await connection.rollback().catch(() => {})
    throw error
  } finally {
    connection.release()
  }

  const [[counts]] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM courses WHERE is_online = 0) AS formations,
       (SELECT COUNT(*) FROM courses WHERE is_online = 1) AS online_courses,
       (SELECT COUNT(*) FROM course_axes WHERE course_id = ?) AS informatique_axes,
       (SELECT COUNT(*) FROM lessons WHERE course_id = ?) AS informatique_lessons,
       (SELECT COUNT(*) FROM enrollments WHERE course_id = ?) AS informatique_enrollments,
       (SELECT COUNT(*) FROM enrollments WHERE id = ?) AS test_enrollment`,
    [INFORMATIQUE_COURSE_ID, INFORMATIQUE_COURSE_ID, INFORMATIQUE_COURSE_ID, TEST_ENROLLMENT_ID]
  )

  console.log('\nResulting state:')
  console.log(counts)

  const [rows] = await pool.execute(
    `SELECT id, name_fr, is_online, is_active, sort_order
       FROM courses
      ORDER BY is_online DESC, sort_order ASC, id ASC`
  )
  console.table(rows)
}

main()
  .catch((error) => {
    console.error('Fix failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
