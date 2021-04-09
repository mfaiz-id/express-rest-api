require('dotenv').config();
const bcrypt = require ("bcrypt");
const jwt = require('jsonwebtoken');
var User = require('../models/User');
var UserHasRoles = require('../models/UserHasRoles');
var TAnggota = require('../models/TAnggota');
const Log = require('../models/Log');
const knex = require('../../db/knex');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
const handlebars = require('handlebars');
const moment = require("moment");
const fs = require('fs');
var NotifikasiController = require('../controller/NotifikasiController');
const SistemHelper = require('../../Helpers/SistemHelper');
const { validationResult } = require('express-validator');


var serverKey = 'keyfirebasetoken';
var FCM = require('fcm-node');

exports.register = async function(req, res, next) {
    try{
        const data      = req.body;
        const username  = data.username;
        const email     = data.email;
        const password  = data.password;
        const nama      = data.nama;
        const no_hp     = data.no_hp;
        // start save

        const cek_user = await knex.raw(`
            select count(*) jml from users u 
            where u.username = '${username}' or email = '${email}'
        `);

        const jumlah_data = parseInt(cek_user.rows[0].jml)

        if(jumlah_data==0){
            bcrypt.hash(password, 10)
            .then(async hashedPassword => {
                await User.query().insert({
                    name: nama,
                    username: username,
                    email: email,
                    password: hashedPassword,
                    no_hp: no_hp,
                    status:'1'
                })
                .returning(["id", "username"])
                .then(users => {
                    res.json({
                        success: true,
                        message: "User dengan nama : "+users.name+" berhasil register !",
                        data:{
                            username: users.username,
                            nama: users.name,
                            email: users.email,
                            no_hp: users.no_hp,
                        }
                    })
                })
                .catch(error => next(error))
            })
        }else{
            res.json({
                success: false,
                message: "Username atau Email sudah terdaftar !",
            });
        }
       
    } catch (err){
        console.log(err)
        return res.status(500).json({ msg: 'Internal server error' });
    }
};
exports.register_masyarakat = async function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
    try{
        const ip_address_client = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const user_agent_client = req.useragent;
        const data              = req.body;
        const nik               = data.nik;
        const email             = data.email;
        const password          = data.password;
        const nama              = data.nama;
        const no_hp             = data.no_hp;
        const jenis_kelamin     = data.jenis_kelamin;
        const alamat            = data.alamat;
        // start save
        // const cek_user = await knex.raw(`
        //     select count(*) jml from users u 
        //     where u.username = '${nik}' or email = '${email}' or no_hp = '${no_hp}'
        // `);

        // const jumlah_data = parseInt(cek_user.rows[0].jml)

        let n = await knex.raw(`
            select * from users u
            where u.username = '${nik}'
        `)
        let cek_nik = n.rows

        let e = await knex.raw(`
            select * from users u
            where u.email = '${email}'
        `)
        let cek_email = e.rows

        let h = await knex.raw(`
            select * from users u
            where u.no_hp = '${no_hp}'
        `)
        let cek_hp = h.rows

        if(cek_nik.length > 0){
            res.json({
                success: false,
                icon:'danger',
                message: "NIK sudah terdaftar !",
            });
        }else if(cek_email.length > 0){
            res.json({
                success: false,
                icon:'danger',
                message: "Email sudah terdaftar !",
            });
        }else if(cek_hp.length > 0){
            res.json({
                success: false,
                icon:'danger',
                message: "No.HP sudah terdaftar !",
            });
        }else{
            bcrypt.hash(password, 10)
            .then(async hashedPassword => {
                await User.query().insert({
                    name: nama,
                    username: nik,
                    email: email,
                    password: hashedPassword,
                    no_hp: no_hp,
                    status:'2',
                    is_masyarakat:true,
                })
                .returning(["id", "username"])
                .then(async users => {

                    await TAnggota.query().insert({
                        user_id:users.id,
                        nama_anggota:users.name,
                        nomor_telpon:users.no_hp,
                        status:'1',
                        nik: users.username,
                        jenis_kelamin:jenis_kelamin,
                        alamat:alamat,
                    });
                    
                    
                    // start kirim email
                    const get_app_config = await knex.raw(`select nama_sistem, base_url, email_smtp, pass_smtp from app_config where status ='1'`)
                    const app_config = get_app_config.rows[0]
                    
                    const tanggal_v1 = moment(new Date()).format('YYYY-MM-DD')
                    const tanggal_v2 = moment(new Date()).format('ddd') // format hari
                    var tgl = SistemHelper.generate_tanggal_indonesia_v1(tanggal_v1);
                    var nama_hari = SistemHelper.get_hari(tanggal_v2);
                    var tgl_hari_ini = nama_hari+', '+tgl;

                    var fileHtml = fs.readFileSync('views/email/template-email.html','utf8')
                    var template = handlebars.compile(fileHtml);
                    var replacements = {
                        nama_sistem   : app_config.nama_sistem,
                        id_user   : users.id,
                        name      : users.name,
                        username  : users.username,
                        email     : users.email,
                        url_root  : app_config.base_url+'/verifikasi_akun/'+users.id,
                        tanggal   : tgl_hari_ini,
                    };
                    var htmlnya = template(replacements);
                    const subjectnya = 'Verifikasi Pendaftaran | '+app_config.nama_sistem;
                    
                    let transporter = nodemailer.createTransport(smtpTransport({    
                        service: 'gmail',
                        host: 'smtp.gmail.com', 
                        auth: {        
                            user: app_config.email_smtp,        
                            pass: app_config.pass_smtp    
                        }
                    }));

                    const mailOptions = {
                        from: app_config.email_smtp,
                        to: users.email,
                        subject: subjectnya,
                        html: htmlnya
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Verifikasi Email terkirim ke: '+users.email+' - keterangan : '+ info.response);
                        }
                    });
                    // end kirim email
                    res.json({
                        success: true,
                        icon:'success',
                        message: "Berhasil menyimpan data. Silakan klik tombol verifikasi yang telah kami kirimkan ke  : "+users.email+" !",
                        data:{
                            nik: users.username,
                            nama: users.name,
                            email: users.email,
                            no_hp: users.no_hp,
                        }
                    })
                    await Log.query().insert({
                        actions:'Register',
                        id_kode:users.id,
                        id_user:users.id,
                        ip_address:ip_address_client,
                        user_agent:user_agent_client,
                        keterangan:'Berhasil Register atas nama '+users.name,
                    });
                })
                .catch(error => next(error))
            })
        }

    } catch (err){
        console.log(err)
        return res.status(500).json({ msg: 'Internal server error' });
    }
};
exports.login = async function(req, res, next) {
    try{
        const ip_address_client = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const user_agent_client = req.useragent;
        const data      = req.body;
        const identity  = data.identity;
        const password  = data.password;
        const device    = data.device;
        
        const cek_user = await knex.raw(`
            select u.id,u.name,u.username,u.email,u.password,ta.nik,u.status,ta.status as status_anggota,u.foto,u.no_hp,u.is_masyarakat, u.id_instansi, mi.nama_instansi from users u 
            left join t_anggota ta on ta.user_id = u.id 
            left join m_instansi mi on mi.id_instansi = u.id_instansi
            where ( 
                (u.username = '${identity}' or u.email = '${identity}' or ta.nik='${identity}' or u.no_hp = '${identity}')  
            )
            limit 1
        `);
        const jumlah_data = parseInt(cek_user.rows.length)
        if(jumlah_data==1){
            const data_user = cek_user.rows[0];
            var nama_user = data_user.name
            if(data_user.status=="1"){
                bcrypt.compare(password, data_user.password)
                .then(async isAuthenticated => {
                    if(!isAuthenticated){
                        res.json({
                            success: false,
                            message: "Password Anda Salah !",
                        });
                    }else{
                        // res.json('login')
                        const id_user = data_user.id;
                        if(data_user.is_masyarakat==true){
                            const cek_role = await knex.raw(`
                                select uhr.role_id, r.name as nama_role from user_has_roles uhr 
                                join roles r on r.id = uhr.role_id 
                                where uhr.user_id = '${id_user}' and role_id = 'HA02'
                            `);
                            const jumlah_role = cek_role.rows.length;
                            if(jumlah_role==0){
                                var can_login = false
                            }else{
                                var can_login = true
                                var data_role_selected = cek_role.rows[0]
                            }
                        }else{
                            const cek_role = await knex.raw(`
                                select uhr.role_id, r.name as nama_role from user_has_roles uhr 
                                join roles r on r.id = uhr.role_id 
                                where uhr.user_id = '${id_user}'
                            `);
                            const jumlah_role = cek_role.rows.length;
                            if(jumlah_role==0){
                                var can_login = false
                            }else if(jumlah_role==1){
                                var can_login = true
                                var data_role_selected = cek_role.rows[0]
                            }else{
                                var data_role_selected = {
                                    role_id:'',
                                    nama_role:'',
                                }
                            }
                        }
                        if(can_login==true){
                            await Log.query().insert({
                                actions:'Login',
                                id_kode:data_user.id,
                                id_user:data_user.id,
                                ip_address:ip_address_client,
                                user_agent:user_agent_client,
                                keterangan:'Berhasil Login atas nama '+nama_user,
                            });

                            const data_jwt = {
                                id_user: data_user.id,
                                username: data_user.username,
                                email: data_user.email,
                                nik: data_user.nik,
                                foto: data_user.foto,
                                nama_user: data_user.name,
                                no_hp: data_user.no_hp,
                                role_id:data_role_selected.role_id,
                                nama_role:data_role_selected.nama_role,
                                id_instansi:data_user.id_instansi,
                                nama_instansi:data_user.nama_instansi,
                            }
                            const jwt_token = jwt.sign(data_jwt, process.env.API_SECRET,  {
                                expiresIn: "8760h"
                            });
                            
                            if(device=="mobile"){
                                res.json({
                                    success: true,
                                    id_user:data_user.id,
                                    username:data_user.username,
                                    email:data_user.email,
                                    nik:data_user.nik,
                                    foto:data_user.foto,
                                    nama_user:data_user.nama_user,
                                    no_hp:data_user.no_hp,
                                    role_id:data_role_selected.role_id,
                                    nama_role:data_role_selected.nama_role,
                                    id_instansi:data_user.id_instansi,
                                    jwt_token
                                });
                            }else{
                                res.json({
                                    success: true,
                                    id_user:data_user.id,
                                    username:data_user.username,
                                    email:data_user.email,
                                    nik:data_user.nik,
                                    foto:data_user.foto,
                                    nama_user:data_user.nama_user,
                                    no_hp:data_user.no_hp,
                                    role_id:data_role_selected.role_id,
                                    nama_role:data_role_selected.nama_role,
                                    id_instansi:data_user.id_instansi,
                                    jwt_token
                                });
                            }


                        }else{
                            res.json({
                                success: false,
                                message: "User dengan email : "+data_user.email+" belum memiliki role !",
                            });
                        }
                    }
                })
            }else if(data_user.status=="2"){

                await Log.query().insert({
                    actions:'Login',
                    id_kode:data_user.id,
                    id_user:data_user.id,
                    ip_address:ip_address_client,
                    user_agent:user_agent_client,
                    keterangan:'User belum verifikasi email : '+data_user.email,
                });

                res.json({
                    success: false,
                    message: "Anda belum memverifikasi email yang telah kami kirimkan ke "+data_user.email+"  !",
                });
            }else if(data_user.status=="3"){
                await Log.query().insert({
                    actions:'Login',
                    id_kode:data_user.id,
                    id_user:data_user.id,
                    ip_address:ip_address_client,
                    user_agent:user_agent_client,
                    keterangan:'User dengan email : '+data_user.email+' diblokir !',
                });

                res.json({
                    success: false,
                    message: "Akun Anda diblokir oleh sistem, hubungi pusat bantuan untuk memulihkannya !",
                });
            }else{
                await Log.query().insert({
                    actions:'Login',
                    id_kode:identity,
                    id_user:identity,
                    ip_address:ip_address_client,
                    user_agent:user_agent_client,
                    keterangan:'User dengan identitas : '+identity+' status invalid !',
                });

                res.json({
                    success: false,
                    message: "Username atau Email tidak terdaftar !",
                });
            }

        }else{
            await Log.query().insert({
                actions:'Login',
                id_kode:identity,
                id_user:identity,
                ip_address:ip_address_client,
                user_agent:user_agent_client,
                keterangan:'User dengan identitas : '+identity+' tidak terdaftar !',
            });

            res.json({
                success: false,
                message: "Username atau Email tidak terdaftar !",
            });
        }
    } catch (err){
        console.log(err)
        return res.status(500).json({ msg: 'Internal server error' });
    }
};
exports.me = async function(req, res) {
    var bearer_token = req.headers.authorization
    if (!bearer_token){
        return res.status(400).json({
            type: 'error', message: 'Authorization header not found.'
        })
    } else{
        try {
            
            const split_token = bearer_token.split(' ');
            const token = split_token[1];
            var decoded = jwt.verify(token, process.env.API_SECRET);

            res.json({
                success: true,
                data: decoded,
            });
        } catch(err) {
            return res.status(400).json({
                type: 'error', message: 'User tidak ditemukan !'
            })
        }
    }
};
exports.verifikasi_akun = async function(req, res, next) {
    try{
        const data      = req.body;
        const id_user  = data.id_user;
        // start save

        const cek_user = await knex.raw(`
            select * from users u 
            where u.id = '${id_user}'
        `);

        const jumlah_data = parseInt(cek_user.rows.length)

        if(jumlah_data==0){
            res.json({
                success: false,
                message: "Akun tidak ditemukan, hubungi pusat bantuan !",
            });
        }else{
            const data_user = cek_user.rows[0];
            if(data_user.status=="1"){
                const tanggal_verifikasi = moment(data_user.email_verified_at).format('YYYY-MM-DD')
                var tgl = SistemHelper.generate_tanggal_indonesia_v1(tanggal_verifikasi);
                res.json({
                    success: false,
                    icon:'info',
                    message: "Akun sudah diverifikasi pada  "+tgl+" !",
                });
            }else if(data_user.status=="2"){

                await User.query().findById(id_user).patch({
                    status              : '1',
                    email_verified_at   : moment(new Date()).format('YYYY-MM-DD hh:mm'),
                });
                await UserHasRoles.query().insert({
                    role_id: 'HA02',
                    user_id: id_user,
                })

                res.json({
                    success: true,
                    icon:'success',
                    message: "Akun dengan nama "+data_user.name+" berhasil diverifikasi !",
                });
            }else if(data_user.status=="3"){
                res.json({
                    success: false,
                    icon:'info',
                    message: "Akun diblokir, hubungi pusat bantuan !",
                });
            }else{
                res.json({
                    success: false,
                    icon:'error',
                    message: "Akun tidak dikenali !",
                });
            }
        }
    } catch (err){
        console.log(err)
        return res.status(500).json({ msg: 'Internal server error' });
    }
};
exports.send_email_reset_password = async function(req, res, next) {
    const inputPost = req.body;
  const email     = inputPost.email;
  const get_app_config = await knex.raw(`select nama_sistem, base_url, email_smtp, pass_smtp from app_config where status ='1'`)
  const app_config = get_app_config.rows[0]

  const get_user = await knex.raw(` select * from users where email = '${email}' `)

  if(get_user.rows.length>0){
    const users = get_user.rows[0]
    const tanggal_v1 = moment(new Date()).format('YYYY-MM-DD')
    const tanggal_v2 = moment(new Date()).format('ddd') // format hari
    var tgl = SistemHelper.generate_tanggal_indonesia_v1(tanggal_v1);
    var nama_hari = SistemHelper.get_hari(tanggal_v2);
    var tgl_hari_ini = nama_hari+', '+tgl;

    var fileHtml = fs.readFileSync('views/email/template-lupa-password.html','utf8')
    var template = handlebars.compile(fileHtml);
    var replacements = {
        nama_sistem     : app_config.nama_sistem,
        id_user         : users.id,
        name            : users.name,
        username        : users.username,
        email           : users.email,
        url_root        : app_config.base_url+'/reset-password/'+users.id,
        tanggal         : tgl_hari_ini,
    };
    var htmlnya = template(replacements);
    const subjectnya = 'Reset Password | '+app_config.nama_sistem;
    
    let transporter = nodemailer.createTransport(smtpTransport({    
      service: 'gmail',
      host: 'smtp.gmail.com', 
      auth: {        
        user: app_config.email_smtp,        
        pass: app_config.pass_smtp    
      }
    }));

    const mailOptions = {
      from: app_config.email_smtp,
      to: users.email,
      subject: subjectnya,
      html: htmlnya
    };
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Verifikasi Email terkirim ke: '+users.email+' - keterangan : '+ info.response);
      }
    });

    return res.json({
      success : true,
      message : 'Silahkan cek email anda untuk melanjutkan permintaan reset password !',
    })

  }else{
    return res.json({
      success : false,
      message : 'Maaf email anda tidak terdaftar !',
    })
  }
}
exports.resetPassword = async function(req, res) {
    const data                      = req.body;
    const password_baru             = data.password_baru
    const konfirmasi_password_baru  = data.konfirmasi_password_baru
    const id_user                   = data.id_user; 
  
    if(password_baru!=konfirmasi_password_baru){
      return res.json({
        success: false,
        message: "Konfirmasi Passowod Baru Anda Salah !",
      });
    }else{
      bcrypt.hash(konfirmasi_password_baru, 10)
      .then(async hashedPassword => { 
        await User.query().findById(id_user).patch({
          password  : hashedPassword,
          update_at : moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        });
        return res.json({
          success : true,
          message : 'Password Anda Berhasil Diupdate !',
        })
      })
    }
}
exports.update_firebase_token = async function(req, res) {
    const data              = req.body;
    const id_user           = data.id_user;
    const firebase_token    = data.firebase_token
   
    await knex('users')
    .where('id', id_user)
    .update({
        firebase_token  : firebase_token,
        update_at       :  moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    })
    return res.json({
      success : true,
      message : 'Data firebase token berhasil di update !',
    })
};

