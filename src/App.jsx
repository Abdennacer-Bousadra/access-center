import { Link, Route, Routes } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Header from './components/Header'
import Footer from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'
import Home from './pages/Home'
import Services from './pages/Services'
import Courses from './pages/Courses'
import OnlineCourses from './pages/OnlineCourses'
import OnlineCoursePreview from './pages/OnlineCoursePreview'
import OnlineCourseDetail from './pages/OnlineCourseDetail'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import UpdatePassword from './pages/UpdatePassword'
import About from './pages/About'
import Contact from './pages/Contact'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOverview from './pages/admin/AdminOverview'
import AdminUsers from './pages/admin/AdminUsers'
import AdminServices from './pages/admin/AdminServices'
import AdminCourses from './pages/admin/AdminCourses'
import AdminOnlineCourses from './pages/admin/AdminOnlineCourses'
import AdminCourseEditor from './pages/admin/AdminCourseEditor'
import { useLanguage } from './i18n/LanguageContext'

// Simple 404 fallback for unknown routes
function NotFound() {
  const { t } = useLanguage()
  return (
    <section className="bg-slate-50 py-24 md:py-32">
      <div className="container-x text-center">
        <p className="text-7xl font-black text-navy-900">404</p>
        <h1 className="mt-4 text-2xl font-bold text-navy-900">{t('notFound.title')}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{t('notFound.desc')}</p>
        <Link to="/" className="btn-primary mt-8">
          {t('notFound.back')}
        </Link>
      </div>
    </section>
  )
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/online-courses" element={<OnlineCourses />} />
          <Route path="/online-courses/:courseId/preview" element={<OnlineCoursePreview />} />
          <Route path="/online-courses/:courseId" element={<OnlineCourseDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="courses/:courseId" element={<AdminCourseEditor />} />
          <Route path="online-courses" element={<AdminOnlineCourses />} />
          <Route path="online-courses/:courseId" element={<AdminCourseEditor variant="online" />} />
        </Route>
        <Route path="*" element={<PublicLayout />} />
      </Routes>
    </>
  )
}
