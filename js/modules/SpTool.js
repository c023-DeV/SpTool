import { MidiIO } from './MidiIO.js';
import { sysNote } from './sysNote.js';
import { BUS_FX_12, BUS_FX_34, BUS_FX_DEF_12, BUS_FX_DEF_34, BUS_FX_IN, BUS_FX_DEF_IN }  from './midiConfig.js';

const TOOL_VERSION = "0.0.02";
const SETTINGS_KEY = "spSettings";

const TARGET_RE = /\bSP[- _]?404(?:MK{0,2}|MKII|MK2)\b/i;

export class SpTool {
    static async create(opt) {
    const tool = new SpTool(opt);
    await tool.setupMidiIO();
    return tool;

    }

    // =======================
    // CONSTRUCTOR
    // =======================
    constructor(opt) {
        
        this.settings  = this.loadSettings();

        this.el = {
            busCtrlNode: [],
            busCtrlLabelNode: [],
        }; //To store UI root nodes

        this._fxCtrlToggleHandler   = this._fxCtrlToggleHandler.bind(this);
        this._fxCtrlSliderChange    = this._fxCtrlSliderChange.bind(this);
        this._fxCtrlSliderInput     = this._fxCtrlSliderInput.bind(this);


        //View Handeling
        this.setupViewNav();
        this.showView(this.settings.activeView);
        this.setupUI();




    }   
    
//#region UI SETUP

    setupViewNav(){
        // --- View Navigation ---
        const navButtons = document.querySelectorAll('header nav button');
        navButtons.forEach(button => {
            if (button.hasAttribute("data-view")){
                button.addEventListener('click', () => {
                    const target = button.dataset.view;
                    if (target) {
                        this.settings.activeView = target;
                        this.saveSettings(this.settings);
                        this.showView(this.settings.activeView)
                    };
                });
            } else if (button.id === "syncfx"){
                button.addEventListener('click', async () => {
                    await this._syncAll();
                });
            }
        
        });
    }

    showView(viewId) {
        document.querySelectorAll('.view').forEach(v => {
        v.style.display = v.id === viewId ? 'block' : 'none';
        });
        this.currentView = viewId;
    }

    getUIElements(root) {
        return {
            fxBusCtrl: root.querySelector('#fxBusCtrl'),
        };
    }

    setupUI() {
        this.setupFXUI();
    }

