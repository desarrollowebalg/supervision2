import { storageService } from './storage.service.js';

const SESSION_KEYS = {
  currentDate: 'fechaActualSupervision',
  startDate: 'fechaInicio',
  endDate: 'fechaFin'
};

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function formatDateAsIso(date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join('-');
}

function createDateFromIso(isoDate) {
  const safeValue = String(isoDate || '').trim();
  const match = safeValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
}

class SupervisionDateRangeService {
  static instancia = null;

  constructor() {
    if (SupervisionDateRangeService.instancia) {
      return SupervisionDateRangeService.instancia;
    }

    SupervisionDateRangeService.instancia = this;
  }

  calculateWeekRange(selectedDate) {
    const baseDate = createDateFromIso(selectedDate);
    if (!baseDate) {
      return null;
    }

    const dayOfWeek = baseDate.getDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() - daysSinceMonday);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return {
      fechaActualSupervision: formatDateAsIso(baseDate),
      fechaInicio: formatDateAsIso(startDate),
      fechaFin: formatDateAsIso(endDate)
    };
  }

  updateSessionRange(selectedDate) {
    const range = this.calculateWeekRange(selectedDate);
    if (!range) {
      return null;
    }

    storageService.setSessionItem(SESSION_KEYS.currentDate, range.fechaActualSupervision);
    storageService.setSessionItem(SESSION_KEYS.startDate, range.fechaInicio);
    storageService.setSessionItem(SESSION_KEYS.endDate, range.fechaFin);

    return range;
  }
}

const supervisionDateRangeService = new SupervisionDateRangeService();

export default supervisionDateRangeService;