exports.read_notifikasi = async function(req, res) {
    const data              = req.body;
    const id_notifikasi     = data.id_notifikasi;
    
    await knex('notifikasi')
    .where('id_notifikasi', id_notifikasi)
    .update({
        status  : '2',
        updated_at       :  moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    })
    return res.json({
      success : true,
      message : 'Data notifikasi berhasil di update !',
    })
};

exports.list_notifikasi = async function(req, res) {
    const inputPost     = req.body;
    const id_user_penerima   = inputPost.id_user;

    var pg   = inputPost.pg;
    var keyword   = inputPost.keyword;
    var limit     = inputPost.limit;
    var offset    = (limit * pg) - limit;

    if(keyword==null){
      var keyword = ''
    }

    let raw_query_jml = `
        select count(*) as jml_belum_dibaca from notifikasi n 
        where n.id_user_penerima  = '${id_user_penerima}' and n.status = '1'
    `
    let data_jml = await knex.raw(raw_query_jml)

    let raw_query = `
        select *, 
        (
            select u."name"from users u
            where u.id::varchar = n.id_user_penerima 
        ) nama_user_penerima,
        (
            select u."name"from users u
            where u.id::varchar = n.id_user_pengirim 
        ) nama_user_pengirim
        from notifikasi n
        where id_user_penerima = '${id_user_penerima}'  and concat(keterangan) ilike '%${keyword}%' and n.status in ('1', '2')
    `
    raw_query  += ` order by n.created_at desc`
    raw_query += ` limit ${limit} offset ${offset} `;
    
    let e = await knex.raw(raw_query)


    let exist = e.rows
    if(exist.length >0){
        var datax = []
        for (let index = 0; index < exist.length; index++) {
            const n = exist[index];
            const waktu = await this.date_diff(n.created_at)
            moment.locale("id");
            let waktu_full =  moment(n.created_at).format('DD MMMM YYYY HH:mm');

            let temp = {
                id_notifikasi: n.id_notifikasi,
                keterangan: n.keterangan,
                id_user_penerima: n.id_user_penerima,
                id_unit_penerima: n.id_unit_penerima,
                role_penerima: n.role_penerima,
                nama_user_penerima: n.nama_user_penerima,
                id_user_pengirim: n.id_user_pengirim,
                role_pengirim: n.role_pengirim,
                nama_user_pengirim: (n.nama_user_pengirim) ? n.nama_user_pengirim  : '',
                status: n.status,
                url_web: n.url_web,
                kode_notifikasi: n.kode_notifikasi,
                data_terkait: JSON.parse(n.data_terkait),
                waktu_convert: waktu,
                waktu_full: waktu_full,
                updated_at: n.updated_at,
            }
            datax.push(temp)
        }

        return res.json({
            success : true,
            message : 'Data Notifikasi Ditemukan!',
            jumlah_belum_dibaca : data_jml.rows[0].jml_belum_dibaca,
            data_notifikasi : datax
        })
    }else{
        return res.json({
            success : false,
            message : 'Data Notifikasi Tidak Ditemukan!',
            data_notifikasi: []
        })
    }
};

