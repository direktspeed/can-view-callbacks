var stealTools = require("steal-tools");

stealTools.export({
	system: {
		config: __dirname + "/package.json!npm"
	},
	outputs: {
		"+amd": {},
		"+standalone": {
			exports: {
				"can-namespace": "can"
			}
		}
	}
}).catch(function(e){
	
	setTimeout(function(){
		throw e;
	},1);
	
});
