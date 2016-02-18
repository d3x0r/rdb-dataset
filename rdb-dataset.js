"use strict";

	function singularize( string ) {
		if( string.endsWith( "ies" ) )
        		return string.substr( 0, string.length-3 ) + "y";
		//if( string.endsWith( "es" ) )
        	//	return string.substr( 0, string.length-1 );
		if( string.endsWith( "s" ) )
        		return string.substr( 0, string.length-1 );
		return string;
	}

exports.Table = function ( tableName ) {
	var tableObject = {
    	name : tableName
		, columns : []
        , rows: []
        , rowProto : {}
        , Row : ( data ) => { var newRow = { data:data } }
		, flags : { temporary : false, ifNotExist : false }
		, keys : []
		, constraints : []
		, Column : ( def ) => {
        	if( !def.hasOwnProperty( "name" ) )
                	def.name = singularize( tableObject.name ) + "_id";
                var newCol = { name : def.name
					,type : def.type
					, extra : def.extra
					 ,default : null };
				//Object.defineProperty( newRow, col.name
				//		, { get : function() } );
				tableObject.columns.push( newCol );
                return newCol;
        }
    }
    return tableObject;
}




exports.Set = (prefix) => {
	var ds = {
        	prefix : prefix||""
			, tables : []
        	, addTable : ( tableName )=>{ tables.push( Table( tableName ) ); }
	        , Table : function( name ) {
        		var table = Table( name );
	        	ds.tables.push( table );
        	        if( !ds.hasOwnProperty( name ) )
	        	        Object.definePrototype( ds, name, {value : table } );

	                return table;
                }
        }

        ds.prototype.Persist = function( db ) {
        	var sql = "select * from sqlite_master";
                db.executeSql( sql, read );
			}
}



//--------------------------------------------------------
//  parsing routines for CREATE TABLE statements
//--------------------------------------------------------

function Key() {
	return {
		flags : { primary : false, unique : false }
		, name : ""
		, colnames : []
	}
}

function Constraint() {
	return {
		flags : {
			 cascade_on_delete : false,
			 cascade_on_update : false,
			 restrict_on_delete : false,
			 restrict_on_update : false,
			 noaction_on_delete : false,
			 noaction_on_update : false,
			 setnull_on_delete : false,
			 setnull_on_update : false,
			 setdefault_on_delete : false,
			 setdefault_on_update : false
		}
		, name : ""
		, colnames : []
		, references : null
		, foriegn_colnames : []
	}
}


function SegDuplicate(seg) {
	var t = Text();
	t.spaces = seg.spaces;
	t.tabs = seg.tabs;
	t.text = seg.text;
	return t;
}

function Next( wordref ) {
	if( wordref.word ) return wordref.word.next;
	return null;
}
function SegAppend( _this, that ) { if( _this === null ) return that; return _this.append( that ); }


function ValidateCreateTable( wordref ) {
	if( wordref.word.text.toLowerCase() !== ( "create" ) ) return false;

	wordref.word = Next( wordref );
   	if( wordref.word.text.toLowerCase() === ( "temporary" ) ) wordref.word = Next( wordref );
   	else if( wordref.word.text.toLowerCase() === ( "temp" ) ) wordref.word = Next( wordref );

	if( wordref.word.text.toLowerCase() !== ( "table" ) ) return false;

	wordref.word = Next( wordref );
	if( wordref.word.text.toLowerCase() === ( "if" ) ) {
		wordref.word = Next( wordref );
		if( wordref.word.text.toLowerCase() === ( "not" ) ) {
			wordref.word = Next( wordref );
			if( wordref.word.text.toLowerCase() === ( "exists" ) )
				wordref.word = Next( wordref );
			else
				return false;
		}
		else
			return false;
	}
   	return true;
}

//----------------------------------------------------------------------

