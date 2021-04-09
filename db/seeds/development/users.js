exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {username: 'faiz', email: 'faizmuhammad810@gmail.com'},
        {username: 'yon', email: 'yon@gmail.com'},
        {username: 'ilham', email: 'ilham@gmail.com'}
      ]);
    });
};