    setupFXUI() {
        const rFx = document.querySelector('#fxBusCtrl');
        const rInFx = document.querySelector('#infxBusCtrl');

        rFx.innerHTML = '';
        rInFx.innerHTML = '';

        let rE = rFx;

        for (let i = 0; i < 5; i++) {
            const busState = this.settings.bus[i];
            let fxArr = (i < 2) ? BUS_FX_12 : BUS_FX_34;

            let busLabel = `FX Bus ${i + 1}`;
            if (i === 4){
                fxArr = BUS_FX_IN;
                busLabel = `Input FX`;
                rE = rInFx;
            }

            // ----- wrapper -----
            const wrap = document.createElement('div');
            wrap.id = `fxBus${i}`;
            wrap.className = 'fx-bus-wrap';
            rE.appendChild(wrap);

            // ----- name -----
            const name = document.createElement('span');
            name.textContent = busLabel;
            name.className = 'fx-bus-name';
            wrap.appendChild(name);

            // ----- toggle button -----
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = `fxToggleBus${i}`;
            btn.className = 'btn-fx-toggle';
            btn.dataset.bus = i;                     // zero‑based index
            btn.dataset.state = false;               // on/off
            btn.textContent = 'OFF'; //Default = off or busState.on ? 'ON' : 'OFF'
            wrap.appendChild(btn);

            // ----- FX selector -----
            const label = document.createElement('label');
            label.htmlFor = `fxSelBus${i}`;
            wrap.appendChild(label);

            const sel = document.createElement('select');
            sel.id = `fxSelBus${i}`;
            sel.dataset.bus = i;
            sel.className = 'btn-fx-select';
            label.appendChild(sel);

            //Add FX to selectors
            fxArr.forEach((fxName, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = fxName;
                sel.appendChild(opt);
            });
            sel.value = busState.fx;                // restore saved FX

            // ----- FX CONTROL WRAP -----
            const busCtrlWrap = document.createElement('div');
            busCtrlWrap.id = `fxCtrlBus${i}`;
            busCtrlWrap.className = 'fx-busctrl-wrap';
            wrap.appendChild(busCtrlWrap);

            this.el.busCtrlNode[i] = busCtrlWrap;

            this.setupFxCtrl(i, busState.fx, busCtrlWrap);

            // ----- Control Label -----
            const cLabel = document.createElement('span');
            cLabel.textContent = `-CTRL-`;
            cLabel.className = 'fx-bus-ctrl-label';
            wrap.appendChild(cLabel);
            this.el.busCtrlLabelNode[i] = cLabel;
        }


        // toggle buttons
        rE.addEventListener('pointerdown', e => {
            const btn = e.target.closest('button.btn-fx-toggle');
            if (!btn) return;

            const state = btn.dataset.state === 'true';
            const newState = !state;
            btn.dataset.state = newState;
            btn.textContent = newState ? 'ON' : 'OFF';
            this.toggleFx(btn.dataset.bus, newState);

            //Don't want to save the state of the bus toggle
            // this.saveSettings(this.settings); 

        });

        // FX SELECTORS
        rE.addEventListener('change', e => {
            const sel = e.target.closest('select.btn-fx-select');
            if (sel) {
                const bus = sel.dataset.bus;
                this.settings.bus[bus].fx = Number(sel.value);
                this.selectFx(bus, sel.value); 
                this.toggleFx(bus, false); //Turn it off on selecting
                this.setupFxCtrl(bus, Number(sel.value), this.el.busCtrlNode[bus]);
                this.saveSettings(this.settings);
                return;
            }

            // const slider = e.target.closest('input.btn-fx-par-slider');
            // if (!slider) return;
            // const [, bus, param] = slider.id.match(/fx-slider-b(\d+)-(\d+)/);
            // const key = `bus${bus}`;
            // this.settings[key].sliders[param] = Number(slider.value);
            // this.saveSettings(this.settings);

        });


        // toggle buttons
        rFx.addEventListener('pointerdown', e => {
            const btn = e.target.closest('button.btn-fx-toggle');
            if (!btn) return;

            const state = btn.dataset.state === 'true';
            const newState = !state;
            btn.dataset.state = newState;
            btn.textContent = newState ? 'ON' : 'OFF';

            this.selectFx(btn.dataset.bus, this.settings.bus[btn.dataset.bus].fx); //make sure we have the right FX
            this.toggleFx(btn.dataset.bus, newState);

            //Don't want to save the state of the bus toggle
            // this.saveSettings(this.settings); 

        });

        // FX SELECTORS
        rFx.addEventListener('change', e => {
            const sel = e.target.closest('select.btn-fx-select');
            if (sel) {
                const bus = sel.dataset.bus;
                this.settings.bus[bus].fx = Number(sel.value);
                this.selectFx(bus, sel.value); 
                this.toggleFx(bus, false); //Turn it off on selecting
                this.setupFxCtrl(bus, Number(sel.value), this.el.busCtrlNode[bus]);
                this.saveSettings(this.settings);
                return;
            }

            // const slider = e.target.closest('input.btn-fx-par-slider');
            // if (!slider) return;
            // const [, bus, param] = slider.id.match(/fx-slider-b(\d+)-(\d+)/);
            // const key = `bus${bus}`;
            // this.settings[key].sliders[param] = Number(slider.value);
            // this.saveSettings(this.settings);

        });


        
    }

//#endregion




//#region MIDI SETUP
    async setupMidiIO(){

    console.log('MIDI Setup...');
    this.midiIO = new MidiIO();
    this.sp404OutId = null;
    
    // Global listeners
    this.midiIO.on('ready',               () => console.log('MIDI ready'));
    this.midiIO.on('noteon',              e => console.log('Note ON', e));
    this.midiIO.on('noteoff',             e => console.log('Note OFF', e));
    this.midiIO.on('controlchange',       e => console.log('CC', e));

    // CONNECT TO SP404MKII
    this.midiIO.on('outputConnected', info => {
    console.log('Output Connected:', info.name, info.manufacturer, info.id);

    // test both name and manufacturer
    const matches = TARGET_RE.test(info.name || '') || TARGET_RE.test(info.manufacturer || '');
    if (!matches) return;
    // if already set and same id, ignore; otherwise set and notify
    if (this.sp404OutId === info.id) return;
    this.sp404OutId = info.id;
    console.log('✅ SP-404 ready');
    sysNote('✅ SP-404 ready', 'good');
    });

    // handle disconnects
    this.midiIO.on('outputDisconnected', info => {
    console.log('Output Disconnected:', info.name, info.manufacturer, info.id);
    if (info.id !== this.sp404OutId) return;
    console.log('⚠️ SP-404 lost');
    sysNote('⚠️ SP-404 lost', 'alert');
    this.sp404OutId = null;
    });

    await this.midiIO.init();

    }

//#endregion




//#region Save Load