// kjkdf
date_diff = async function(waktu){
    var tanggal_awal = moment(waktu).format('DD/MM/YYYY HH:mm:ss');
    var tanggal_sekarang = moment(new Date()).format('DD/MM/YYYY HH:mm:ss');

    // //rubah fortmat tanggal ke moment
    var tanggal_awal_moment = moment(tanggal_awal,'DD/MM/YYYY HH:mm:ss');
    var tanggal_sekarang_moment = moment(tanggal_sekarang,'DD/MM/YYYY HH:mm:ss');

    // //mencari selisih per tahun, per bulan dan per hari
    var selisih_tahun = tanggal_sekarang_moment.diff(tanggal_awal_moment,'years');
    var selisih_bulan = tanggal_sekarang_moment.diff(tanggal_awal_moment,'months');
    var selisih_hari = tanggal_sekarang_moment.diff(tanggal_awal_moment,'days');
    var selisih_jam = tanggal_sekarang_moment.diff(tanggal_awal_moment,'hours');
    var selisih_menit = tanggal_sekarang_moment.diff(tanggal_awal_moment,'minutes');
    var selisih_detik = tanggal_sekarang_moment.diff(tanggal_awal_moment,'seconds');

    if((selisih_tahun!="0") || (selisih_bulan!="0")){
        moment.locale("id");
        return moment(waktu).format('DD MMMM YYYY HH:mm');
    }else{
        if(selisih_hari!="0"){
            return selisih_hari+" hari yang lalu";
        }else{
            if(selisih_jam!="0"){
                return selisih_jam+" jam yang lalu";
            }else{
                if(selisih_menit!="0"){
                    return selisih_menit+" menit yang lalu";
                }else{
                    if(selisih_detik!="0"){
                        return selisih_detik+" detik yang lalu";
                    }	
                }
            }
        }
    }
}
exports.send_fcm_notifikasi = async function(req, res){
    var fcm = new FCM(serverKey);

    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: 'fOdxn1LPQnew3_uqnhi6JD:APA91bGPPYkLpG6X-E8EmnZhZ3A1MASsyBmZC4UFOH4aDEkBNbeyGP_A2El11bB2UXeOTYU-DaYDDGcy1dVBYUpdGYCc4s3hqzMiN09tdOdJMK4DWgNnSA6BVdZY5eEPNHF-t3ZkRXxp', 
        
        notification: {
            title: 'Title of your push notification', 
            body: 'Body of your push notification' 
        },
        
        data: {  //you can send only notification or only data(or include both)
            my_key: 'my value',
            my_another_key: 'my another value'
        }
    };
    
    fcm.send(message, function(err, response){
        if (err) {
            console.log('err', err)
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
};
exports.tes_notifikasi = async function(req, res){
    const notifikasi = new NotifikasiController();
    const save_notifikasi = await notifikasi.save_notifikasi({
        keterangan:'Tes Notifikasi',
        id_user_penerima:'id-user-penerima',
        role_penerima:'role-user-penerima',
        id_user_pengirim:'id-user-pengirim',
        role_pengirim:'role-user-pengirim',
        status:'1',
        url_web:'/my-order',
        kode_notifikasi:'NOTIFTES',
        data_terkait:'',
    })
    res.json(save_notifikasi)
};