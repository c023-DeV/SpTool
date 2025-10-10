// signal-metrics-processor.js
// ------------------------------------------------------------
// AudioWorkletProcessor that can output any combination of
//   • peak  – max |sample|
//   • rms   – root‑mean‑square of the whole block
//   • lfu   – low‑frequency energy (average power of the first N samples)
// The set of metrics is chosen in the constructor via the
// `processorOptions.metrics` array, e.g. ['peak','rms'].
// This avoids unnecessary calculations when a metric is not needed.
// ------------------------------------------------------------

class SignalMetricsProcessor extends AudioWorkletProcessor {
  /**
   * processorOptions:
   *   {
   *     metrics:        Array<string>  // e.g. ['peak','rms','lfu']
   *     lowFreqSamples: number = 32   // used only if 'lfu' is requested
   *     smoothing:      number = 0.9   // exponential smoothing factor
   *   }
   */
  constructor(options) {
    super();

    const opts = options.processorOptions || {};

    // ----- metric selection -------------------------------------------------
    const all = ['peak', 'rms', 'lfu'];
    this._metrics = (Array.isArray(opts.metrics) ? opts.metrics : all)
      .filter(m => all.includes(m));

    // ----- optional parameters -----------------------------------------------
    this._lowFreqSamples = Math.max(1, Math.min(opts.lowFreqSamples || 32, 256));
    this._smoothing      = typeof opts.smoothing === 'number' ? opts.smoothing : 0.9;

    // ----- internal state (smoothed values) ----------------------------------
    this._state = {
      peak: 0,
      rms : 0,
      lfu : 0
    };
  }

  // ------------------------------------------------------------
  // Compute only the requested metrics for a Float32Array block
  // ------------------------------------------------------------
  _calcRequested(buffer) {
    const needPeak = this._metrics.includes('peak');
    const needRms  = this._metrics.includes('rms');
    const needLfu  = this._metrics.includes('lfu');

    let peak = 0, sumSq = 0, lowSum = 0;
    const len = buffer.length;
    const lowN = needLfu ? this._lowFreqSamples : 0;

    for (let i = 0; i < len; i++) {
      const v = buffer[i];
      const abs = Math.abs(v);

      if (needPeak && abs > peak) peak = abs;
      if (needRms) sumSq += v * v;
      if (needLfu && i < lowN) lowSum += v * v;
    }

    const result = {};
    if (needPeak) result.peak = peak;
    if (needRms)  result.rms  = Math.sqrt(sumSq / len);
    if (needLfu)  result.lfu  = Math.sqrt(lowSum / lowN);
    return result;
  }

  // ------------------------------------------------------------
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true; // no audio

    const channel = input[0]; // first channel (mono)

    // Compute only the metrics the user asked for
    const raw = this._calcRequested(channel);

    // Apply exponential smoothing to each metric that exists
    const α = this._smoothing;
    for (const key of Object.keys(raw)) {
      this._state[key] = α * this._state[key] + (1 - α) * raw[key];
    }

    // Send back only the metrics that were requested
    const out = {};
    for (const key of this._metrics) out[key] = this._state[key];
    this.port.postMessage(out);

    return true;
  }
}

registerProcessor('signal-metrics-processor', SignalMetricsProcessor);