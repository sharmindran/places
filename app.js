const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const server = express();
const path = require('path');
const cors = require('cors');
const Place = require('./Place');

const port = process.env.PORT || 5000;

// const newPlace = Place({
//   name: 'kereta5',
//   address: 'Sungai Ara',
//   photo_reference: 'just an url'
// });

// newPlace
//   .save()
//   .then(doc => {
//     console.log('newPlace.save ok: ', doc);
//   })
//   .catch(error => {
//     console.log('newPlace.save error: ', error);
//   });

server.use(cors());
server.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

server.use(bodyParser.urlencoded({ extended: true })); //traversy false
server.use(bodyParser.json());

const PLACES_API_KEY = 'AIzaSyDNaDA2jI66z3dv_VGSuWCnbHgoksQd9No';
var filteredResults;

server.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'production') {
  server.use(express.static('client/build'));
  server.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// server.get('/', (req, res) => {
//   res.render('home.hbs');
// });

// server.get('/form', (req, res) => {
//   res.render('form.hbs');
// });

server.post('/getplaces', (req, res) => {
  const addr = req.body.address;
  const placetype = req.body.placetype;
  const name = req.body.name;

  const locationReq = `https://maps.googleapis.com/maps/api/geocode/json?address=${addr}&key=AIzaSyCGCxQf4yOMG9yCsqQ9CzHKjUcs14fqDY4`;
  axios
    .get(locationReq)
    .then(response => {
      const locationData = {
        addr: response.data.results[0].formatted_address,
        lat: response.data.results[0].geometry.location.lat,
        lng: response.data.results[0].geometry.location.lng
      };

      const placesReq = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
        locationData.lat
      },${
        locationData.lng
      }&radius=1500&types=${placetype}&name=${name}&key=${PLACES_API_KEY}`;

      return axios.get(placesReq);
    })
    .then(response => {
      filteredResults = extractData(response.data.results);
      Place.insertMany(filteredResults)
        .then(result => {
          res.status(200).send(result);
        })
        .catch(error => {
          res.status(400).send(error);
        });
    })
    .catch(error => {
      console.log(error);
    });
});

const saveData = dataArray => {
  const length = dataArray.length;
  for (var i = 0; i < length; i++) {}
};

server.post('/historical', (req, res) => {
  Place.find({})
    .then(result => {
      res.status(200).send(result);
    })
    .catch(error => {
      res.status(400).send(error);
    });
});

server.post('/delete', (req, res) => {
  Place.remove({})
    .then(result => {
      res.status(200).send(result);
    })
    .catch(error => {
      res.status(400).send(error);
    });
});

const extractData = originalResults => {
  var placesObj = {
    table: []
  };

  const length = originalResults.length;

  for (var i = 0; i < length; i++) {
    if (originalResults[i].photos) {
      const photoRef = originalResults[i].photos[0].photo_reference;
      const requestUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${PLACES_API_KEY}`;

      tempObj = {
        name: originalResults[i].name,
        address: originalResults[i].vicinity,
        photo_reference: requestUrl
      };
    } else {
      tempObj = {
        name: originalResults[i].name,
        address: originalResults[i].vicinity,
        photo_reference: '/image_not_found.jpg'
      };
    }

    placesObj.table.push(tempObj);
  }

  return placesObj.table;
};

//--- experimental ---
// server.post('/findone', (req, res) => {
//   Model.findOne({ name: req.body.name }).then(result => {
//     if (result) {
//       return res.status(200).json({ name: result.name });
//     } else {
//       const newData = new Model({
//         name: req.body.name,
//         address: req.body.address,
//         photo_reference: req.body.photo_reference
//       });

//       newData
//         .save()
//         .then(result => {
//           return res.json(result);
//         })
//         .catch(error => {
//           console.log('mongoose error saving new data: ', error);
//         });
//     }
//   });
// });

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