function GrabName(  wordref ) {
	var result = { name : "", quoted : false };
	var name = null;
	//PTEXT start = (*word);
   	//printf( ( "word is %s" ), GetText( *word ) );
	if( wordref.word.text === ( "`" ) )
	{
		let phrase = null;
		result.quoted = true;
		wordref.word = Next( wordref );
		while( wordref.word.text !== '`' )
		{
			phrase = SegAppend( phrase, SegDuplicate(wordref.word) );
			wordref.word = Next( wordref );
		}
      	// skip one more - end after the last `
		wordref.word = Next( wordref );
		if( wordref.word.text === '.' )
		{
			wordref.word = Next( wordref );
         	phrase = null;
			if( wordref.word.text === "`"  )
			{
				wordref.word = Next( wordref );
				while( wordref.word.text !== '`' )
				{
					phrase = SegAppend( phrase, SegDuplicate(wordref.word) );
					wordref.word = Next( wordref );
				}
				wordref.word = Next( wordref );
			}
			else
			{
				phrase = SegAppend( phrase, SegDuplicate(wordref.word));
				wordref.word = Next( wordref );
			}
		}
		name = String( phrase );
	}
	else
	{
		// don't know...
		let next =  Next( wordref ) && Next( wordref ).text;
		if( next && next === '.' )
		{
			// database and table name...
			wordref.word = Next( wordref );
			wordref.word = Next( wordref );
			name = wordref.word.text;
			wordref.word = Next( wordref );
		}
		else
		{
			name = wordref.word.text;
			wordref.word = Next( wordref );
		}
	}
	if( name ) {
		result.name = name;
		return result;
	}
	return null;
}

//----------------------------------------------------------------------

function GrabType( wordref )
{
	if( (wordref.word ) )
	{
		//int quote = 0;
		//int escape = 0;
		var type = SegDuplicate(wordref.word);
		type.spaces = 0;
		type.tabs = 0;
		wordref.word = Next( wordref );

		if( type.text.toLowerCase() === ( "unsigned" ) )
		{
			type = SegAppend( type, SegDuplicate(wordref.word) );
         	wordref.word = Next( wordref );
		}
		if( wordref.word.text === '(' )
		{
			while( wordref.word.text !== ')' )
			{
				type = SegAppend( type, SegDuplicate(wordref.word ) );
				wordref.word = Next( wordref );
			}
			type = SegAppend( type, SegDuplicate( wordref.word ) );
			wordref.word = Next( wordref );
		}
		while( type && type.pred ) type = type.pred;
		return String( type );
	}
	return null;
}

//----------------------------------------------------------------------

function GrabExtra( wordref )
{
	if( wordref.word )
	{
		var type = null;

		while( (wordref.word) && ( ( wordref.word.text !== ',' ) && (wordref.word.text !== ')' ) ) )
		{
			if( wordref.word.text === ')' )
				break;
			type = SegAppend( type, SegDuplicate( wordref.word ) );
			wordref.word = Next( wordref );
		}

		if( type )
		{
			while( type && type.pred ) type = type.pred;
			type.spaces = 0;
			type.tabs = 0;
			return String( type )
		}
	}
   	return null;
}

function GrabKeyColumns( wordref, columns )
{
	if( wordref.word.text === '(' )
	{
		do
		{
			wordref.word = Next( wordref );
			columns.push( GrabName( wordref ).name );
		}
		while( wordref.word.text !== ')' );
		wordref.word = Next( wordref );
	}
}

