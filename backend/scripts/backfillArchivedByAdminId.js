// Backfill unic pentru anunțurile arhivate de admin înainte de introducerea
// câmpului archivedByAdminId — le atribuie singurului admin cunoscut, ADMIN_ID.
// Fără nicio informație istorică despre "cine anume" le-a arhivat, aceasta e
// singura atribuire posibilă (corectă atâta timp cât există un singur admin).
//
// Implicit rulează în modul dry-run (doar afișează ce ar modifica).
// Rulează cu --apply ca să scrie efectiv în baza de date:
//   node scripts/backfillArchivedByAdminId.js --apply

require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');

const ADMIN_ID = '6808bf9a48e492acb8db7173';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI in env');
    process.exit(1);
  }

  const apply = process.argv.includes('--apply');

  await mongoose.connect(uri);

  const query = {
    archivedByAdmin: true,
    $or: [{ archivedByAdminId: null }, { archivedByAdminId: { $exists: false } }],
  };

  const affected = await Announcement.find(query).select('_id title user archivedByAdmin archivedByAdminId').lean();

  console.log(`Găsite ${affected.length} anunțuri arhivate de admin, fără archivedByAdminId setat.`);
  affected.forEach((a) => {
    console.log(`- ${a._id}  "${a.title}"  (proprietar: ${a.user})`);
  });

  if (!apply) {
    console.log('\nDry-run (implicit). Nimic nu a fost modificat.');
    console.log(`Rulează din nou cu --apply ca să setezi archivedByAdminId = ${ADMIN_ID} pe aceste ${affected.length} anunțuri.`);
  } else {
    const result = await Announcement.updateMany(query, { $set: { archivedByAdminId: ADMIN_ID } });
    console.log(`\nActualizate ${result.modifiedCount} anunțuri cu archivedByAdminId = ${ADMIN_ID}.`);
  }

  await mongoose.connection.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
