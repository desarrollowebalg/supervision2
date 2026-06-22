class GeolocationService {
  static instancia = null;

  constructor() {
    if (GeolocationService.instancia) {
      return GeolocationService.instancia;
    }

    this.lastSnapshot = null;
    GeolocationService.instancia = this;
  }

  isSupported() {
    return typeof window !== 'undefined' && 'geolocation' in window.navigator;
  }

  async getPermissionState() {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    if (!window.navigator.permissions?.query) {
      return 'prompt';
    }

    try {
      const permission = await window.navigator.permissions.query({ name: 'geolocation' });
      return permission?.state || 'prompt';
    } catch (error) {
      console.warn('No fue posible consultar permisos de geolocalizacion', error);
      return 'prompt';
    }
  }

  async ensurePermissionAndCapture() {
    const state = await this.getPermissionState();
    if (state === 'denied' || state === 'unsupported') {
      return {
        ok: false,
        state,
        error: state === 'unsupported'
          ? 'La geolocalizacion no esta disponible en este dispositivo.'
          : 'El permiso de geolocalizacion esta denegado.'
      };
    }

    try {
      const snapshot = await this.captureCurrentPositionWithRetry();
      return { ok: true, state: 'granted', snapshot };
    } catch (error) {
      const denied = error?.code === 1;
      const unavailable = error?.code === 2;
      return {
        ok: false,
        state: denied ? 'denied' : state,
        error: denied
          ? 'El permiso de geolocalizacion fue denegado.'
          : unavailable
            ? 'No fue posible obtener GPS en este momento. Verifica que la ubicacion del sistema este activa y vuelve a intentar.'
            : 'No fue posible obtener la ubicacion actual.'
      };
    }
  }

  async captureCurrentPositionWithRetry() {
    const attempts = [
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 15000 },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
    ];

    let lastError = null;

    for (let index = 0; index < attempts.length; index += 1) {
      try {
        return await this.captureCurrentPosition(attempts[index]);
      } catch (error) {
        lastError = error;

        if (error?.code === 1) {
          throw error;
        }

        if (index < attempts.length - 1) {
          await this.wait(900);
        }
      }
    }

    throw lastError || new Error('No fue posible capturar ubicacion.');
  }

  captureCurrentPosition(options = {}) {
    if (!this.isSupported()) {
      return Promise.reject(new Error('Geolocation API no soportada'));
    }

    const geolocationOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      ...options
    };

    return new Promise((resolve, reject) => {
      window.navigator.geolocation.getCurrentPosition(
        (position) => {
          const snapshot = {
            latitude: Number(position?.coords?.latitude || 0),
            longitude: Number(position?.coords?.longitude || 0),
            accuracy: Number(position?.coords?.accuracy || 0),
            capturedAt: new Date().toISOString()
          };
          this.lastSnapshot = snapshot;
          resolve(snapshot);
        },
        (error) => reject(error),
        geolocationOptions
      );
    });
  }

  wait(ms = 500) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  getLastSnapshot() {
    return this.lastSnapshot;
  }
}

export const geolocationService = new GeolocationService();
