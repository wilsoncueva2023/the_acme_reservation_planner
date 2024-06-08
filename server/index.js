const { 
  client,
  createTables,
  createCustomer,
  createRestaurant,
  fetchCustomers,
  fetchRestaurants,
  createReservation,
  fetchReservations,
  destroyReservation
} = require('./db');

const express = require('express');
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));

//READ CUSTOMERS
app.get('/api/customers', async(req, res, next) => {
  try {
    res.send(await fetchCustomers());
  } catch (error) {
    next(error)
  };
});

// READ RESTAURANTS
app.get('/api/restaurants', async(req, res, next) => {
  try {
    res.send(await fetchRestaurants());
  } catch (error) {
    next(error)
  };
});

// READ RESERVATIONS
app.get('/api/reservations', async(req, res, next) => {
  try {
    res.send(await fetchReservations());
  } catch (error) {
    next(error)
  };
});

// DESTROY RESERVATION
app.delete('/api/customers/:customer_id/reservations/:id', async( req, res, next) => {
  try {
    await destroyReservation({
      customer_id: req.params.customer_id,
      id: req.params.id
    });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// CREATE RESERVATION
app.post('/api/customers/:customer_id/reservations', async(req, res, next) => {
  try {
    res.sendStatus(201).send(await createReservation({
      customer_id: req.params.customer_id,
      restaurant_id: req.body.restaurant_id,
      party_count: req.body.party_count,
      date: req.body.date
    }))
  } catch (error) {
    next(error)
  };
});

app.use((error, req, res, next) => {
  res.status(res.status || 500).send({ error: error });
});

const init = async () => {
  await client.connect();
  console.log('connected to database');

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));

  await createTables();
  console.log('created tables');

  const [gary, william, buddie, mcdonalds, alinea, san_morello]
  = await Promise.all([
    createCustomer({name: 'gary'}),
    createCustomer({name: 'william'}),
    createCustomer({name: 'buddie'}),
    createRestaurant({name: "McDonald's"}),
    createRestaurant({name: 'Alinea'}),
    createRestaurant({name: 'San Morello'})
  ]);
  console.log("data seeded");

  console.log(await fetchCustomers());
  console.log(await fetchRestaurants());

  const [reservation1, reservation2, reservation3]
  = await Promise.all([
    createReservation({
      customer_id: gary.id,
      restaurant_id: san_morello.id,
      party_count: 3,
      date: "11/11/2024"
    }),
    createReservation({
      customer_id: gary.id,
      restaurant_id: alinea.id,
      party_count: 5,
      date: "12/12/2024"
    }),
    createReservation({
      customer_id: william.id,
      restaurant_id: alinea.id,
      party_count: 2,
      date: "06/13/2024"
    })
  ]);

  // await destroyReservation({id: reservation1.id, customer_id: reservation1.customer_id})
  console.log(await fetchReservations());

  // curl commands
  console.log(`curl -X DELETE localhost:${port}/api/customers/${gary.id}/reservations/${reservation2.id}`);
  console.log(`curl -X POST localhost:${port}/api/customers/${buddie.id}/reservations/ -d '{"restaurant_id":"${mcdonalds.id}", "party_count": 17, "date": "02/15/2025"}' -H "Content-Type:application/json"`);
};

init();