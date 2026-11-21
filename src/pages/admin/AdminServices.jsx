import { useEffect, useState } from 'react'
import { ConciergeBell, Pencil, Plus, Trash2 } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { adminApi } from '../../lib/adminApi'
import {
  Badge,
  EmptyBlock,
  Field,
  LoadingBlock,
  Modal,
  PageHeader,
  Panel,
  StatusBanner,
  Toggle,
  adminErrorText,
  inputClass,
  textareaClass,
} from './adminUi'

const EMPTY_FORM = {
  nameFr: '',
  nameAr: '',
  descriptionFr: '',
  descriptionAr: '',
  category: '',
  icon: '',
  image: '',
  price: '',
  currency: 'MAD',
  sortOrder: 0,
  isActive: true,
}

function toForm(service) {
  return {
    nameFr: service.nameFr ?? '',
    nameAr: service.nameAr ?? '',
    descriptionFr: service.descriptionFr ?? '',
    descriptionAr: service.descriptionAr ?? '',
    category: service.category ?? '',
    icon: service.icon ?? '',
    image: service.image ?? '',
    price: service.price === null || service.price === undefined ? '' : String(service.price),
    currency: service.currency ?? 'MAD',
    sortOrder: service.sortOrder ?? 0,
    isActive: Boolean(service.isActive),
  }
}

function toPayload(values) {
  return {
    ...values,
    price: values.price === '' ? null : Number(values.price),
    sortOrder: Number(values.sortOrder) || 0,
  }
}

export default function AdminServices() {
  const { t } = useLanguage()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageStatus, setPageStatus] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formStatus, setFormStatus] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    adminApi
      .services()
      .then((data) => {
        setServices(data?.services ?? [])
        setError(null)
      })
      .catch((requestError) => setError(requestError))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormStatus(null)
    setModalOpen(true)
  }

  const openEdit = (service) => {
    setEditing(service)
    setForm(toForm(service))
    setFormStatus(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditing(null)
    setFormStatus(null)
  }

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormStatus(null)
    try {
      if (editing) {
        await adminApi.updateService(editing.id, toPayload(form))
      } else {
        await adminApi.createService(toPayload(form))
      }
      setModalOpen(false)
      setPageStatus({ type: 'success', message: t('admin.common.saved') })
      load()
    } catch (requestError) {
      setFormStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (service) => {
    setBusyId(service.id)
    setPageStatus(null)
    try {
      const data = await adminApi.updateService(service.id, {
        ...toPayload(toForm(service)),
        isActive: !service.isActive,
      })
      setServices((current) =>
        current.map((row) => (row.id === service.id ? data.service : row))
      )
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (service) => {
    if (!window.confirm(t('admin.services.deleteConfirm', { name: service.nameFr }))) return
    setBusyId(service.id)
    setPageStatus(null)
    try {
      await adminApi.deleteService(service.id)
      setServices((current) => current.filter((row) => row.id !== service.id))
      setPageStatus({ type: 'success', message: t('admin.common.deleted') })
    } catch (requestError) {
      setPageStatus({ type: 'error', message: adminErrorText(requestError, t) })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('admin.services.title')}
        description={t('admin.services.description')}
        actions={
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus size={17} />
            {t('admin.services.add')}
          </button>
        }
      />

      {pageStatus && (
        <StatusBanner status={pageStatus} onClose={() => setPageStatus(null)} />
      )}
      {error && <StatusBanner status={{ type: 'error', message: adminErrorText(error, t) }} />}

      {loading ? (
        <LoadingBlock label={t('admin.common.loading')} />
      ) : services.length === 0 ? (
        <EmptyBlock
          icon={ConciergeBell}
          title={t('admin.services.empty')}
          description={t('admin.services.emptyHint')}
        />
      ) : (
        <Panel padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">{t('admin.services.name')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.services.price')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.services.category')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.services.sortOrder')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.common.published')}</th>
                  <th className="px-4 py-3 text-end">{t('admin.common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-bold text-navy-900">{service.nameFr}</p>
                      <p className="text-xs text-slate-500">{service.nameAr}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {service.price === null
                        ? t('admin.common.priceOnRequest')
                        : `${service.price} ${service.currency}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {service.category || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                      {service.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={service.isActive}
                          disabled={busyId === service.id}
                          onChange={() => toggleActive(service)}
                          label={t('admin.services.toggleActive')}
                        />
                        <Badge tone={service.isActive ? 'green' : 'slate'}>
                          {service.isActive
                            ? t('admin.common.published')
                            : t('admin.common.hidden')}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(service)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-accent-400 hover:text-accent-600"
                          aria-label={t('admin.common.edit')}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === service.id}
                          onClick={() => handleDelete(service)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                          aria-label={t('admin.common.delete')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? t('admin.services.editTitle') : t('admin.services.newTitle')}
        wide
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn-outline" disabled={saving}>
              {t('admin.common.cancel')}
            </button>
            <button
              type="submit"
              form="service-form"
              className="btn-primary disabled:cursor-wait disabled:opacity-60"
              disabled={saving}
            >
              {saving ? t('admin.common.saving') : t('admin.common.save')}
            </button>
          </>
        }
      >
        <form id="service-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('admin.services.nameFr')} htmlFor="service-name-fr">
              <input
                id="service-name-fr"
                required
                maxLength={150}
                value={form.nameFr}
                onChange={(event) => updateField('nameFr', event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t('admin.services.nameAr')} htmlFor="service-name-ar">
              <input
                id="service-name-ar"
                required
                maxLength={150}
                dir="rtl"
                value={form.nameAr}
                onChange={(event) => updateField('nameAr', event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('admin.services.descriptionFr')} htmlFor="service-desc-fr">
              <textarea
                id="service-desc-fr"
                value={form.descriptionFr}
                onChange={(event) => updateField('descriptionFr', event.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field label={t('admin.services.descriptionAr')} htmlFor="service-desc-ar">
              <textarea
                id="service-desc-ar"
                dir="rtl"
                value={form.descriptionAr}
                onChange={(event) => updateField('descriptionAr', event.target.value)}
                className={textareaClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('admin.services.price')} htmlFor="service-price" hint={t('admin.services.priceHint')}>
              <input
                id="service-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateField('price', event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t('admin.services.currency')} htmlFor="service-currency">
              <input
                id="service-currency"
                maxLength={3}
                value={form.currency}
                onChange={(event) => updateField('currency', event.target.value.toUpperCase())}
                className={inputClass}
              />
            </Field>
            <Field label={t('admin.services.sortOrder')} htmlFor="service-sort">
              <input
                id="service-sort"
                type="number"
                value={form.sortOrder}
                onChange={(event) => updateField('sortOrder', event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('admin.services.category')} htmlFor="service-category">
              <input
                id="service-category"
                maxLength={50}
                value={form.category}
                onChange={(event) => updateField('category', event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t('admin.services.icon')} htmlFor="service-icon">
              <input
                id="service-icon"
                maxLength={50}
                value={form.icon}
                onChange={(event) => updateField('icon', event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t('admin.services.image')} htmlFor="service-image">
              <input
                id="service-image"
                maxLength={500}
                value={form.image}
                onChange={(event) => updateField('image', event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Toggle
              checked={form.isActive}
              onChange={(value) => updateField('isActive', value)}
              label={t('admin.common.published')}
            />
            <span className="text-sm font-semibold text-navy-900">
              {t('admin.services.toggleActive')}
            </span>
          </div>

          {formStatus && <StatusBanner status={formStatus} />}
        </form>
      </Modal>
    </div>
  )
}
