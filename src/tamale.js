var Tamale = Tamale || {};

//init
(function ($) {

	var classes = {};
	Tamale.name = "Tamale";

	//private utility methods
	function isObject (val) {
		return Object.prototype.toString(val) === '[object Object]';
	}
	
	function isString (val) {
		return typeof val === 'string';	
	}
	
	function isArray (val) {
		return Object.prototype.toString.apply(val) === '[object Array]';
	}
	
	function isNumber (val) {
		return typeof val === 'number';	
	}
	
	function isBoolean (val) {
		return typeof val === 'boolean';
	}
	
	function isDate (val) {
		if ( Object.prototype.toString.call(val) === "[object Date]" ) {
			//date object
			
			if (isNaN(val.getTime())) {
				//not valid
				return false;
			} else {
				//valid
				return true;
			}
		} else {
			//not a date object
			return false;
		}
		
	}
	function isFunction (val) {
		return Object.prototype.toString.apply(val) === '[object Date]';
	}
	
	function size (o) {
		var count = 0, key;
		for (key in o) {
			if (o.hasOwnProperty(key)) {
				count++;
			}
		}
		
		return count;
	}
	
	function isLocalStorageSupported () {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
			
		} catch (e) {
			return false;
		}
	}
	
	//addMethod borrowed from Lesig's 'Secrets of a Javascript Ninja'
	function addMethod(object, name, fn) {
		var old = object[name];  
		object[name] = function(){ 
			if (fn.length === arguments.length) {
				return fn.apply(this, arguments);
			} else if (typeof old === 'function') {
				return old.apply(this, arguments);
			}
		};
	}
	
	function validateRecord(rec,model) {
		var key,
		model_fields,
		valid = true;
		
		model_fields = model.get_fields();
		var x, y;
		x = size(rec);
		y = model.len();
		if (x !== y) {
			return false; 
		}
		
		var i;
		for(i=0;i < model_fields.length;i++) {

			if ( ! rec.hasOwnProperty(model_fields[i].name)) {
				return false;
			} 
				
			if (model_fields[i].type=== 'object' && ! isObject(rec[model_fields[i].name])) {
				return false;
			} else if ( model_fields[i].type === 'string' && ! isString(rec[model_fields[i].name])) {
				return false;
			} else if ( model_fields[i].type === 'array' && ! isArray(rec[model_fields[i].name])) {
				return false;
			} else if ( model_fields[i].type === 'date' && ! isDate(rec[model_fields[i].name])) {
				return false;
			} else if ( model_fields[i].type === 'number' && ! isNumber(rec[model_fields[i].name])) {
				return false;
			} else if ( model_fields[i].type === 'boolean' && ! isBoolean(rec[model_fields[i].name])) {
				return false;
			}
		}
		
		return valid;
	}
	
	function dynamicSort (property,desc) {
		if (desc === "DESC") {
			return function (a,b) {
				return(a[property] > b[property]) ? -1 : (a[property] < b[property]) ? 1 : 0; 
			};
		}
		return function (a,b) {
			return(a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
		};
	}
	
	function dynamicSortMultiple () {
		
		var props = arguments[0];
		
		/*var props = [];
		
		for(var k in obj) {
			if (obj.hasOwnProperty(k)) {
				props.push({ key: k, value:  obj[k] } );
			}
		}*/
		
		return function (obj1,obj2) {
			var result = 0,
				x = 0,
				numberOfProperties = props.length;
				
				while(result === 0 && x < numberOfProperties) {
					if (isObject(props[x]) && props[x].field && props[x].order){
						result = dynamicSort(props[x].field,props[x].order)(obj1,obj2);
					} else {
						result = dynamicSort(props[x])(obj1,obj2);					
					}
					x++;
				}
				return result;
		};
		
	}
	
	//here we load the classes
	classes["Tamale.Base"] = function (config) {
		var that = {};
	
		function name () {
			return Tamale.name;
		}
		
		that.get_name = function () {
			return name();
		};

		that.superior = function (name) {
			var that = this,
				method = that[name];
			return function () {
				return method.apply(that, arguments);
			};
		};
		
		return that;
	};
	
	classes["Tamale.AbstractStore"] = function (config) {

		var _store = [],
            _count = 0;
		
		function _put(k, v) {
			if(! _store[k]) {
				_store[k] = v;
				_count++;
			} else  {
				throw new Error("cannot add value to store if key already exists");
			}
			
		}
		
		function _get(k) {
			return _store[k];
		}
		
		function _remove (k) {
			if ( _store[k]) {
				delete _store[k];
			} else {
				throw new Error("key " + k + " does not exist");
			}
		}
		
		function name () {
			return 'AbstractStore';
		}
		
		function _dump_json () {
			//return JSON.stringify(_store);
			var json_string = "";
			for(var k in _store) {
				if (_store.hasOwnProperty(k)) {
					json_string = json_string +  JSON.stringify(_store[k]);
					//props.push({ key: k, value:  obj[k] } );
				}
			}
			
			return json_string;
		}
		
		function _clear () {
			_store = {};
			
		}
		
		function _sort () {

			//if 0, just call plain ole sort
			if (arguments.length === 0) {
				_store.sort();
			} else {
				_store.sort(dynamicSortMultiple());
			}
			
		}
		
		var parent = classes["Tamale.Base"];
		var that = parent(config),
			super_get_name = that.superior('get_name');
		
		that.get_name = function () {
			return super_get_name() + '.' + name();
		};
		
		that.put = function (key,val) {
			_put(key,val);
		};
		
		that.get = function (key) {
			return _get(key);
		};
		
		that.remove = function (key) {
			_remove(key);
		};
		
		that.dump_json = function () {
			return _dump_json();
		};
		
		that.len = function() {
			return size(_store);
		};
		
		that.clear = function () {
			_clear();
		};
		
		that.sort = function () {
			//if 0, just call plain ole sort
			if (arguments.length === 0) {
				_store.sort();
			} else {
				_store.sort(dynamicSortMultiple(Array.prototype.slice.call(arguments)));
			}
		};
		
		return that;
	};
	
	classes["Tamale.AbstractLocalStore"] = function (config) {
		
		if (! isLocalStorageSupported()) {
			throw new Error("local storage not supported for this browser");
		}
		
		var _store = localStorage;
		
		if (config.storeType === "session") {
			_store = sessionStorage;
		}
		
		var  _count = 0;
		
		function _put(k, v) {
			if(! _store.getItem(k)) {
				_store.setItem(k,JSON.stringify(v));
				_count++;
			} else  {
				throw new Error("cannot add value to store if key already exists");
			}
			
		}
		
		function _get(k) {
			return _store.getItem(JSON.parse(k));
		}
		
		function _remove (k) {
			if ( _store.getItem(k)) {
				_store.removeItem(k);
			} else {
				throw new Error("key " + k + " does not exist");
			}
		}
		
		function name () {
			return 'AbstractLocalStore';
		}
		
		function _dump_json () {
			return JSON.stringify(_store);
		}
		
		function _clear () {
			_store.clear();
			
		}
		
		var parent = classes["Tamale.Base"];
		var that = parent(config),
			super_get_name = that.superior('get_name');
		
		that.get_name = function () {
			return super_get_name() + '.' + name();
		};
		
		that.put = function (key,val) {
			_put(key,val);
		};
		
		that.get = function (key) {
			return _get(key);
		};
		
		that.remove = function (key) {
			_remove(key);
		};
		
		that.dump_json = function () {
			return _dump_json();
		};
		
		that.len = function() {
			return _store.length;
		};
		
		that.clear = function () {
			_clear();
		};
		
		return that;
	};
	
	classes["Tamale.SimpleStore"] = function (config) {

		function name () {
			return 'SimpleStore';
		}
		
		var parent = classes["Tamale.AbstractStore"];
		
		var that = parent(config),
			super_get_name = that.superior('get_name');
		
		that.get_name = function () {
			return Tamale.name + '.' + name();
		};

		return that;
	};

	classes["Tamale.Model"] = function (config) {
		
		function name () {
			return 'Model';
		}
		
		//it's not a model unless it has a 'fields' config property
		if (! config.hasOwnProperty('fields')) {
			throw new Error("invalid config for Model");
		}
		
		var i;
		for(i=0;i < config.fields.length;i++) {
			var obj = config.fields[i];
			if (! /^(boolean|string|number|date|object|array)$/.test(obj["type"])){
				throw new Error("invalid model definition for label " + obj["name"]);
			}
		}
		
		//call to super
		var parent = classes["Tamale.Base"];
		var that = parent(config);
		
		var fields = config.fields;
				
		that.get_name = function () {
			return Tamale.name + '.' + name();
		};
		
		that.get_fields = function() {
			return fields;
		};
		
		that.len = function () {
			return size(fields);
		};
			
		return that;
	};
	
	classes["Tamale.DataStore"] = function (config) {
		
		//call to super
		var parent = classes["Tamale.AbstractStore"];
		
		if (config.hasOwnProperty("storeType") && (config.storeType === "local" || config.storeType === "session")) {
					parent = classes["Tamale.AbstractLocalStore"];
		}
		
		var that = parent(config);
		
		var id = 0,
			_model;
		
		if (config.hasOwnProperty('model') && isObject(config.model)) {
			_model = config.model;
		}
		
		if (config.hasOwnProperty('id') && config.id === true) {
			addMethod(that,'put',function (v) {
				var local_id = id++;

				if (_model && ! validateRecord(v,_model)) {
					throw new Error("invalid record!");
				} else {
					that.put(local_id,v);
				}
				
				return local_id;
				
			});
		} /*else {
			addMethod(that,'put',function (k,v) {
				if (_model && ! validateRecord(v,_model)) {
					throw new Error("invalid record!");
				} else {
					that.put(k,v);
				}
				
				return k;
			});
		}*/
		
		/*addMethod(that,'put', function (v) {
			if (config.hasOwnProperty('id') && config.id === true) {
				var local_id = id++;

				if (_model && ! validateRecord(v,_model)) {
					throw new Error("invalid record!");
				} else {
					console.log(v);
					that.put(local_id,v);
				}
				
				return local_id;
			} else {
				if (_model && ! validateRecord(v,_model)) {
					throw new Error("invalid record!");
				} else {
					that.put(v);
				}
			}
		});*/

		function name () {
			return 'DataStore';
		}
		
		that.get_name = function () {
			return Tamale.name + "." + name();
		};

		return that;
	};
	

	//Static factory that does all the heavy lifting
	Tamale.create = function (object, config) {
		var obj;
		if (isString(object)) {
			obj = classes[object](config);
		} else if (isObject(object)){
			obj = object;
		}	
		return Object.create(obj);
	};
}());

	


