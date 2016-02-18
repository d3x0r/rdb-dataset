
var optiondb = DataSet();
optiondb.Table( "option_name" );
var col = optiondb.option_name.Column( { type: "guid" } );
var namecol = optiondb.option_name.Column( { name : "option_name", type: "string" } )
optiondb.option_name.primaryKey = col;
optiondb.option_name.uniqueKey = namecol;


optiondb.Table( "option_map" );
var idcol = optiondb.option_map.Column( { name : "option_id", type : "guid" } );
var nameidx = optiondb.option_map.Column( { name : "option_name_id", type : "guid" ) );
var parentidcol = optiondb.option_map.Column( { name : "parent_option_id", type : "guid" } );
optiondb.option_map.index = nameidx;
optiondb.option_map.primaryKey = idcol;

optiondb.ForeignKey( optiondb.option_map, ["parent_option_id"],  optiondb.option_map, ["option_id"] );
optiondb.ForeignKey( optiondb.option_name, ["option_name_id"], optiondb.option_map, ["option_name_id"] );


optiondb.Table( "option_value" );
optiondb.option_value.Column( { name : "option_id", type: "guid" } );
optiondb.option_value.Column( { name : "number", type: "int" } );
optiondb.option_value.index = optiondb.option_value.option_id;
optiondb.ForeignKey( optiondb.option_map, ["option_id"], optiondb.option_value, ["option_id"] );



optiondb.prototype.getValue = function( path, default ) { 
	var option_path = path.split( '/' );
        
}
