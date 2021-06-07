
exports.get_task = async function(req, res, next) {
    try{        
        const cek_user = await knex.raw(`
            select * from tasks t 
        `);
        console.log(cek_user)
        // const jumlah_data = parseInt(cek_user.rows.length)
        // if(jumlah_data==0){
        //     res.status(200).json({
        //         success:false,
        //         message:"Data tidak ditemukan",
        //     });
        // }else{
        //     res.status(200).json({
        //         success:true,
        //         message:"Data ditemukan",
        //         data:cek_user.rows,
        //     });
        // }
    } catch (err){
        console.log(err)
        return res.status(500).json({ msg: 'Internal server error' });
    }
};