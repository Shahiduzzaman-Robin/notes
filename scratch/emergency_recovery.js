const mongoose = require('mongoose');
require('dotenv').config();

const noteSchema = new mongoose.Schema({
  title: String,
  content: String,
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);

async function restore() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/productivity-app');
  
  const content = `
    <p>Stock coverage Ratio=SCR</p>
    <p>EL must be stocked for 3 Days</p>
    <p>DSR should be Present at Least 20 Days. Otherwise, Commission will be deducted 50% if missed.</p>
    <p>El POS: Montly 1 Visit+BDT 300 C2C</p>
    <p>SIM pos: 1 Visit+ 1 SIM registration within 200 Meters</p>
    <p>DHFF Count: Distribution House Field Forcex</p>
    <p>MCO= Merged Company(Robi+Airtel)</p>
    <br>
    <h3>Campaign Details</h3>
    <table style="min-width: 50px;">
      <tr><th>Name of Campaign</th><th>Channel</th></tr>
      <tr><td>Durbar</td><td>DH Manager</td></tr>
      <tr><td>Distributor</td><td>Breakever,ROI and ROI+</td></tr>
      <tr><td>Duranta</td><td>DSR, DSR Supervisor</td></tr>
      <tr><td>Durdanto</td><td>DSO, DSO Supervisor</td></tr>
      <tr><td>FWA Power Drive</td><td>DSO, RFO, RSSP, RSSP-Agent, DSR</td></tr>
    </table>
    <br>
    <p>Durbar for DH manager: BDT 10,000</p>
    <p>Duranta for DSR and DSR Supervisor: BDT 10,500</p>
    <p>Durdanto for DSO and DSO supervisor: 29,000 and 28,000 BDT</p>
    <p>FWA Power Drive for DSO, RFO, RSSP_AGENT and DSR: BDT 600 for Focus Grid and BDT 500 for Rest of the GRID</p>
    <p>FWA Power Drive for Supervisor: 0-2 hits: 0 Taka, 3 Hits: BDT 600 Taka, 4+ Hits: BDT 150 Per FWA</p>
    <p>Succesful FWA Sell: Sim Activation+ Pack Activation+FWA Device tagged with SIM+ GA Location</p>
    <br>
    <h4>FWA Power Drive For Distributor:</h4>
    <table style="min-width: 50px;">
      <tr><th>Range</th><th>Distributor-A</th><th>Distributor-B</th><th>Distributor-C</th></tr>
      <tr><td>Low</td><td>0-15 FWA (BDT 0)</td><td>0-10 FWA (BDT 0)</td><td>0-5 FWA (BDT 0)</td></tr>
      <tr><td>Mid</td><td>16-30 FWA (100/FWA)</td><td>11-20 FWA (100/FWA)</td><td>5-10 FWA (100/FWA)</td></tr>
      <tr><td>High</td><td>30-50 FWA (150/FWA)</td><td>21-30 FWA (150/FWA)</td><td>11-20 FWA (150/FWA)</td></tr>
      <tr><td>Max</td><td>50+ FWA (200/FWA)</td><td>30+ FWA (200/FWA)</td><td>20+ FWA (100/FWA)</td></tr>
    </table>
    <br>
    <h4>Trade Campaign</h4>
    <table style="min-width: 50px;">
      <tr><th>Particulars</th><th>Retail FR7</th><th>Retail FR43</th><th>Assist FR7</th><th>Assist FR 43</th></tr>
      <tr><td>SIM Lifting</td><td>BDT 175</td><td>BDT 175</td><td>BDT 175</td><td>BDT 175</td></tr>
      <tr><td>FTR</td><td>BDT 7</td><td>BDT 43</td><td>BDT 7</td><td>BDT 43</td></tr>
      <tr><td>Total Investment</td><td>BDT 182</td><td>BDT 218</td><td>BDT 182</td><td>BDT 43</td></tr>
      <tr><td>Commission</td><td>BDT 0</td><td>BDT 36</td><td>BDT 12</td><td>BDT 48</td></tr>
      <tr><td>Landing</td><td>BDT 182</td><td>BDT 182</td><td>BDT 170</td><td>BDT 170</td></tr>
    </table>
    <br>
    <h4>Amar Kacher Dokan</h4>
    <p>90-100%: 12 TK per GA</p>
    <p>100-110%: 20 Tk</p>
    <p>110-120%: 25 TK</p>
    <p>120-150%: 30 Tk</p>
    <p>150% and Above: 40 TK</p>
    <br>
    <h4>Slab Based GA Campaign</h4>
    <p>3-9 GA: TK 10 per GA</p>
    <p>9-25 GA: TK 15 Per GA</p>
    <p>15+ GA: TK 20 Per GA</p>
  `;

  const updated = await Note.findOneAndUpdate(
    { title: 'APR 26 Robi Chandpur' },
    { content: content.trim() },
    { new: true }
  );

  if (updated) {
    console.log('RECOVERY SUCCESSFUL!');
    console.log('Restored Title:', updated.title);
    console.log('Restored Content Length:', updated.content.length);
  } else {
    console.log('Note not found by title. Creating new one...');
    await Note.create({ title: 'APR 26 Robi Chandpur', content: content.trim() });
    console.log('Created as new note.');
  }
  
  await mongoose.disconnect();
}

restore();
