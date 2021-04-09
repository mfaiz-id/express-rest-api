require('dotenv').config();
var express = require('express');
var router = express.Router();
const knex = require('../db/knex');
const cron = require('node-cron');

const jwtMiddleware = require('express-jwt-middleware');
var jwtCheck = jwtMiddleware(process.env.API_SECRET)

// load router mulai dari sini
var user_api = require('../api/controller/UserController');
var instansi_api = require('../api/controller/InstansiController');
var pelayanan_api = require('../api/controller/PelayananController');
var loket_api = require('../api/controller/LoketController');
var config_api = require('../api/controller/ConfigController');
var slider_api = require('../api/controller/SliderController');
var auth_api = require('../api/controller/AuthController');
var menu_api = require('../api/controller/MenuController');
var berita_api = require('../api/controller/BeritaController');
var fasilitas_api = require('../api/controller/FasilitasController');
var galeri_api = require('../api/controller/GaleriController');
var galeri_video_api = require('../api/controller/VideoController');
var log_aktivitas_api = require('../api/controller/AktivitasController');
var antrian_api = require('../api/controller/AntrianController');
var anggota_api = require('../api/controller/AnggotaController.js');
var checkin_api = require('../api/controller/CheckinController.js');
var display_api = require('../api/controller/DisplayController.js');
var dashboard_api = require('../api/controller/DashboardController.js');
var ikm_api = require('../api/controller/IkmController.js');
var report_api = require('../api/controller/ReportController.js');

const { registerValidation } = require('../middleware/input-validation');


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// ======= cronjob update data antrian instansi ========
const task = cron.schedule('59 23 * * *', function() {
  update_antrian_instansi().then(console.log('success update antrian isntansi'));
  // router.post('/save-instansi', jwtCheck, instansi_api.save_instansi);
});

async function update_antrian_instansi() {
    await knex('m_instansi').update({ 
      no_antrian_sekarang : null,
    })
    return res.json({
      success : true,
      message : 'Data Antrian Instansi Berhasil Diupdate !',
    })
  };
// =====================================================

// -- MUST AUTH
//Menu
router.post('/menu-admin', jwtCheck, menu_api.get_menu);

// Instansi
router.post('/save-instansi', jwtCheck, instansi_api.save_instansi);
router.post('/update-instansi', jwtCheck, instansi_api.update_instansi);
router.post('/update-instansi-all', jwtCheck, instansi_api.update_instansi_all);
router.post('/nonaktif-instansi', jwtCheck, instansi_api.nonaktif_instansi);

// Pelayanan
router.post('/save-pelayanan', jwtCheck, pelayanan_api.save_pelayanan);
router.post('/update-pelayanan', jwtCheck, pelayanan_api.update_pelayanan);
router.post('/nonaktif-pelayanan', jwtCheck, pelayanan_api.nonaktif_pelayanan);
router.post('/get-all-layanan', jwtCheck, pelayanan_api.get_all);

// Loket
router.post('/save-loket', jwtCheck, loket_api.save_loket);
router.post('/update-loket', jwtCheck, loket_api.update_loket);
router.post('/nonaktif-loket', jwtCheck, loket_api.nonaktif_loket);
router.post('/save-loket-pc',  loket_api.save_loket_pc);

// galeri
router.post('/save-galeri', jwtCheck,  galeri_api.save_galeri);
router.post('/update-galeri', jwtCheck, galeri_api.update_galeri);
router.post('/nonaktif-galeri', jwtCheck, galeri_api.nonaktif_galeri);

// fasilitas
router.post('/save-fasilitas',  jwtCheck, fasilitas_api.save_fasilitas);
router.post('/update-fasilitas',  jwtCheck, fasilitas_api.update_fasilitas);
router.post('/nonaktif-fasilitas', jwtCheck,  fasilitas_api.nonaktif_fasilitas);
// Slide
router.post('/save-slide',  jwtCheck, slider_api.save_slider);
router.post('/update-slide',  jwtCheck, slider_api.update_slider);
router.post('/nonaktif-slide', jwtCheck,  slider_api.nonaktif_slider);

// berita
router.post('/save-berita', jwtCheck, berita_api.save_berita);
router.post('/update-berita', jwtCheck, berita_api.update_berita);
router.post('/nonaktif-berita', jwtCheck, berita_api.nonaktif_berita);

// IKM
router.post('/save-ikm', jwtCheck, ikm_api.saveIkm);
router.post('/get-data-ikm', ikm_api.load_data);
router.post('/get-pertanyaan-ikm', ikm_api.load_pertanyaan);
router.post('/update-ikm', jwtCheck, ikm_api.update_ikm);
router.post('/nonaktif-ikm', jwtCheck, ikm_api.nonaktif_ikm);
router.post('/get-penilaian-ikm', jwtCheck, ikm_api.getPenilaianIkm);
router.post('/save-penilaian-ikm', jwtCheck, ikm_api.savePenilaianIkm);
router.post('/get_daftar_user_belum_isi_ikm', jwtCheck, ikm_api.get_daftar_user_belum_isi_ikm);
router.post('/statistik_penilaian', ikm_api.statistik_penilaian_ikm);
router.get('/get-ikm', ikm_api.get_pertanyaan);

