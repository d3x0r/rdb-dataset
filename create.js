
var rdb = require( "./rdb-dataset.js" );
var db = rdb.DataSet();

table = rdb.GetTableFromSQL( "CREATE TABLE `option2_exception` (\n\
  `option_exception_id` int(11) NOT NULL auto_increment,\n\
  `apply_from` datetime default '0000-00-00 00:00:00',\n\
  `apply_until` datetime default '0000-00-00 00:00:00',\n\
  `system_id` int(11) NOT NULL default '0',\n\
  `override_value_id` int(11) NOT NULL default '0',\n\
  `option_id` int(11) NOT NULL default '0',\n\
  UNIQUE KEY oek (`option_exception_id`)\n\
  );\n" )
db.push( table );

console.log( table );


var sql = "CREATE TABLE `option2_map` ( \
  `option_id` int(11) NOT NULL auto_increment,\n \
  `parent_option_id` int(11) NOT NULL default '0',\n \
  `name_id` int(11) NOT NULL default '0',\n \
  `description` tinytext,\n \
  UNIQUE KEY ok (`option_id`)\n \
 ) COMMENT='Table ID defines ID for use in OptionValues';\n";

table = rdb.GetTableFromSQL( sql );
db.push( table );

console.log( table );

