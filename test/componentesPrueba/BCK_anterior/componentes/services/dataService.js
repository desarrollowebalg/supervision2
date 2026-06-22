/**
 * Clase base para servicios de datos
 */
export class DataService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Método genérico para hacer peticiones
   * @param {string} endpoint - Endpoint específico
   * @param {Object} params - Parámetros de la petición
   * @returns {Promise<any>}
   */
  async fetchData(endpoint, params = {}) {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'object') {
        urlParams.append(key, JSON.stringify(value));
      } else {
        urlParams.append(key, value);
      }
    });

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlParams.toString()
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.text();
      return data;
    } catch (error) {
      console.error('Error en fetchData:', error);
      throw error;
    }
  }
}

/**
 * Servicio específico para usuarios
 */
export class UsersService extends DataService {
  constructor() {
    super('modules/mComponentsUI/usersFilter');
  }

  /**
   * Obtiene la lista de usuarios filtrada y paginada
   * @param {number} idCliente - ID del cliente
   * @param {string} filtro - Filtro de búsqueda
   * @param {number} start - Inicio de la paginación
   * @param {number} regsxpag - Registros por página
   * @param {Object} props - Propiedades adicionales
   * @returns {Promise<Object>}
   */
  async getUsers(idCliente, filtro, start, regsxpag, props = {}) {
    return this.fetchData('usersFilter.php', {
      a: 'filter',
      c: idCliente,
      f: filtro,
      start,
      regs: regsxpag,
      props
    });
  }
}

/**
 * Factory para crear servicios
 */
export class ServiceFactory {
  static getService(type) {
    switch (type) {
      case 'users':
        return new UsersService();
      // Aquí podemos agregar más servicios según se necesiten
      default:
        throw new Error(`Servicio no soportado: ${type}`);
    }
  }
}

export default ServiceFactory;