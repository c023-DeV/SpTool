// MidiIO.js
import { EventEmitter } from './EventEmitter.js';
import { sysNote } from './sysNote.js';

export class MidiIO extends EventEmitter {
  constructor() {
    super();
    this.inputs = new Map();   // id → MIDIInput
    this.outputs = new Map();  // id → MIDIOutput
  }

  /** Initialise the Web MIDI API */
  async init() {
    if (!navigator.requestMIDIAccess) {
      sysNote("💔BROWSER NO MIDI API","alert");
      throw new Error('Web MIDI API not supported.');
    }
    const access = await navigator.requestMIDIAccess({ sysex: false });
    this._setupAccess(access);
    this.emit('ready');
  }

  /** Private: bind to MIDIAccess and ports */
  _setupAccess(access) {
    // Populate current ports
    access.inputs.forEach(i => this._addInput(i));
    access.outputs.forEach(o => this._addOutput(o));

    // React to hot‑plug events
    access.onstatechange = e => {
      const p = e.port;
      if (p.type === 'input') {
        p.state === 'connected' ? this._addInput(p) : this._removeInput(p);
      } else {
        p.state === 'connected' ? this._addOutput(p) : this._removeOutput(p);
      }
    };
  }

  /** Private: attach listeners to a new input */
  _addInput(input) {
    this.inputs.set(input.id, input);
    input.onmidimessage = e => this._handleMessage(e, input);
    this.emit('inputConnected', this._portInfo(input));
  }

  _removeInput(input) {
    this.inputs.delete(input.id);
    this.emit('inputDisconnected', this._portInfo(input));
  }

  _addOutput(output) {
    this.outputs.set(output.id, output);
    this.emit('outputConnected', this._portInfo(output));
  }

  _removeOutput(output) {
    this.outputs.delete(output.id);
    this.emit('outputDisconnected', this._portInfo(output));
  }

  /** Convert a port to a plain object for listeners */
  _portInfo(port) {
    return { id: port.id, name: port.name, manufacturer: port.manufacturer };
  }

  /** Private: decode raw MIDI and emit high‑level events */
  _handleMessage(event, input) {
    const [status, data1, data2] = event.data;
    const type = status & 0xf0;
    const channel = status & 0x0f;
    

    // Emit raw data first (useful for debugging)
    this.emit('raw', { data: event.data, timestamp: event.timeStamp, input: this._portInfo(input) });

    switch (type) {
      case 0x90: // note on (velocity 0 = note off per spec)
        if (data2 === 0) {
          this.emit('noteoff', { channel, note: data1, velocity: data2, input: this._portInfo(input) });
        } else {
          this.emit('noteon', { channel, note: data1, velocity: data2, input: this._portInfo(input) });
        }
        break;
      case 0x80:
        this.emit('noteoff', { channel, note: data1, velocity: data2, input: this._portInfo(input) });
        break;
      case 0xb0:
        this.emit('controlchange', { channel, controller: data1, value: data2, input: this._portInfo(input) });
        break;
      case 0xF0: // SysEx (status byte is 0xF0, no channel)
        this.emit('sysex', { data: Array.from(event.data), raw: event.data, timestamp: event.timeStamp, input: this._portInfo(input) });
        break;
      // Add more cases as needed (programchange, pitchbend, etc.)
      default:
        this.emit('unknown', { status, data1, data2, input: this._portInfo(input) });
    }
  }

  /** Send a raw MIDI message */
  sendMessage(outputId, data, timestamp = 0) {
    const out = this.outputs.get(outputId);
    if (!out) throw new Error(`Output ${outputId} not found`);
    out.send(data, timestamp);
    this.emit('sent', { outputId, data, timestamp });
  }

  /** Send a SysEx message (raw Uint8Array or plain number array) */
  sendSysex(outputId, payload, timestamp = 0) {
    const out = this.outputs.get(outputId);
    if (!out) throw new Error(`Output ${outputId} not found`);

    // Normalise to Uint8Array
    const data = payload instanceof Uint8Array ? payload : new Uint8Array(payload);

    // Basic validation – helps catch programming errors early
    if (data[0] !== 0xF0 || data[data.length - 1] !== 0xF7) {
      throw new Error('Invalid SysEx message: must start with 0xF0 and end with 0xF7');
    }

    out.send(data, timestamp);
    this.emit('sentSysex', { outputId, data: Array.from(data), timestamp });
  }

  /** Build and send a SysEx packet */
  sendSysexMessage(outputId, manufacturerId, ...bytes) {
    // manufacturerId can be 1‑byte (e.g. 0x7D) or 3‑byte array for extended IDs
    const idArray = Array.isArray(manufacturerId) ? manufacturerId : [manufacturerId];
    const payload = [0xF0, ...idArray, ...bytes, 0xF7];
    this.sendSysex(outputId, payload);
  }


  /** Convenience helpers */
  noteOn(outputId, channel, note, velocity = 0x7f) {
    const status = 0x90 | (channel & 0x0f);
    this.sendMessage(outputId, [status, note & 0x7f, velocity & 0x7f]);
  }

  noteOff(outputId, channel, note, velocity = 0x40) {
    const status = 0x80 | (channel & 0x0f);
    this.sendMessage(outputId, [status, note & 0x7f, velocity & 0x7f]);
  }

  /** List ports (plain objects) */
  listInputs()  { return Array.from(this.inputs.values()).map(i => this._portInfo(i)); }
  listOutputs() { return Array.from(this.outputs.values()).map(o => this._portInfo(o)); }
}