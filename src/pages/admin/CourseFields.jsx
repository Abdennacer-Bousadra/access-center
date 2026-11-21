import { useLanguage } from '../../i18n/LanguageContext'
import { Field, inputClass, textareaClass } from './adminUi'

export const EMPTY_COURSE_FORM = {
  nameFr: '',
  nameAr: '',
  descriptionFr: '',
  descriptionAr: '',
  category: '',
  icon: '',
  image: '',
  price: '',
  currency: 'MAD',
  durationMonths: '',
  sortOrder: '',
  isActive: true,
}

export function courseToForm(course) {
  return {
    nameFr: course.nameFr ?? '',
    nameAr: course.nameAr ?? '',
    descriptionFr: course.descriptionFr ?? '',
    descriptionAr: course.descriptionAr ?? '',
    category: course.category ?? '',
    icon: course.icon ?? '',
    image: course.image ?? '',
    price: course.price === null || course.price === undefined ? '' : String(course.price),
    currency: course.currency ?? 'MAD',
    durationMonths:
      course.durationMonths === null || course.durationMonths === undefined
        ? ''
        : String(course.durationMonths),
    sortOrder: course.sortOrder ?? 0,
    isActive: Boolean(course.isActive),
  }
}

/**
 * Shared course/formation fields used by the course editor and the
 * "Add formation" / "Add online course" modals, so fields and validation
 * stay identical. The course type (is_online) is chosen by the page that
 * creates the row and is never edited here.
 */
export function CourseFields({ form, onChange, idPrefix = 'course' }) {
  const { t } = useLanguage()
  const update = (name, value) => onChange(name, value)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('admin.editor.nameFr')} htmlFor={`${idPrefix}-name-fr`}>
          <input
            id={`${idPrefix}-name-fr`}
            required
            maxLength={150}
            value={form.nameFr}
            onChange={(event) => update('nameFr', event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('admin.editor.nameAr')} htmlFor={`${idPrefix}-name-ar`}>
          <input
            id={`${idPrefix}-name-ar`}
            required
            maxLength={150}
            dir="rtl"
            value={form.nameAr}
            onChange={(event) => update('nameAr', event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('admin.editor.descriptionFr')} htmlFor={`${idPrefix}-desc-fr`}>
          <textarea
            id={`${idPrefix}-desc-fr`}
            value={form.descriptionFr}
            onChange={(event) => update('descriptionFr', event.target.value)}
            className={textareaClass}
          />
        </Field>
        <Field label={t('admin.editor.descriptionAr')} htmlFor={`${idPrefix}-desc-ar`}>
          <textarea
            id={`${idPrefix}-desc-ar`}
            dir="rtl"
            value={form.descriptionAr}
            onChange={(event) => update('descriptionAr', event.target.value)}
            className={textareaClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label={t('admin.editor.price')}
          htmlFor={`${idPrefix}-price`}
          hint={t('admin.services.priceHint')}
        >
          <input
            id={`${idPrefix}-price`}
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => update('price', event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('admin.editor.currency')} htmlFor={`${idPrefix}-currency`}>
          <input
            id={`${idPrefix}-currency`}
            maxLength={3}
            value={form.currency}
            onChange={(event) => update('currency', event.target.value.toUpperCase())}
            className={inputClass}
          />
        </Field>
        <Field label={t('admin.editor.durationMonths')} htmlFor={`${idPrefix}-months`}>
          <input
            id={`${idPrefix}-months`}
            type="number"
            min="1"
            max="255"
            value={form.durationMonths}
            onChange={(event) => update('durationMonths', event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('admin.editor.sortOrder')} htmlFor={`${idPrefix}-sort`}>
          <input
            id={`${idPrefix}-sort`}
            type="number"
            value={form.sortOrder}
            onChange={(event) => update('sortOrder', event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t('admin.editor.image')} htmlFor={`${idPrefix}-image`}>
          <input
            id={`${idPrefix}-image`}
            maxLength={500}
            value={form.image}
            onChange={(event) => update('image', event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('admin.editor.category')} htmlFor={`${idPrefix}-category`}>
          <input
            id={`${idPrefix}-category`}
            maxLength={50}
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('admin.editor.icon')} htmlFor={`${idPrefix}-icon`}>
          <input
            id={`${idPrefix}-icon`}
            maxLength={50}
            value={form.icon}
            onChange={(event) => update('icon', event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => update('isActive', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500"
          />
          {t('admin.common.published')}
        </label>
      </div>
    </>
  )
}
