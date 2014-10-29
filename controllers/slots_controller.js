var slots = require('../models/slots');

exports.available = function(req, res, next){
  var q = req.query;
  if( (q.loc !== null && q.loc !== undefined) && 
      (q.loc.lat !== undefined && q.loc.lat !== null) &&
      (q.loc.lng !== undefined && q.loc.lng !== null) &&
      (q.duration !== undefined && q.duration !== null) &&
      (q.start_date !== undefined && q.start_date !== null) &&
      (q.end_date !== undefined && q.end_date !== null)){
    
      res.setHeader('content-type', 'application/json');
      slots.geolocated_for_range(req, res, next);
  }
  else{
    res.responseCode(422); //unprocessable entity
    res.end();
  }
}