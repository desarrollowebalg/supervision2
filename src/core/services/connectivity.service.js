class ConnectivityService {
  static instancia = null;

  constructor() {
    if (ConnectivityService.instancia) {
      return ConnectivityService.instancia;
    }

    this.subscribers = new Set();
    this._boundEmit = this._emitState.bind(this);

    window.addEventListener('online', this._boundEmit);
    window.addEventListener('offline', this._boundEmit);

    ConnectivityService.instancia = this;
  }

  getIsOnline() {
    return window.navigator.onLine;
  }

  getIsOffline() {
    return !this.getIsOnline();
  }

  subscribe(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }

    this.subscribers.add(callback);
    callback(this.getIsOnline());

    return () => {
      this.subscribers.delete(callback);
    };
  }

  _emitState() {
    const isOnline = this.getIsOnline();
    this.subscribers.forEach((callback) => {
      callback(isOnline);
    });
  }
}

export const connectivityService = new ConnectivityService();