//----------------------------------------------------------------------
function AddConstraint( table, wordref )
{
	var tmpname = GrabName( word ).name;
	if( wordref.word.text.toUpperCase() === ( "UNIQUE" ) )
	{
		wordref.word = Next( wordref );
		var key;
		table.keys.push( key = Key() );
		key.flags.unique = true;
		GrabKeyColumns( wordref, key.colnames );
		if( wordref.word.text.toUpperCase() === ( "ON" ) )
		{
			wordref.word = Next( wordref );
			if( wordref.word.text.toUpperCase() ===  ("CONFLICT" ) )
			{
				wordref.word = Next( wordref );
				if( wordref.word.text.toUpperCase() === ( "REPLACE" ) )
				{
					wordref.word = Next( wordref );
				}
			}
		}
		return;
	}

	var constraint;
	table.constraints.push( constraint = Constraint() );
	if( wordref.word.text.toUpperCase() === ( "UNIQUE" ) )
	{
		wordref.word = Next( wordref );
	}
	else if( wordref.word.text.toUpperCase() === ( "FOREIGN" ) )
	{
		wordref.word = Next( wordref );
		if( wordref.word.text.toUpperCase() === ( "KEY" ) )
		{
			// next word is the type, skip that word too....
			wordref.word = Next( wordref );
		}
	}
	GrabKeyColumns( word, constraint.colnames );
	if( wordref.word.text.toUpperCase() === ( "REFERENCES" ) )
	{
		wordref.word = Next( wordref );
		constraint.references = GrabName( wordref ).name;
		GrabKeyColumns( word, constraint.foreign_colanmes );
	}

	while( wordref.word.text.toUpperCase() === ( "ON" ) )
	{
		wordref.word = Next( wordref );
		if( wordref.word.text.toUpperCase() === ( "DELETE" ) )
		{
			wordref.word = Next( wordref );
			if( wordref.word.text.toUpperCase() === ( "CASCADE" ) )
			{
				constraint.flags.cascade_on_delete = true;
				wordref.word = Next( wordref );
			}
			else if( wordref.word.text.toUpperCase() === ( "RESTRICT" ) )
			{
				constraint.flags.restrict_on_delete = true;
				wordref.word = Next( wordref );
			}
			else if( wordref.word.text.toUpperCase() === ( "NO" ) )
			{
				wordref.word = Next( wordref );
				if( wordref.word.text.toUpperCase() === ( "ACTION" ) )
				{
					constraint.flags.noaction_on_delete = true;
					wordref.word = Next( wordref );
				}
			}
			if( wordref.word.text.toUpperCase() === ( "SET" ) )
			{
				wordref.word = Next( wordref );
				if( wordref.word.text.toUpperCase() === ( "NULL" ) )
				{
					constraint.flags.setnull_on_delete = true;
					wordref.word = Next( wordref );
				}
				else if( wordref.word.text.toUpperCase() === ( "DEFAULT" ) )
				{
					constraint.flags.setdefault_on_delete = true;
					wordref.word = Next( wordref );
				}
			}
		}
		if( wordref.word.text.toUpperCase() === ( "UPDATE" ) )
		{
			wordref.word = Next( wordref );
			if( wordref.word.text.toUpperCase() === ( "CASCADE" ) )
			{
				constraint.cascade_on_update = true;
				wordref.word = Next( wordref );
			}
			else if( wordref.word.text.toUpperCase() === ( "RESTRICT" ) )
			{
				constraint.restrict_on_update = true;
				wordref.word = Next( wordref );
			}
			else if( wordref.word.text.toUpperCase() === ( "NO" ) )
			{
				wordref.word = Next( wordref );
				if( wordref.word.text.toUpperCase() === ( "ACTION" ) )
				{
					constraint.noaction_on_update = true;
					wordref.word = Next( wordref );
				}
			}
			else if( wordref.word.text.toUpperCase() === ( "SET" ) )
			{
				wordref.word = Next( wordref );
				if( wordref.word.text.toUpperCase() === ( "NULL" ) )
				{
					constraint.flags.setnull_on_update = true;
					wordref.word = Next( wordref );
				}
				else if( wordref.word.text.toUpperCase() === ( "DEFAULT" ) )
				{
					constraint.flags.setdefault_on_update = true;
					wordref.word = Next( wordref );
				}
			}
		}
	}
}

function AddIndexKey(  table, wordref , has_name, primary, unique )
{
	var key;
	table.keys.push( key = Key() );

	key.flags.bPrimary = primary;
	key.flags.bUnique = unique;
	if( has_name )
		key.name = GrabName( wordref ).name;
	else
		key.name = null;
	if( wordref.word.text.toUpperCase()===( "USING" ) )
	{
		wordref.word = Next( wordref );
		// next word is the type, skip that word too....
		wordref.word = Next( wordref );
	}
	GrabKeyColumns( wordref, key.colnames );
   	// using can be after the columns also...
	if( wordref.word.text.toUpperCase()===( "USING" ) )
	{
		wordref.word = Next( wordref );
		// next word is the type, skip that word too....
		wordref.word = Next( wordref );
	}
}

//----------------------------------------------------------------------

