const AUTH = {
  ADMIN_PIN_KEY: 'aitips_admin_pin',
  SESSION_KEY: 'aitips_role',

  getPin() {
    return localStorage.getItem(this.ADMIN_PIN_KEY) || '1234';
  },

  setPin(newPin) {
    localStorage.setItem(this.ADMIN_PIN_KEY, newPin);
  },

  getRole() {
    return sessionStorage.getItem(this.SESSION_KEY);
  },

  loginStudent() {
    sessionStorage.setItem(this.SESSION_KEY, 'student');
  },

  loginAdmin(pin) {
    if (pin === this.getPin()) {
      sessionStorage.setItem(this.SESSION_KEY, 'admin');
      return true;
    }
    return false;
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  isAdmin() {
    return this.getRole() === 'admin';
  },

  isLoggedIn() {
    return !!this.getRole();
  }
};
