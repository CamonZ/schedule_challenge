var _ = require('underscore')

function blocksForCleanersWithinRangeQuery(){
  //assuming the distance is just a couple of km so a flat earth model works 
  var sql = 'SELECT cleaners.id, cleaner_blocks_availability.* FROM cleaners, cleaner_blocks_availability ' + 
      //halversin formula. 1.609344 is km to 1 mile
      'WHERE 1.609344 * 3956 * 2 * ASIN(SQRT( POWER(SIN((X(cleaners.location) - ?) *  pi()/180 / 2), 2) '+
      '+ COS(X(cleaners.location) * pi()/180) * COS(? * pi()/180) * POWER(SIN((Y(cleaners.location) - ?) '+
      '* pi()/180 / 2), 2) )) <= cleaners.operation_radius ' +
      'AND cleaner_blocks_availability.max_available_time_chunk >= ? ' +
      'AND cleaner_blocks_availability.date BETWEEN ? AND ? ' +
      'AND cleaners.id = cleaner_blocks_availability.cleaner_id';
}

function expandTimeBlockInSlots(block, duration){
  
  var millisDuration = duration * 60000; //60s * 1000ms / s
  var millisHalfHour = 30 * 60000;
  var slots = [];
  var timeStamp = new Date(block.date + ' ' + block.chunk_start_time);
  var endDateTime = new Date(block.date + ' ' + block.block_end_time);


  //let's step every 30 mins and add a new slot.
  while((endDateTime.getTime() - timeStamp.getTime()) > millisDuration){
    slots.push({start_time: timeStamp.getHours() + ':' + timeStamp.getMinutes(), block_id: block.id });
    timeStamp.setTime(timeStamp.getTime() + millisHalfHour);
  }
  return slots;
}


exports.geolocated_for_range = function(req, res, next){
  req.getConnection(function(err, connection){
    if(err) next(err);
    
    var q = req.query;

    connection.query(
      blocksForCleanersWithinRangeQuery(), 
      [
        q.loc.lat, 
        q.loc.lat, 
        q.loc.lng, 
        q.duration, 
        q.start_date, 
        q.end_date
      ], 
      function(err, results){
        if(err) next(err);
        var slots = {};
        var groupedBlocks = _.groupBy(results, 'date');

        _.each(groupedBlocks, function(date, blocks){
          slots[date] = [];
          
          _.each(blocks, function(block){
            if(block.max_available_time_chunk > q.duration){
              _.each(expandTimeBlockInSlots(block, q.duration), function(slot){ slots[date].push(slot); });

            }
            else{ slots.push({start_time: block.chunk_start_time, block_id: block.id })}
          });
          //uniq the array to have just 1st slot for all the blocks for a given start time.
          slots[date] = _.uniq(slots[date], false, function(slot){ return slot.start_time; });
        });
        res.json(slots);
      });
  });
}