require('dotenv').config();
const bcrypt = require ("bcrypt");
const jwt = require('jsonwebtoken');
var User = require('../models/User');
var UserHasRoles = require('../models/UserHasRoles');
const Log = require('../models/Log');
const knex = require('../../db/knex');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
const handlebars = require('handlebars');
const moment = require("moment");
const fs = require('fs');
const Time = require('../../helpers/time');

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
                var tgl = Time.generate_tanggal_indonesia_v1(tanggal_verifikasi);
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
  const get_app_config = await knex.raw(`select * from config where active=true`)
  const app_config = get_app_config.rows[0]

  const get_user = await knex.raw(` select * from users where email = '${email}' `)

  if(get_user.rows.length>0){
    const users = get_user.rows[0]
    const tanggal_v1 = moment(new Date()).format('YYYY-MM-DD')
    const tanggal_v2 = moment(new Date()).format('ddd') // format hari
    var tgl = Time.generate_tanggal_indonesia_v1(tanggal_v1);
    var nama_hari = Time.get_hari(tanggal_v2);
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