function GetTableColumns( table, wordref )
{
	if( !wordref.word )
		return false;

	if( wordref.word.text !== '(' )
	{
		throw new Error( "Failed to find columns... extra data between table name and columns...." );
		return false;
	}
	while( wordref.word.text !== ')' )
	{
		var name;
		var type;
		var extra;
		wordref.word = Next( wordref );

		//if( (*word) && GetText( *word )[0] == ',' )
		//	wordref.word = Next( wordref );
		if( !( name = GrabName( wordref ).name ) )
		{
			throw new Error( "Failed column parsing..." );
		}
		else
		{
			if( !name.quoted )
			{
				if( name.toUpperCase() === ( "PRIMARY" ) )
				{
					if( wordref.word.text.toUpperCase() === ( "KEY" ) )
					{
						wordref.word = Next( wordref );
						if( wordref.word.text.toUpperCase() === ( "USING" ) )
						{
							wordref.word = Next( wordref );
							// next word is the type, skip that word too....
							wordref.word = Next( wordref );
						}
						AddIndexKey( table, wordref, false, true, false );
					}
					else
					{
						throw new Error( "PRIMARY keyword without KEY keyword is invalid." );
					}
				}
				else if( name.toUpperCase() === ( "UNIQUE" ) )
				{
					if( ( wordref.word.text.toUpperCase() === ( "KEY" ) )
						|| ( wordref.word.text.toUpperCase() === ( "INDEX" ) ) )
					{
						// skip this word.
						wordref.word = Next( wordref );
					}
					AddIndexKey( table, wordref, true, false, true );
				}
				else if( name.toUpperCase() === ( "CONSTRAINT" ) )
				{
					//lprintf( "Skipping constraint parsing" );
					AddConstraint( table, wordref );
				}
				else if( ( ( name.toUpperCase() ===  ( "INDEX" ) ) )
					   || ( ( name.toUpperCase() ===  ( "KEY" ) ) ) )
				{
					AddIndexKey( table, wordref, true, false, false );
				}
				else
				{
					type = GrabType( wordref );
					extra = GrabExtra( wordref );
					table.Column( {name:name, type:type, extra:extra } );
				}
			}
			else
			{
				type = GrabType( word );
				extra = GrabExtra( wordref );
				table.Column( {name:name, type:type, extra:extra }  );
			}
		}
		if( !wordref.word )
			throw new Error( "Unexpected end of text while reading column definitions." );
		if( wordref.word.text != ',' && wordref.word.text != ')' )
			throw new Error( "Unexpected character while reading column defnitions: " + wordref.word.text );
	}
	return true;
}

//----------------------------------------------------------------------

function GetTableExtra( table, wordref )
{
   return true;
}

function LogTable( table )
{
	{
		/*
		var out = "";
		if( table )
		{
			int n;
			( out += ( "\n" ) );
			( out += ( "//--------------------------------------------------------------------------\n" ) );
			( out += ( "// "+table.name+" \n" ) );
			( out += ( "// Total number of fields = "+table.columns.length+"\n" ) );
			( out += ( "// Total number of keys = "+table.keys.length+"\n" )  );
			( out += ( "//--------------------------------------------------------------------------\n" ) );
			( out += ( "\n" ) );
			( out += ( "FIELD %s_fields[] = {\n" ), table->name );
			for( n = 0; n < table->fields.count; n++ )
				fprintf( out, ( "\t%s{%s%s%s, %s%s%s, %s%s%s }\n" )
					, n?( ", " ):( "" )
					, table->fields.field[n].name?("\""):( "" )
					, table->fields.field[n].name?table->fields.field[n].name:( "NULL" )
					, table->fields.field[n].name?("\""):( "" )
					, table->fields.field[n].type?("\""):( "" )
					, table->fields.field[n].type?table->fields.field[n].type:( "NULL" )
					, table->fields.field[n].type?("\""):( "" )
					, table->fields.field[n].extra?("\""):( "" )
					, table->fields.field[n].extra?table->fields.field[n].extra:( "NULL" )
					, table->fields.field[n].extra?("\""):( "" )
				);
			fprintf( out, ( "};\n" ) );
			fprintf( out, ( "\n" ) );
			if( table->keys.count )
			{
				fprintf( out, ( "DB_KEY_DEF %s_keys[] = { \n" ), table->name );
				for( n = 0; n < table->keys.count; n++ )
				{
					int m;
					fprintf( out, ( "#ifdef __cplusplus\n" ) );
					fprintf( out, ("\t%srequired_key_def( %d, %d, %s%s%s, \"%s\" )\n")
							 , n?", ":""
							 , table->keys.key[n].flags.bPrimary
							 , table->keys.key[n].flags.bUnique
							 , table->keys.key[n].name?("\""):(""  )
							 , table->keys.key[n].name?table->keys.key[n].name:("NULL")
							 , table->keys.key[n].name?("\""):("")
							 , table->keys.key[n].colnames[0] );
					if( table->keys.key[n].colnames[1] )
						fprintf( out, ( ", ... columns are short this is an error.\n" ) );
					fprintf( out, ( "#else\n" ) );
					fprintf( out, ( "\t%s{ {%d,%d}, %s%s%s, { " )
							 , n?( ", " ):( "" )
							 , table->keys.key[n].flags.bPrimary
							 , table->keys.key[n].flags.bUnique
							 , table->keys.key[n].name?("\""):( "" )
							 , table->keys.key[n].name?table->keys.key[n].name:( "NULL" )
							 , table->keys.key[n].name?("\""):( "" )
							 );
					for( m = 0; table->keys.key[n].colnames[m]; m++ )
						fprintf( out, ("%s\"%s\"")
								 , m?( ", " ):( "" )
								 , table->keys.key[n].colnames[m] );
					fprintf( out, ( " } }\n" ) );
					fprintf( out, ( "#endif\n" ) );
				}
				fprintf( out, ( "};\n" ) );
				fprintf( out, ( "\n" ) );
			}
			fprintf( out, ( "\n" ) );
			fprintf( out, ("TABLE %s = { \"%s\" \n"), table->name, table->name );
			fprintf( out, ( "	 , FIELDS( %s_fields )\n" ), table->name );
         if( table->keys.count )
				fprintf( out, ( "	 , TABLE_KEYS( %s_keys )\n" ), table->name );
         else
				fprintf( out, ( "	 , { 0, NULL }\n" ) );
			fprintf( out, ( "	, { 0 }\n" ) );
			fprintf( out, ( "	, NULL\n" ) );
			fprintf( out, ( "	, NULL\n" ) );
			fprintf( out, ( "	,NULL\n" ) );
			fprintf( out, ( "};\n" ) );
			fprintf( out, ( "\n" ) );
		}
		else
		{
			fprintf( out, ( "//--------------------------------------------------------------------------\n" ) );
			fprintf( out, ( "// No Table\n" ) );
			fprintf( out, ( "//--------------------------------------------------------------------------\n" ) );
		}
		*/
	}
}