// user
router.post('/save-user', jwtCheck, user_api.save_user);
router.post('/update-user', jwtCheck, user_api.update_user);
router.post('/nonaktif-user', jwtCheck, user_api.nonaktif_user);

router.post('/scan-qrcode', jwtCheck, checkin_api.scan_qrcode);
router.post('/data-antrian', jwtCheck, checkin_api.load_data);
router.post('/list-data-antrian', jwtCheck, checkin_api.getListAntrian);
router.post('/filter-antrian-by-instansi', jwtCheck, checkin_api.getListInstansi);
router.post('/list-instansi',  checkin_api.getListInstansi);

// tambah anggota
router.post('/save-anggota',  jwtCheck, anggota_api.save_anggota);
router.post('/update-anggota',  jwtCheck, anggota_api.update_anggota);
router.post('/nonaktif-anggota', jwtCheck,  anggota_api.nonaktif_anggota);


// Firebase Token
router.post('/update_firebase_token', jwtCheck, auth_api.update_firebase_token);

// Notifikasi
router.post('/my-notifikasi', jwtCheck, auth_api.list_notifikasi);
router.post('/read-notifikasi', jwtCheck, auth_api.read_notifikasi);

// Antrian
router.post('/display/get_kode_display_per_loket', jwtCheck, antrian_api.get_kode_display_per_loket);
router.post('/daftar_antrian_all_status', jwtCheck, antrian_api.daftar_antrian_all_status);
router.post('/get_no_antrian_sekarang_n_max_antrian', jwtCheck, antrian_api.get_no_antrian_sekarang_n_max_antrian);
router.post('/get-jam', jwtCheck, antrian_api.get_jam);
router.post('/save-antrian', jwtCheck, antrian_api.save_antrian);
router.post('/antrian/get_anggota', jwtCheck, anggota_api.get_anggota_in_antrian);
router.post('/get-cetak-antrian-by-id-antrian', jwtCheck, antrian_api.get_cetak_antrian_by_id_antrian);
router.post('/history-antrian', jwtCheck, antrian_api.history_antrian_per_id_user);
router.post('/detail-history-antrian', jwtCheck, antrian_api.detail_history_antrian);
router.post('/cek-antrian', jwtCheck, antrian_api.cek_antrian);
router.post('/get-data-histori-antrian', antrian_api.load_data_history_antrian);

// Display
router.post('/get-front-display', jwtCheck, display_api.get_front_display);
router.post('/buat_display_baru', jwtCheck, display_api.buat_display_baru);
router.post('/get_display_by_template', jwtCheck, display_api.get_display_by_template);
router.post('/get-template', jwtCheck, display_api.get_template);
router.post('/post_idle_display_loket', jwtCheck, display_api.post_idle_display_loket);
router.post('/get_idle_loket', jwtCheck, display_api.get_idle_loket);
router.post('/delete-loket-in-display', jwtCheck, display_api.delete_loket_in_display);
router.post('/display-loket', jwtCheck, display_api.display_loket_by_id_instansi);
router.post('/save_loket_to_display', jwtCheck, display_api.save_loket_to_display);

router.post('/get_display_antrian_mobile', display_api.get_display_antrian_mobile);


// -- END MUST AUTH

// -- NO AUTH

// Auth
router.post('/Auth/register', auth_api.register);
router.post('/Auth/register_masyarakat', registerValidation, auth_api.register_masyarakat);
router.post('/Auth/login', auth_api.login);
router.get('/Auth/me', auth_api.me);
router.post('/Auth/logout', auth_api.me);
router.post('/Auth/verifikasi-akun', auth_api.verifikasi_akun);
router.post('/Auth/reset-password', auth_api.send_email_reset_password);
router.post('/Auth/save-reset-password',  auth_api.resetPassword);
router.post('/Auth/send_fcm_notifikasi',  auth_api.send_fcm_notifikasi);
router.post('/Auth/tes_notifikasi',  auth_api.tes_notifikasi);

router.get('/config', config_api.index);
router.get('/menu_front', menu_api.get_menu_front);

// slider
router.get('/slide', slider_api.index);

// Instansi
router.post('/instansi', instansi_api.index);
router.post('/get-data-instansi', instansi_api.load_data);
router.post('/detail-instansi', instansi_api.DetailInstansi);

// Pelayanan
router.post('/get-data-pelayanan', pelayanan_api.load_data);
router.post('/pelayanan', instansi_api.layanan);
router.post('/detail-pelayanan',  instansi_api.layanan);

