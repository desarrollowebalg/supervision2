class StorageService{
  static instance = null;
  constructor() {
    if(StorageService.instance){
      return StorageService.instance;
    }
    this.storage = window.localStorage;
    this.sessionStorage = window.sessionStorage;
    StorageService.instance = this;
  }
  // Métodos para localStorage
  setItem(key, value) {
    this.storage.setItem(key, JSON.stringify(value));
  }

  getItem(key) {
    const item = this.storage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  removeItem(key) {
    this.storage.removeItem(key);
  }

  clear() {
    this.storage.clear();
  }
  // Métodos para sessionStorage
  setSessionItem(key, value) {
    this.sessionStorage.setItem(key, JSON.stringify(value));
  }

  getSessionItem(key) {
    const item = this.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  removeSessionItem(key) {
    this.sessionStorage.removeItem(key);
  }

  clearSession() {
    this.sessionStorage.clear();
  }
}

//export default new StorageService();
export const storageService = new StorageService();