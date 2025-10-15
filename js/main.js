import { regSW } from './modules/regSW.js'; 
import { SpTool } from './modules/SpTool.js'; 
import { ShareMe } from './modules/shareMe.js'; 
document.addEventListener('DOMContentLoaded', async () => {
   try { await regSW(); } catch (e) { console.warn('SW reg failed', e); }
   const spTool = SpTool.create({});
   
   const share = new ShareMe(
    '#shareMe',
    'https://fretool.dev-zoo.net',
    'https://chat.whatsapp.com/JXLaKagPXh529k52I3iLC2?mode=ems_copy_t'
    );
});

