import { apiRequest } from './api'

function queryString(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const adminApi = {
  overview: () => apiRequest('/admin/overview'),

  users: (params) => apiRequest(`/admin/users${queryString(params)}`),
  user: (userId) => apiRequest(`/admin/users/${userId}`),
  updateUser: (userId, values) =>
    apiRequest(`/admin/users/${userId}`, { method: 'PATCH', body: values }),
  setEnrollment: (userId, courseId, approved) =>
    apiRequest(`/admin/users/${userId}/enrollments/${courseId}`, {
      method: 'PUT',
      body: { approved },
    }),

  services: () => apiRequest('/admin/services'),
  createService: (values) =>
    apiRequest('/admin/services', { method: 'POST', body: values }),
  updateService: (serviceId, values) =>
    apiRequest(`/admin/services/${serviceId}`, { method: 'PUT', body: values }),
  deleteService: (serviceId) =>
    apiRequest(`/admin/services/${serviceId}`, { method: 'DELETE' }),

  courses: () => apiRequest('/admin/courses'),
  course: (courseId) => apiRequest(`/admin/courses/${courseId}`),
  createCourse: (values) =>
    apiRequest('/admin/courses', { method: 'POST', body: values }),
  updateCourse: (courseId, values) =>
    apiRequest(`/admin/courses/${courseId}`, { method: 'PUT', body: values }),
  setCourseStatus: (courseId, isActive) =>
    apiRequest(`/admin/courses/${courseId}/status`, {
      method: 'PATCH',
      body: { isActive },
    }),
  deleteCourse: (courseId) =>
    apiRequest(`/admin/courses/${courseId}`, { method: 'DELETE' }),

  onlineCourses: () => apiRequest('/admin/online-courses'),
  onlineCourseSubscribers: (courseId, params) =>
    apiRequest(`/admin/online-courses/${courseId}/subscribers${queryString(params)}`),
  setOnlineCourseSubscriber: (courseId, userId, values) =>
    apiRequest(`/admin/online-courses/${courseId}/subscribers/${userId}`, {
      method: 'PUT',
      body: values,
    }),
  bulkOnlineCourseSubscribers: (courseId, values) =>
    apiRequest(`/admin/online-courses/${courseId}/subscribers/bulk`, {
      method: 'POST',
      body: values,
    }),

  createAxis: (courseId, values) =>
    apiRequest(`/admin/courses/${courseId}/axes`, { method: 'POST', body: values }),
  updateAxis: (courseId, axisId, values) =>
    apiRequest(`/admin/courses/${courseId}/axes/${axisId}`, {
      method: 'PUT',
      body: values,
    }),
  deleteAxis: (courseId, axisId) =>
    apiRequest(`/admin/courses/${courseId}/axes/${axisId}`, { method: 'DELETE' }),
  reorderAxes: (courseId, ids) =>
    apiRequest(`/admin/courses/${courseId}/axes/reorder`, {
      method: 'POST',
      body: { ids },
    }),

  createLesson: (courseId, values) =>
    apiRequest(`/admin/courses/${courseId}/lessons`, { method: 'POST', body: values }),
  updateLesson: (courseId, lessonId, values) =>
    apiRequest(`/admin/courses/${courseId}/lessons/${lessonId}`, {
      method: 'PUT',
      body: values,
    }),
  deleteLesson: (courseId, lessonId) =>
    apiRequest(`/admin/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' }),
  setLessonStatus: (courseId, lessonId, isActive) =>
    apiRequest(`/admin/courses/${courseId}/lessons/${lessonId}/status`, {
      method: 'PATCH',
      body: { isActive },
    }),
  reorderLessons: (courseId, axisId, ids) =>
    apiRequest(`/admin/courses/${courseId}/lessons/reorder`, {
      method: 'POST',
      body: { axisId, ids },
    }),

  videos: () => apiRequest('/admin/videos'),
}
