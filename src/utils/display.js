export function displayText(value, fallback = '') {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const values = value
      .map((item) => displayText(item))
      .filter(Boolean);
    return values.length ? values.join(' · ') : fallback;
  }
  return fallback;
}

export function normalizeCourse(rawCourse, index = 0) {
  const course = rawCourse && typeof rawCourse === 'object' && !Array.isArray(rawCourse)
    ? rawCourse
    : {};

  return {
    id: displayText(course.id, `course-${index + 1}`),
    name: displayText(course.name),
    price: displayText(course.price),
    duration: displayText(course.duration),
    features: displayText(course.features),
    description: displayText(course.description),
  };
}

export function normalizeAdmin(rawAdmin, index = 0) {
  const admin = rawAdmin && typeof rawAdmin === 'object' && !Array.isArray(rawAdmin)
    ? rawAdmin
    : {};
  return {
    username: displayText(admin.username, `Admin ${index + 1}`),
    role: displayText(admin.role, 'ADMIN'),
  };
}
