const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const validatePhoneNumber = (phone) => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, message: 'Datas inválidas' };
  }
  
  if (start >= end) {
    return { valid: false, message: 'Data de início deve ser anterior à data de fim' };
  }
  
  if (start < new Date()) {
    return { valid: false, message: 'Data de início não pode ser no passado' };
  }
  
  return { valid: true };
};

const validateTimeSlot = (startTime, endTime, minDuration = 30, maxDuration = 480) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const durationMinutes = (end - start) / (1000 * 60);
  
  if (durationMinutes < minDuration) {
    return { 
      valid: false, 
      message: `Duração mínima é de ${minDuration} minutos` 
    };
  }
  
  if (durationMinutes > maxDuration) {
    return { 
      valid: false, 
      message: `Duração máxima é de ${maxDuration} minutos` 
    };
  }
  
  return { valid: true };
};

const validateBusinessHours = (startTime, endTime, businessHours) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  const dayConfig = businessHours[dayName];
  
  if (!dayConfig || !dayConfig.enabled) {
    return { 
      valid: false, 
      message: 'Reservas não são permitidas neste dia da semana' 
    };
  }
  
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  
  const businessStart = parseFloat(dayConfig.start.replace(':', '.'));
  const businessEnd = parseFloat(dayConfig.end.replace(':', '.'));
  
  if (startHour < businessStart || endHour > businessEnd) {
    return { 
      valid: false, 
      message: `Horário deve estar entre ${dayConfig.start} e ${dayConfig.end}` 
    };
  }
  
  return { valid: true };
};

const sanitizeString = (str, maxLength = 255) => {
  if (!str) return '';
  return str.toString().trim().substring(0, maxLength);
};

const validateFileType = (filename, allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf']) => {
  if (!filename) return false;
  
  const extension = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
};

const validateFileSize = (size, maxSize = 5 * 1024 * 1024) => { // 5MB default
  return size <= maxSize;
};

const validateCoordinates = (x, y, maxX = 1000, maxY = 1000) => {
  return (
    typeof x === 'number' && 
    typeof y === 'number' && 
    x >= 0 && 
    y >= 0 && 
    x <= maxX && 
    y <= maxY
  );
};

const validateCapacity = (capacity, minCapacity = 1, maxCapacity = 100) => {
  return (
    typeof capacity === 'number' && 
    capacity >= minCapacity && 
    capacity <= maxCapacity
  );
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUUID,
  validatePhoneNumber,
  validateDateRange,
  validateTimeSlot,
  validateBusinessHours,
  sanitizeString,
  validateFileType,
  validateFileSize,
  validateCoordinates,
  validateCapacity
};
