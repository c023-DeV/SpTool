
//gate-processor.js
class GateProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'threshold', defaultValue: -50, minValue: -100, maxValue: 0 }];
    
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const threshold = parameters.threshold[0]; // dB

    const linearThresh = Math.pow(10, threshold / 20); // convert dB → linear

    for (let channel = 0; channel < input.length; ++channel) {
      const inChan = input[channel];
      const outChan = output[channel];
      for (let i = 0; i < inChan.length; ++i) {
        const sample = inChan[i];
        outChan[i] = Math.abs(sample) < linearThresh ? 0 : sample;
      }
    }
    return true;
  }
}

registerProcessor('gate-processor', GateProcessor);