// EventEmitter.js  (no external dependencies)

export class EventEmitter {
  constructor() {
    this._events = Object.create(null);
  }

  on(event, listener) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(listener);
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      listener.apply(this, args);
    };
    return this.on(event, wrapper);
  }

  off(event, listener) {
    const listeners = this._events[event];
    if (!listeners) return this;
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
    if (listeners.length === 0) delete this._events[event];
    return this;
  }

  emit(event, ...args) {
    const listeners = this._events[event];
    if (!listeners) return false;
    // copy to allow mutation during emit
    for (const fn of listeners.slice()) fn.apply(this, args);
    return true;
  }
  
}