// Loket
router.post('/get-data-loket', loket_api.load_data);

// Berita
router.get('/list-berita', berita_api.list_berita);
router.post('/get-data-berita', berita_api.load_data);
router.post('/detail-berita', berita_api.detailBerita);
// Fasilitas
router.get('/fasilitas', fasilitas_api.index);
router.post('/get-data-fasilitas', fasilitas_api.load_data);
// Galeri
router.post('/get-data-galeri', galeri_api.load_data);
// Video
router.post('/get-data-video', galeri_video_api.load_data);
router.post('/save-video', jwtCheck,  galeri_video_api.save_video);
router.post('/update-video', jwtCheck, galeri_video_api.update_video);
router.post('/nonaktif-video', jwtCheck, galeri_video_api.nonaktif_video);
// Log Aktivitas
router.post('/get-data-aktivitas', log_aktivitas_api.load_data);
// Slide
router.post('/get-data-slide', slider_api.load_data);

// user
router.post('/get-data-user', user_api.load_data);
router.post('/profile', user_api.profile);
router.get('/get-data-role', user_api.roles);
router.post('/update-profile',jwtCheck, user_api.update_profile);
router.post('/update-foto-profile',jwtCheck, user_api.update_foto_profile);
router.post('/update-password',jwtCheck, user_api.update_password);
// tambah anggota
router.post('/get-data-anggota', anggota_api.load_data);

// dashboard statistik
router.post('/get-dashboard', dashboard_api.getCountDashboard);
router.post('/get-dashboard-harian', dashboard_api.getCountDashboardHarian);
router.post('/get-dashboard-mingguan', dashboard_api.getCountDashboardMingguan);
router.post('/get-dashboard-bulanan', dashboard_api.getCountDashboardBulanan);
router.post('/get-dashboard-tahunan', dashboard_api.getCountDashboardTahunan);
router.post('/get-dashboard-instansi', dashboard_api.getCountDashboardInstansi);
router.post('/get-prosentase-instansi', dashboard_api.getProsentaseDashboardInstansi);
router.post('/get-prosentase-layanan', dashboard_api.getProsentaseLayananInstansi);
router.post('/get-jumlah-pendaftaran-akun', dashboard_api.getJumlahPendaftaranAkun);
router.post('/get-jumlah-kunjungan', dashboard_api.getJumlahKunjungan);
router.post('/get-jumlah-pendaftaran-akun-bln-thn', dashboard_api.getJumlahPendaftaranAkunBulanTahun);
router.post('/get-instansi-pelayanan', dashboard_api.getCountDashboardInstansiLayanan);
// -- END NO AUTH

// REPORT
router.post('/report-pengunjung-tanggal', report_api.reportPengunjungTanggal);
router.post('/report-pengunjung-harian-28', report_api.reportPengunjungHarian28);
router.post('/report-pengunjung-harian-29', report_api.reportPengunjungHarian29);
router.post('/report-pengunjung-harian-30', report_api.reportPengunjungHarian30);
router.post('/report-pengunjung-harian-31', report_api.reportPengunjungHarian31);
router.post('/report-pengunjung-bulanan', report_api.reportPengunjungBulanan);
router.post('/report-pengunjung-tahunan', report_api.reportPengunjungTahunan);


// REPORT PDF
router.post('/report-pengunjung-tanggal-pdf', report_api.reportPengunjungTanggalPdf);
router.post('/report-pengunjung-harian-28-pdf', report_api.reportPengunjungHarianPdf28);
router.post('/report-pengunjung-harian-29-pdf', report_api.reportPengunjungHarianPdf29);
router.post('/report-pengunjung-harian-30-pdf', report_api.reportPengunjungHarianPdf30);
router.post('/report-pengunjung-harian-31-pdf', report_api.reportPengunjungHarianPdf31);
router.post('/report-pengunjung-bulanan-pdf', report_api.reportPengunjungBulananPdf);
router.post('/report-pengunjung-tahunan-pdf', report_api.reportPengunjungTahunanPdf);

//REPORT EXCEL
router.post('/report-pengunjung-tanggal-excel', report_api.reportPengunjungTanggalExcel);
router.post('/report-pengunjung-harian-28-excel', report_api.reportPengunjungHarianExcel28);
router.post('/report-pengunjung-harian-29-excel', report_api.reportPengunjungHarianExcel29);
router.post('/report-pengunjung-harian-30-excel', report_api.reportPengunjungHarianExcel30);
router.post('/report-pengunjung-harian-31-excel', report_api.reportPengunjungHarianExcel31);
router.post('/report-pengunjung-bulanan-excel', report_api.reportPengunjungBulananExcel);
router.post('/report-pengunjung-tahunan-excel', report_api.reportPengunjungTahunanExcel);

module.exports = router;