    loadSettings() {
        const savedVersion = localStorage.getItem('toolVersion');
        if (savedVersion === TOOL_VERSION) {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) {
                try { return JSON.parse(raw); } catch (_) {}
            }
        }
        //If no data is saved setup new save data
        const defaults = this.setupSaveDefault();

        this.saveSettings(defaults);
        return defaults;
    }

    setupSaveDefault(){

        let bus12Def = [];
        BUS_FX_DEF_12.forEach((element, index) => {
                bus12Def[index] = [];
                for (let ix = 0; ix < 6; ix++) {
                    const key = `ctrl${ix+1}`;
                    if(element[key]){
                        bus12Def[index].push(element[key].input.defVal);
                        // console.log(`added defValue: ${element[key].input.defVal} to FX: ${element.name}`);
                    }
                }
            });

        let bus34Def = [];
        BUS_FX_DEF_34.forEach((element, index) => {
                bus34Def[index] = [];
                for (let ix = 0; ix < 6; ix++) {
                    const key = `ctrl${ix+1}`;
                    if(element[key]){
                        bus34Def[index].push(element[key].input.defVal);
                        // console.log(`added defValue: ${element[key].input.defVal} to FX: ${element.name}`);
                    }
                }
            });

        let busINDef = [];
        BUS_FX_DEF_IN.forEach((element, index) => {
                busINDef[index] = [];
                for (let ix = 0; ix < 6; ix++) {
                    const key = `ctrl${ix+1}`;
                    if(element[key]){
                        busINDef[index].push(element[key].input.defVal);
                        // console.log(`added defValue: ${element[key].input.defVal} to FX: ${element.name}`);
                    }
                }
            });


        return {
            activeView: "fx-view",

            busFX_def_12: bus12Def,
            busFX_def_34: bus34Def,
            busFX_def_IN: busINDef,

            bus : 
            [
                { on: false, fx: 0, ctrl: bus12Def },
                { on: false, fx: 0, ctrl: bus12Def },
                { on: false, fx: 0, ctrl: bus34Def },
                { on: false, fx: 0, ctrl: bus34Def },
                { on: false, fx: 0, ctrl: busINDef },
            ],
        
        };
    }

    saveSettings(settings) {
        localStorage.setItem('toolVersion', TOOL_VERSION);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

//#endregion





//#region CONTROL SETUP

    setupFxCtrl(bus, fxNumber, node) {

        //CLEAN UP OLD NODES AND LISTENERS HERE

        if (!node) {
                console.error('setupFxCtrl called with null node');
                return;
            }

        node.removeEventListener('click',   this._fxCtrlToggleHandler);
        node.removeEventListener('change',  this._fxCtrlSliderChange);
        node.removeEventListener('input',   this._fxCtrlSliderInput);
        node.innerHTML = '';

        
        //SETUP NEW CONTROLS
        let fxArrCtrl = (bus < 2) ? BUS_FX_DEF_12 : BUS_FX_DEF_34;
        if (Number(bus) === 4){ fxArrCtrl = BUS_FX_DEF_IN;}

        // console.log(bus, fxArrCtrl);

        for (let si = 0; si < 6; si++) {
            const fxCtrlObj = fxArrCtrl[fxNumber];
            const key = `ctrl${si+1}`;

            //Check if there is a control
            if (!fxCtrlObj[key]) { continue;}

            const o = fxCtrlObj[key];

            switch (o.input.type) {
                case "slider":
                case "list":
                    const sLabel = document.createElement('label');
                    sLabel.htmlFor = `fx-slider-b${bus}-${si}`;
                    node.appendChild(sLabel);

                    const slider = document.createElement('input');
                    slider.type = 'range';
                    slider.min = '0';
                    slider.max = '127';
                    slider.step = '1';
                    slider.id = `fx-slider-b${bus}-${si}`;
                    slider.className = 'btn-fx-par-slider';
                    slider.dataset.bus = bus; // zero‑based index
                    slider.dataset.fxn = fxNumber;
                    slider.dataset.ctrl = si;
                    slider.dataset.label = o.name;
                    slider.value = this.settings.bus[bus].ctrl[fxNumber][si]; //o.input.defVal; // restore saved value
                    // console.log(`Bus Num: ${bus}`, `CTRL: ${si}`, `CTRL Val: ${this.settings.bus[bus].ctrl[fxNumber][si]}`);
                    sLabel.appendChild(slider);

                    break;

                case "toggle":
                    const tLabel = document.createElement('label');
                    tLabel.htmlFor = `fx-toggle-b${bus}-${si}`;
                    node.appendChild(tLabel);

                    const tog = document.createElement('button');
                    tog.type = 'button';
                    tog.id = `fx-toggle-b${bus}-${si}`;
                    tog.className = 'btn-fx-par-toggle';
                    tog.dataset.bus = bus; // zero‑based index
                    tog.dataset.fxn = fxNumber;
                    tog.dataset.ctrl = si; // zero‑based index
                    tog.dataset.label = o.name;
                    tog.dataset.state = false; // on/off // always default toggles to off
                    tog.textContent = 'OFF';
                    tLabel.appendChild(tog);

                    break;
            
                default:
                    break;
            }

        }

        //Setup Event Listeners
        node.addEventListener('click',   this._fxCtrlToggleHandler);
        node.addEventListener('change',  this._fxCtrlSliderChange);
        node.addEventListener('input',   this._fxCtrlSliderInput);
        
    }

//#endregion




//#region SP-404 MIDI Helper functions

    async _sendRaw(status, data1, data2) {
        if (!this.sp404OutId) {
            console.warn('SP-404 not connected');
            return;
        }
        // `sendMessage` is synchronous, but we wrap it in a Promise for a uniform API
        return new Promise(resolve => {
            this.midiIO.sendMessage(this.sp404OutId, [status & 0xFF, data1 & 0x7F, data2 & 0x7F]);
            resolve();
        });
    }

    _cc(channel, ccNumber, value) {
    const status = 0xB0 | (channel & 0x0F);
    return this._sendRaw(status, ccNumber, value);
    }

    _pc(channel, program) {
    const status = 0xC0 | (channel & 0x0F);
    // Program‑Change messages have only one data byte; the second is ignored
    return this._sendRaw(status, program, 0);
    }

    async toggleFx(bus, on = true) {
        
        // // Bus → MIDI channel mapping (see chart)
        // const channelMap = { 1: 0, 2: 1, 3: 2, 4: 3 };
        // const channel = channelMap[bus];
        // if (channel === undefined) throw new Error(`Invalid bus ${bus}`);
        //Keep it zero based!
        const value = on ? 0x7F : 0x00;          // 0‑63 = off, 64‑127 = on
        await this._cc(bus, 0x13, value);   // CC#19 = 0x13
    }

    async setFxParam(bus, paramIndex, value) {
        // const channelMap = { 1: 0, 2: 1, 3: 2, 4: 3 };
        // const channel = channelMap[bus];
        // if (channel === undefined) throw new Error(`Invalid bus ${bus}`);

        // Param index → CC number (see chart)
        const ccTable = {
            0: 0x10, // Ctrl 1  (CC#16)
            1: 0x11, // Ctrl 2  (CC#17)
            2: 0x12, // Ctrl 3  (CC#18)
            3: 0x50, // Ctrl 4  (CC#80)
            4: 0x51, // Ctrl 5  (CC#81)
            5: 0x52  // Ctrl 6  (CC#82)
        };
        const cc = ccTable[paramIndex];
        if (!cc) throw new Error(`Invalid FX param ${paramIndex}`);

        await this._cc(bus, cc, value);
    }

    async toggleFxParam(bus, paramIndex, on = true) {
        
        // Param index → CC number (see chart)
        const ccTable = {
            0: 0x10, // Ctrl 1  (CC#16)
            1: 0x11, // Ctrl 2  (CC#17)
            2: 0x12, // Ctrl 3  (CC#18)
            3: 0x50, // Ctrl 4  (CC#80)
            4: 0x51, // Ctrl 5  (CC#81)
            5: 0x52  // Ctrl 6  (CC#82)
        };
        const cc = ccTable[paramIndex];
        if (!cc) throw new Error(`Invalid FX param ${paramIndex}`);

        const value = on ? 0x7F : 0x00;          // 0‑63 = off, 64‑127 = on
        await this._cc(bus, cc, value);   // CC#19 = 0x13
    }


    async selectFx(bus, fxNumber) {
        // const channelMap = { 1: 0, 2: 1, 3: 2, 4: 3 };
        // const channel = channelMap[bus];
        // if (channel === undefined) throw new Error(`Invalid bus ${bus}`);
        await this._cc(bus, 0x53, fxNumber); // CC#83 = 0x53

    }

    async setPlayState(bus, playing = true) {
        const channelMap = { 1: 0, 2: 1, 3: 2, 4: 3 };
        const channel = channelMap[bus];
        if (channel === undefined) throw new Error(`Invalid bus ${bus}`);

        const value = playing ? 0x7F : 0x00;
        await this._cc(channel, 0x14, value); // CC#20 = 0x14
    }

    async pressButton(buttonId, value = 0x7F) {
        // Button IDs are the CC numbers listed in the chart (20‑27)
        // They are all on channel 2 (BUS 3) according to the spec
        const channel = 2; // BUS 3 → MIDI channel 2
        await this._cc(channel, buttonId, value);
    }

    async setXFade(value) {
        // X‑FADE is a single CC on BUS 1 (channel 0) – CC#8 = 0x08
        const channel = 0;
        await this._cc(channel, 0x08, value);
    }

    async loadPattern(patternIndex) {
    if (patternIndex < 0 || patternIndex > 15) {
        throw new Error('Pattern index must be 0-15');
    }
    // Pattern bank is on BUS 4 (channel 3)
    const channel = 3;
    await this._pc(channel, patternIndex);
    }

    async toggleBUS(bus) {
    const channelMap = { 1: 0, 2: 1, 3: 2, 4: 3 };
    const channel = channelMap[bus];
    if (channel === undefined) throw new Error(`Invalid bus ${bus}`);

    // CC#120 = All Sound Off (standard MIDI)
    await this._cc(channel, 0x78, 0);
    }

    logOutputId() {
    console.log('Current SP-404 output ID:', this.sp404OutId);
    }

//#endregion


//#region HELPERS

async _syncAll(){
    console.log("sending sync data...");

    const busArr = this.settings.bus;
    busArr.forEach((bus, index) => {
                
                for (let ix = 0; ix < 6; ix++) {
                    const key = `ctrl${ix+1}`;
                    if(bus[key]){
                       
                    }
                }
            });

    sysNote("💨SYNC SENT", "good");
}


_fxCtrlToggleHandler(e) {
    // console.log("Toggle");
    const toggle = e.target.closest('button.btn-fx-par-toggle');
    if (!toggle) return;

    const newState = toggle.dataset.state !== 'true';
    toggle.dataset.state = newState;
    toggle.textContent = newState ? 'ON' : 'OFF';
    this.el.busCtrlLabelNode[toggle.dataset.bus].textContent = toggle.dataset.label;
    this.toggleFxParam(toggle.dataset.bus, toggle.dataset.ctrl, newState);
}

_fxCtrlSliderChange(e) {
    // console.log("SliderChange");
    const slider = e.target.closest('input.btn-fx-par-slider');
    if (!slider) return;

    const { bus, fxn, ctrl } = slider.dataset;
    this.settings.bus[bus].ctrl[fxn][ctrl] = Number(slider.value);
    this.el.busCtrlLabelNode[slider.dataset.bus].textContent = slider.dataset.label;
    this.saveSettings(this.settings);
}

_fxCtrlSliderInput(e) {
    // console.log("SliderInput");
    const slider = e.target.closest('input.btn-fx-par-slider');
    if (!slider) return;

    this.setFxParam(
        slider.dataset.bus,
        slider.dataset.ctrl,
        Number(slider.value)
    );
}


_onSettingChange(key, value) {
    console.log(`Setting Change: ${key} →`, value);
    switch (key) {
        case 'timeSel':
         break;
        case 'volSel': 
         break;
        
        case 'soundSel':
         break;
        
         case 'bpmSel':  
         break;
    }
    this.saveSettings(this.settings);
}

//#endregion

}
