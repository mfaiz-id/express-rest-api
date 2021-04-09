'use strict'
const moment = require("moment");
class Time {
  static get_hari(day) {
    var nama_hari = '';
    switch(day) {
      case 'Mon': nama_hari = "Senin"; break;
      case 'Tue': nama_hari = "Selasa"; break;
      case 'Wed': nama_hari = "Rabu"; break;
      case 'Thu': nama_hari = "Kamis"; break;
      case 'Fri': nama_hari = "Jum'at"; break;
      case 'Sat': nama_hari = "Sabtu"; break;
      case 'Sun': nama_hari = "Minggu"; break;
      default:
        nama_hari = "Tidak di ketahui";		
      break;
    }
    return nama_hari;
  }

  static generate_tanggal_indonesia_v1 (tanggal){
    var bln = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September' , 'Oktober', 'November', 'Desember'];     
    let tanggal_lengkap =  tanggal;
    let tgl = tanggal_lengkap.split("-")[2];
    let bulan = tanggal_lengkap.split("-")[1];
    let tahun = tanggal_lengkap.split("-")[0];
    return tgl + " " + bln[Math.abs(bulan)] + " " + tahun;
  }

  static timestamp_to_tanggal_indonesia (tanggal){
    var bln = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September' , 'Oktober', 'November', 'Desember'];     
    let tanggal_lengkap =  tanggal ? moment(tanggal).format('YYYY-MM-DD') : '-';
    let tgl = tanggal_lengkap.split("-")[2];
    let bulan = tanggal_lengkap.split("-")[1];
    let tahun = tanggal_lengkap.split("-")[0];
    return tgl + " " + bln[Math.abs(bulan)] + " " + tahun;
  }

}

module.exports = Time