//----------------------------------------------------------------------

// In this final implementation - it was decided that for a general
// library, that expressions, escapes of expressions, apostrophes
// were of no consequence, and without expressions, there is no excess
// so this simply is text stream in, text stream out.

// these are just shortcuts - these bits of code were used repeatedly....


//static CTEXTSTR normal_punctuation=("\'\"\\({[<>]}):@%/,;!?=*&$^~#`");
//static CTEXTSTR not_punctuation;

function textString( self ) { 	if( self )
        	return   "\t".repeat(self.tabs) + " ".repeat(self.spaces) + self.text
                       + (self.next?textString( self.next ):""); else return ""; }


function Text( def ) {
	var text= {tabs:0, spaces:0, flags:0, text:def||"", next: null
        	, pred: null
        	, append : (seg)=>{
				  //if( text.next ) seg.next = text.next;
				 if( seg ) { seg.pred = text; text.next = seg; } return seg; }
        	, toString : ()=>{ var t = text;
				while( t && t.pred ) t = t.pred;
				return textString( t ); }
        };
	return text;
}



function TextParse( input, punctuation, filter_space, bTabs, bSpaces )
// returns a TEXT list of parsed data
{
	if (!input)        // if nothing new to process- return nothing processed.
		return null;
	if( typeof( input ) === 'string' )
		input = Text( input );
	var out = { collect: Text()
	          , getText:()=>{
				  if( out.collect.tabs===0 && out.collect.spaces===0 && out.collect.text==="" )
			 		return null;
					var tmp = out.collect; out.collect = Text(); return tmp; } };
	var outdata= null,
	      word;
	var has_minus = -1;
	var has_plus = -1;

	var index;
	var codePoint;

	var elipses = false;
	var spaces = 0;
	var tabs = 0;

	function SET_SPACES( word ) {
		//if( word ) {
		word.tabs = tabs;
		word.spaces = spaces;
		tabs = 0;
		spaces = 0;
		//}
		return word;
	}

	function collapse() {
		if( out.collect.text.length > 0 ) {
			outdata = SegAppend( ooutdata, SET_SPACES( out.getText() ) );
		}
	}
	function defaultChar() {
		if( elipses )
		{
			if( ( word = out.getText() ) )
				outdata = SegAppend( outdata, SET_SPACES( word ) );
			elipses = FALSE;
		}
		out.collect.text += character;
	}


	while( input )
	{
		//Log1( ("Assuming %d spaces... "), spaces );
		for (index=0;(codePoint = input.text.codePointAt( index )),
                   (index < input.text.length); index++) // while not at the
                                         // end of the line.
		{
			var character = String.fromCodePoint( codePoint );
			if( codePoint > 0xFFFF ) index++;

			if( elipses && character != '.' )
			{
				outdata = SegAppend( outdata, SET_SPACES( out.getText() ) );
				elipses = false;
			}
			else if( elipses ) // elipses and character is . - continue
			{
				out.collect.text += character;
				continue;
			}
			if( filter_space.includes( character ) )
			{
				if( ( word = out.getText() ) )
				{
					outdata = SegAppend( outdata, SET_SPACES( word ) );
				}
				spaces++;
			}
			else if( punctuation.includes( character ) )
			{
				if( ( word = out.getText() ) )
				{
					outdata = SegAppend( outdata, SET_SPACES( word ) );
					out.collect.text += character;
					outdata = SegAppend( outdata, out.getText() );
				}
				else
				{
					out.collect.text += character;
					outdata = SegAppend( outdata, SET_SPACES( out.getText() ) );
				}
			}
			else switch(character)
			{
			case '\n':
				if( ( word = out.getText() ) )
				{
					outdata = SegAppend( outdata, SET_SPACES( word ) );
				}
				outdata = SegAppend( outdata, SegCreate( 0 ) ); // add a line-break packet
				break;
			case ' ':
				collapse();
				spaces++;
				break;
			case '\t':
				if( bTabs )
				{
					if( ( word = out.getText() ) )
					{
						outdata = SegAppend( outdata, SET_SPACES( word ) );
					}
					if( spaces )
					{
						//lprintf( ("Input stream has mangled spaces and tabs.") );
						spaces = 0; // assume that the tab takes care of appropriate spacing
					}
					tabs++;
				}
				else {
					defaultChar();
				}
				break;
			case '\r': // a space space character...
				if( ( word = out.getText() ) )
				{
					outdata = SegAppend( outdata, SET_SPACES( word ) );
				}
				break;
			case '.': // handle multiple periods grouped (elipses)
				//goto NormalPunctuation;
				{
					let c;
					if( ( !elipses &&
						  ( c = NextChar() ) &&
						  ( c == '.' ) ) )
					{
						if( ( word = out.getText() ) )
						{
							outdata = SegAppend( outdata, SET_SPACES( word ) );
						}
						out.collect.text += '.';
						elipses = TRUE;
						break;
					}
					if( ( c = NextChar() ) &&
						( c >= '0' && c <= '9' ) )
					{
						// gather together as a floating point number...
						out.collect.text += character;
						break;
					}
				}
			case '-':  // work seperations flaming-long-sword
				if( has_minus == -1 )
					if( !punctuation || punctuation.includes( '-' ) )
						has_minus = 1;
					else
						has_minus = 0;
				if( !has_minus )
				{
					out.collect.text += '-';
					break;
				}
			case '+':
				{
					let c;
					if( has_plus == -1 )
						if( !punctuation || punctuation.includes ( '-' ) )
							has_plus = 1;
						else
							has_plus = 0;
					if( !has_plus )
					{
						out.collect.text += '-';
						break;
					}
					if( ( c = NextChar() ) &&
						( c >= '0' && c <= '9' ) )
					{
						if( ( word = out.getText() ) )
						{
							outdata = SegAppend( outdata, SET_SPACES( word ) );
							// gather together as a sign indication on a number.
						}
						out.collect.text += character;
						break;
					}
				}
//			NormalPunctuation:
				if( ( word = out.getText() ) )
				{
					outdata = SegAppend( outdata, SET_SPACES( word ) );
					out.collect.text += character;
					word = out.getText();
					outdata = SegAppend( outdata, word );
				}
				else
				{
					out.collect.text += character;
					word = out.getText();
					outdata = SegAppend( outdata, SET_SPACES( word ) );
				}
				break;
			default:
				defaultChar();
				break;
			}
		}
		input=input.next;
	}

	if( ( word = out.getText() ) ) // any generic outstanding data?
	{
		outdata = SegAppend( outdata, SET_SPACES( word ) );
	}

	while( outdata.pred ) outdata = outdata.pred;
	return(outdata);
}



exports.GetTableFromSQL = function( cmd ) {
	var tmp;
	var pParsed;
	var pWord;
	var pTable = exports.Table();

	var tmp = Text( cmd);

	// if a delimieter need to be considered more like spaces...
	tmp.text = tmp.text.replace( /\n/g, ' ' );

	pParsed = TextParse( tmp, "\'\"\\({[<>]}):@%/,;!?=*&$^~#`", " \t\n\r", true, true );
	{
		var wordref = { word : pParsed };

		if( ValidateCreateTable( wordref ) )
		{
			if( !(pTable.name = GrabName( wordref ).name ) )
				pTable = null;
			else
				if( !GetTableColumns( pTable, wordref ) )
					pTable = null;
				else
					GetTableExtra( pTable, wordref );
		}
		else
			pTable = null;
	}
	return pTable;
}
