import { MidiIO } from './MidiIO.js';
import { sysNote } from './sysNote.js';
import { BUS_FX_12, BUS_FX_34, BUS_FX_DEF_12, BUS_FX_DEF_34, BUS_FX_IN }  from './midiConfig.js';


const TOOL_VERSION = "0.0.01";
const SETTINGS_KEY = "spSettings";

const TARGET_NAME_SP404MKII = 'SP-404MKII-G';


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
            busCtrlNode: []

        }; //To store UI root nodes

        //View Handeling
        this.setupViewNav();
        this.showView(this.settings.activeView);
        this.setupUI();
    }   
    
//#region Functions



//#endregion

    setupViewNav(){
        // --- View Navigation ---
        const navButtons = document.querySelectorAll('header nav button');
        navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.dataset.view;
            if (target) {
                this.settings.activeView = target;
                this.saveSettings(this.settings);
                this.showView(this.settings.activeView)
            };
        });
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
        const root = document.querySelector('#fxBusCtrl');
        root.innerHTML = '';

        for (let i = 0; i < 4; i++) {
            const busId = `bus${i + 1}`;
            const busState = this.settings[busId];

            // ----- wrapper -----
            const wrap = document.createElement('div');
            wrap.id = `fxBus${i + 1}`;
            wrap.className = 'fx-bus-wrap';
            root.appendChild(wrap);

            // ----- name -----
            const name = document.createElement('span');
            name.textContent = `FX Bus ${i + 1}`;
            name.className = 'fx-bus-name';
            wrap.appendChild(name);

            // ----- toggle button -----
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = `fxToggleBus${i + 1}`;
            btn.className = 'btn-fx-toggle';
            btn.dataset.bus = i;                     // zero‑based index
            btn.dataset.state = false;               // on/off
            btn.textContent = 'OFF'; //Default = off or busState.on ? 'ON' : 'OFF'
            wrap.appendChild(btn);

            // ----- FX selector -----
            const label = document.createElement('label');
            label.htmlFor = `fxSelBus${i + 1}`;
            wrap.appendChild(label);

            const sel = document.createElement('select');
            sel.id = `fxSelBus${i + 1}`;
            sel.dataset.bus = i;                     // zero‑based index
            sel.className = 'btn-fx-select';
            label.appendChild(sel);

            const fxArr = (i < 2) ? BUS_FX_12 : BUS_FX_34;
            fxArr.forEach((fxName, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = fxName;
                sel.appendChild(opt);
            });
            sel.value = busState.fx;                // restore saved FX

            // ----- sliders -----
            const slidersWrap = document.createElement('div');
            slidersWrap.id = `fxCtrlBus${i + 1}`;
            slidersWrap.className = 'fx-sliders-wrap';
            wrap.appendChild(slidersWrap);

            this.el.busCtrlNode[i] = slidersWrap;

            this.setupFxCtrl(i, busState.fx, slidersWrap);

        }


        // toggle buttons
        root.addEventListener('pointerdown', e => {
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
        root.addEventListener('change', e => {
            const sel = e.target.closest('select.btn-fx-select');
            if (sel) {
                const bus = sel.dataset.bus;
                // const key = `bus${bus+1}`;
                // this.settings[key].fx = Number(sel.value);
                // this.saveSettings(this.settings);
                this.selectFx(bus, sel.value); 
                this.toggleFx(bus, false);
                this.setupFxCtrl(bus, Number(sel.value), this.el.busCtrlNode[bus]);
                return;
            }

            const slider = e.target.closest('input.btn-fx-par-slider');
            if (!slider) return;
            const [, bus, param] = slider.id.match(/fx-slider-b(\d+)-(\d+)/);
            const key = `bus${bus}`;
            this.settings[key].sliders[param] = Number(slider.value);
            this.saveSettings(this.settings);

        });

        //  sliders - live updates
        root.addEventListener('input', e => {
            const slider = e.target.closest('input.btn-fx-par-slider');
            if (!slider) return;
            const [, bus, param] = slider.id.match(/fx-slider-b(\d+)-(\d+)/);
            this.setFxParam(bus, param, Number(slider.value)); // your handler
        });
    }


    // setupFXUI() {
    //     const root = document.querySelector('#fxBusCtrl');
    //     root.innerHTML = '';

    //     for (let i = 0; i < 4; i++) {
    //         const busId = `bus${i + 1}`;
    //         const busState = this.settings[busId];

    //         // ----- wrapper -----
    //         const wrap = document.createElement('div');
    //         wrap.id = `fxBus${i + 1}`;
    //         wrap.className = 'fx-bus-wrap';
    //         root.appendChild(wrap);

    //         // ----- name -----
    //         const name = document.createElement('span');
    //         name.textContent = `FX Bus ${i + 1}`;
    //         name.className = 'fx-bus-name';
    //         wrap.appendChild(name);

    //         // ----- toggle button -----
    //         const btn = document.createElement('button');
    //         btn.type = 'button';
    //         btn.id = `fxToggleBus${i + 1}`;
    //         btn.className = 'btn-fx-toggle';
    //         btn.dataset.bus = i;                     // zero‑based index
    //         btn.textContent = busState.on ? 'ON' : 'OFF';
    //         wrap.appendChild(btn);

    //         // ----- FX selector -----
    //         const label = document.createElement('label');
    //         label.htmlFor = `fxSelBus${i + 1}`;
    //         wrap.appendChild(label);

    //         const sel = document.createElement('select');
    //         sel.id = `fxSelBus${i + 1}`;
    //         sel.className = 'btn-fx-select';
    //         label.appendChild(sel);

    //         const fxArr = (i < 2) ? BUS_FX_12 : BUS_FX_34;
    //         fxArr.forEach((fxName, idx) => {
    //             const opt = document.createElement('option');
    //             opt.value = idx;
    //             opt.textContent = fxName;
    //             sel.appendChild(opt);
    //         });
    //         sel.value = busState.fx;                // restore saved FX

    //         // ----- sliders -----
    //         const fxArrCtrl = (i < 2) ? BUS_FX_DEF_12 : BUS_FX_DEF_34;
    //         const slidersWrap = document.createElement('div');
    //         slidersWrap.className = 'fx-sliders-wrap';
    //         wrap.appendChild(slidersWrap);

    //         for (let si = 0; si < 6; si++) {

    //             const fxCtrlObj = fxArrCtrl[busState.fx];
    //             const key = `ctrl${si}`;
    //             if (fxCtrlObj.key){

    //             }


    //             const sLabel = document.createElement('label');
    //             sLabel.htmlFor = `fx-slider-b${i + 1}-${si}`;
    //             slidersWrap.appendChild(sLabel);

    //             const slider = document.createElement('input');
    //             slider.type = 'range';
    //             slider.min = '0';
    //             slider.max = '127';
    //             slider.step = '1';
    //             slider.id = `fx-slider-b${i + 1}-${si}`;
    //             slider.className = 'btn-fx-par-slider';
    //             slider.value = busState.sliders[si]; // restore saved value
    //             sLabel.appendChild(slider);
    //         }
    //     }


    //     // toggle buttons
    //     root.addEventListener('click', e => {
    //         const btn = e.target.closest('button.btn-fx-toggle');
    //         if (!btn) return;

    //         const busIdx = Number(btn.dataset.bus) + 1; // 1‑based
    //         const key = `bus${busIdx}`;
    //         const bus = this.settings[key];

    //         bus.on = !bus.on;
    //         btn.textContent = bus.on ? 'ON' : 'OFF';

    //         this.toggleFx(busIdx, bus.on);

    //         this.saveSettings(this.settings);
    //     });

    //     // selects (FX choice)
    //     root.addEventListener('change', e => {
    //         const sel = e.target.closest('select.btn-fx-select');
    //         if (sel) {
    //             const bus = sel.id.match(/fxSelBus(\d+)/)[1];
    //             const key = `bus${bus}`;
    //             this.settings[key].fx = Number(sel.value);
    //             this.saveSettings(this.settings);
    //             this.selectFx(bus, sel.value); 
    //             this.toggleFx(bus, false);
    //             return;
    //         }

    //         const slider = e.target.closest('input.btn-fx-par-slider');
    //         if (!slider) return;
    //         const [, bus, param] = slider.id.match(/fx-slider-b(\d+)-(\d+)/);
    //         const key = `bus${bus}`;
    //         this.settings[key].sliders[param] = Number(slider.value);
    //         this.saveSettings(this.settings);

    //     });

    //     //  sliders - live updates
    //     root.addEventListener('input', e => {
    //         const slider = e.target.closest('input.btn-fx-par-slider');
    //         if (!slider) return;
    //         const [, bus, param] = slider.id.match(/fx-slider-b(\d+)-(\d+)/);
    //         this.setFxParam(bus, param, Number(slider.value)); // your handler
    //     });
    // }

    async setupMidiIO(){

    console.log('MIDI Setup...');
    this.midiIO = new MidiIO();
    this.sp404OutId = null;
    
    // Global listeners
    this.midiIO.on('ready',               () => console.log('MIDI ready'));
    this.midiIO.on('noteon',              e => console.log('Note ON', e));
    this.midiIO.on('noteoff',             e => console.log('Note OFF', e));
    this.midiIO.on('controlchange',       e => console.log('CC', e));

    //CONNECT TO SP404MKII
    this.midiIO.on('outputConnected', info => {
        // if (this.sp404OutId === info.id) return;
        console.log('Output Connected:', info.name)
            if (info.name.includes(TARGET_NAME_SP404MKII)) {
                this.sp404OutId = info.id;
                console.log('✅ SP-404 ready');
                sysNote('✅ SP-404 ready', 'good');
            }
        });

    this.midiIO.on('outputDisconnected', info => {
        console.log('Output Disconnected:', info.name)
            if (info.id === this.sp404OutId) {
                console.log('⚠️ SP-404 lost');
                sysNote('⚠️ SP-404 lost', 'alert');
                this.sp404OutId = null;
            }
        });

    await this.midiIO.init();

    }

    //Save Load
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

    saveSettings(settings) {
        localStorage.setItem('toolVersion', TOOL_VERSION);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    //Settings Switch
    onSettingChange(key, value) {
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
        const channelMap = { 1: 0, 2: 1, 3: 2, 4: 3 };
        const channel = channelMap[bus];
        if (channel === undefined) throw new Error(`Invalid bus ${bus}`);

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

        await this._cc(channel, cc, value);
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

    setupSaveDefault(){
        return {
            activeView: "fx-view",

            busFX_12: BUS_FX_DEF_12,
            busFX_34: BUS_FX_DEF_34,



            bus1: { on: false, fx: 0, sliders: Array(6).fill(63) },

            bus2: { on: false, fx: 0, sliders: Array(6).fill(63) },

            bus3: { on: false, fx: 1, sliders: Array(6).fill(63) },

            bus4: { on: false, fx: 0, sliders: Array(6).fill(63) },
        
        };
    }

    setupFxCtrl(bus, fxNumber, node) {

        //CLEAN UP OLD NODES AND LISTENERS HERE
        node.innerHTML = '';
        

        //SETUP NEW CONTROLS
        const fxArrCtrl = (bus < 2) ? BUS_FX_DEF_12 : BUS_FX_DEF_34;
        for (let si = 0; si < 6; si++) {
            const fxCtrlObj = fxArrCtrl[fxNumber];
            const key = `ctrl${si+1}`;

            //Check if there is a control
            if (!fxCtrlObj[key]) {return;}

            const o = fxCtrlObj[key];

            switch (o.input.type) {
                case "slider":
                case "list":
                    const sLabel = document.createElement('label');
                    sLabel.htmlFor = `fx-slider-b${bus + 1}-${si}`;
                    node.appendChild(sLabel);

                    const slider = document.createElement('input');
                    slider.type = 'range';
                    slider.min = '0';
                    slider.max = '127';
                    slider.step = '1';
                    slider.id = `fx-slider-b${bus + 1}-${si}`;
                    slider.className = 'btn-fx-par-slider';
                    slider.dataset.bus = bus; // zero‑based index
                    slider.dataset.ctrl = si;
                    slider.value = o.input.defVal; // restore saved value
                    sLabel.appendChild(slider);

                    break;

                case "toggle":
                    const tLabel = document.createElement('label');
                    tLabel.htmlFor = `fx-toggle-b${bus + 1}-${si}`;
                    node.appendChild(tLabel);

                    const tog = document.createElement('button');
                    tog.type = 'button';
                    tog.id = `fx-toggle-b${bus + 1}-${si}`;
                    tog.className = 'btn-fx-par-toggle';
                    tog.dataset.bus = bus; // zero‑based index
                    tog.dataset.ctrl = si; // zero‑based index
                    tog.dataset.state = false; // on/off
                    tog.textContent = 'OFF';
                    tLabel.appendChild(tog);

                    break;
            
                default:
                    break;
            }

        }

        //Setup Event Listeners

        node.addEventListener('change', e => {
            const slider = e.target.closest('input.btn-fx-par-slider');
            if (!slider) return;
            const [, bus, param] = slider.id.match(/fx-slider-b(\d+)-(\d+)/);
            const key = `bus${bus}`;
            this.settings[key].sliders[param] = Number(slider.value);
            this.saveSettings(this.settings);
        });



    }
    //#endregion

}
