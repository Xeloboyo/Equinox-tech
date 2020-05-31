const mod_utils=require("lib/productionutil");


var entdata = {
	
}

var bodydata = {
	
	animationSet:[ //in order of display
		mod_utils.getSprite("base"), //isnt animated
		mod_utils.getAnimationSet("rotator",20,0.2, mod_utils.Util. prod_speed_func),  // name , frameCount, basespeed, speed function
		mod_utils.getAnimationSet("armature",20,0.2, mod_utils.Util. prod_speed_func)
	],
	input:[
		mod_utils.getInput("graphite",5,15),// needs 5, stores 15
	],
	output:[
		mod_utils.getDirectOutput("equinox-tech-graphene"),// outputs 1
		mod_utils.getDirectOutput("copper", 2, 0.5), 		//outputs 2, 50% chance
		mod_utils.getLootTable([
			{	
				weight: 2,
				outputNode: mod_utils.getDirectOutput("lead", 2, 0.5), 
			},
			{	
				weight: 4,
				outputNode: mod_utils.getLootTable([
					{	
						weight: 3,
						outputNode: mod_utils.getDirectOutput("thorium", 1), 
					},
					{	
						weight: 2,
						outputNode: mod_utils.getDirectOutput("titanium", 3, 0.5), 
					}
				]),
			}
		]), 		
	],
	outputStorage:[
		mod_utils.getOutputStorage("equinox-tech-graphene",10), // stores  10
		mod_utils.getOutputStorage("copper",10),
		mod_utils.getOutputStorage("lead",10),
		mod_utils.getOutputStorage("titanium",10),
		mod_utils.getOutputStorage("thorium",10),
	],
	barsToAdd:[
		mod_utils.getBar("block.progress",function(entity){return entity.getProgress()}), //show the progress of crafting in a bar
	]
}

const graphdep = mod_utils.extendCustomCrafter("graphene-depositor",bodydata,entdata);

mod_utils.setCustomPowerCond(
	graphdep,  
	new Func(){
		get(entity){
			return entity.getProgress()<0.99 && entity.isCrafting() ? 5:0.1;  //uses 5 (or 300/s) energy when crafting and 0.1 (6/s) energy when idling
		}
	},
	5 // energy consump to display
	);



