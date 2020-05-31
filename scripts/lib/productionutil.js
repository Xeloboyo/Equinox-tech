
/*author: Xelo*/

const _Util={
	getItem(name){
		return Vars.content.getByName(ContentType.item, name);
	},
	getBasicStats(entity){
		return{
			powerlevel: entity.power.graph.getSatisfaction(),
			totalitems: entity.items.total(),
			totalliquid: entity.liquids.get(entity.liquids.current()),	
			
		}
		
	},
	const_speed_func(entity){
		return 1;
	},
	prod_speed_func(entity){
		return entity.getProgress()<0.99 && entity.isCrafting() ? entity.efficiency()*entity.delta():0;
	}
}



const _customCrafterBody = {
	animationSet:[],
	input:[],
	output:[],
	outputStorage:[],
	warmupSpeed:0.1,
	craftTime:4.0,
	outputChance:4.0,
	waitForOutputEmpty: false,
	
	loadAnimations(){
		for(var i = 0;i<this.animationSet.length;i++){
			var ans = this.animationSet[i];
			if(ans.animation_length>1){
				for(var z = 0;z<ans.animation_length;z++){
					ans.animation_frames.push(Core.atlas.find(this.name+"-"+ans.animation_name+(z+1)));
					
				}
			}else{
				ans.animation_frames.push(Core.atlas.find(this.name+"-"+ans.animation_name));
			}
		}
	},
	
	load(){
		this.super$load();
		this.loadAnimations();
		this.region = Core.atlas.find(this.name);
	},
	
	update(tile){
		var ent = tile.entity;
		this.customUpdate(tile);
		
		if(!ent.isCrafting()&&this.inputSatisfied(ent)){
			this.consumeInput(ent);
			ent.setProgress(0);
		}else if(ent.isCrafting()){
			if(ent.getProgress()<1){
				ent.setProgress(Math.min(1,ent.getProgress()+ this.getProgressIncrease(ent,(60*this.craftTime)  )));
			}else{
				var canOffloadAll = true;
				var itemMap = new Object();
				
				for(var i = 0;i<this.output.length;i++){
					var opp = this.output[i];
					opp.get(itemMap,opp);
				}
				
				//this feels so jank
				for (var key in itemMap) {
				   for(var i = 0;i<this.outputStorage.length;i++){
					  var opp = this.outputStorage[i];
					  if(opp.item.name==key){
						  if(itemMap[key].amount+ent.items.get(opp.item	)>opp.amount){
							  canOffloadAll=false;
							  break;
						  }  
					  }
				   }
				   if(!canOffloadAll){
					   break;
				   }
				}
				
				for (var key in itemMap) {
					if(canOffloadAll){
						ent.items.add(_Util.getItem(key),itemMap[key].amount);
					}
					
				}
				if(canOffloadAll){
					ent.setCrafting(false);
				}
			}
			
		}
		for(var i = 0;i<this.outputStorage.length;i++){
			var opp = this.outputStorage[i];
			while(this.tryDump(tile,opp.item)){}
		}
	},
	draw(tile){
		var ent = tile.entity;
		var deltatime = (Time.time()-ent.getPrevtime());
		for(var i = 0;i<this.animationSet.length;i++){
			if(!this.animationSet[i].manualDrawing){
				this.drawUpdateFrame(this.animationSet[i],tile,ent,deltatime);
			}
		}
		print(this.animationSet.length);
		this.customDraw(tile,deltatime);
		ent.setPrevtime (Time.time());	
	},
	drawUpdateFrame(ans, tile, ent,deltatime){
		ent.setFrameSpeed(ans.animation_name,ans.basespeed * ans.speedfunction(ent));
		ent.incrementFrame(ans.animation_name,  ent.getFrameSpeed(ans.animation_name)*deltatime );
		Draw.rect(this.getFrame(ans.animation_frames,  ent.getFrame(ans.animation_name)),  tile.drawx(), tile.drawy());
	},
	getFrame(seq, frameNo){
		return seq[Math.floor(frameNo) % seq.length];
	},
	
	inputSatisfied(ent){
		for(var i = 0;i<this.input.length;i++){
			var inp = this.input[i];
			if(inp.optional){continue;}
			if(ent.items.get(inp.item)<inp.amount){
				return false;
			}
		}
		return true;
	},
	
	consumeInput(ent){
		for(var i = 0;i<this.input.length;i++){
			var inp = this.input[i];
			if(inp.optional&&ent.items.get(inp.item)<inp.amount){continue;}
			
			if(Mathf.random(1)<inp.consumechance){
				ent.items.remove(inp.item,inp.amount)
			}
			ent.setCrafting(true);
		}
	},
	
	acceptItem(item,tile,source){
		//if(this.waitForOutputEmpty) return false
		
		for(var i = 0;i<this.input.length;i++){
			
			if(this.input[i].item.name==item.name){
				var inp = this.input[i];
				return tile.entity.items.get(item)<inp.storage;
			}
		}
		return false;
		//if(item!==Items.graphite){return false;}
		//return tile.entity.items.get(item)<20 && !tile.entity.getUnloading();
		
	},
	handleItem(item,tile,source){
		tile.entity.items.add(item, 1);
	},
	
	setStats(){
		this.super$setStats();
		this.stats.add(BlockStat.productionTime, this.craftTime, StatUnit.seconds);
		for(var i = 0;i<this.input.length;i++){
			var inp = this.input[i];
			this.stats.add(BlockStat.input, new ItemListValue(new ItemStack(inp.item, inp.amount)));
			if(inp.consumechance<1){
				this.stats.add(BlockStat.output, new StringValue(Math.round(inp.consumechance*100)+"% chance of consuming"));
			}
		}
		var tempout = this.output;
		this.stats.add(BlockStat.output,
			extend(StatValue,{
				display(table){
					for(var i = 0;i<tempout.length;i++){
						var inp = tempout[i];
						inp.display(table);
						if(i!=tempout.length-1){
							table.row();
							table.table(Tex.clear, cons(
								innertable=>{
									innertable.center().add("+");
								}
							)).center().marginBottom(2).marginTop(2);
						}
					}	
					table.row();
				}
			})
		);
		
		
		
		if(this.hasPower){
			this.stats.remove(BlockStat.powerUse);
			this.stats.add(BlockStat.powerUse, this.basepoweruse*60, StatUnit.powerSecond);
		}
		//this.stats.add(BlockStat.input, new ItemListValue(new ItemStack(Items.graphite, 5)));
        //this.stats.add(BlockStat.output, new ItemListValue(new ItemStack(Items.graphene, 1)));
		
	},
	barsToAdd: [],
	
	setBars(){
        this.super$setBars();

		/*var func = new Func(){
			get(entity){ 
				return new Bar("blocks.ammo", Pal.ammo, floatp(() => entity.getAmmo() / maxAmmo)); 
			}
		};
        this.bars.add("Ammo",func);*/
        for(var i = 0;i<this.barsToAdd.length;i++){
			this.bars.add(this.barsToAdd[i].name,this.barsToAdd[i].func);
		}
    },
	
	init(){
		
		for(var i = 0;i<this.input.length;i++){
			if(this.input[i].item==null){
				this.input[i].item = _Util.getItem(this.input[i].itemname);
			}
		}
		for(var i = 0;i<this.output.length;i++){
			this.output[i].init();
		}
		for(var i = 0;i<this.outputStorage.length;i++){
			if(this.outputStorage[i].item==null){
				this.outputStorage[i].item = _Util.getItem(this.outputStorage[i].itemname);
			}
		}
		this.super$init();
	}
	
	
	
	
	
}




module.exports={
	Util:_Util,
	
	extendCustomCrafter(name,def,entitydef){
		const block = Object.create(_customCrafterBody);
		Object.assign(block,def);
		const crafter = extendContent(Block,name,block); 
		crafter.hasItems = true;
		
		
		
		
		crafter.entityType = prov(()=>{
			var animation_f=[];
			var animation_s=[];
			for(var i = 0;i<def.animationSet.length;i++){
				animation_f[def.animationSet[i].animation_name] = 0;
				animation_s[def.animationSet[i].animation_name] = 0;
			}
			var entb = {
				animationframe: animation_f,
					getFrame(anim){return this.animationframe[anim];},
					setFrame(anim, val){this.animationframe[anim]=val;},
					incrementFrame(anim, val){this.animationframe[anim]+=val;},
					incrementFrameBySpeed(anim){this.animationframe[anim]+=this.animationspeed[anim];},
				animationspeed: animation_s,
					getFrameSpeed(anim){return this.animationspeed[anim];},
					setFrameSpeed(anim, val){this.animationspeed[anim]=val;},
				_prevtime:0,
					getPrevtime(){return this._prevtime},
					setPrevtime(sped){this._prevtime=sped},
				_crafting: false,
					isCrafting(){return this._crafting},
					setCrafting(sped){this._crafting=sped},	
				_progress: 0,
					getProgress(){return this._progress},
					setProgress(sped){this._progress=sped},	
				_unloading: false,
					getUnloading(){return this._unloading},
					setUnloading(sped){this._unloading=sped},	
				write(stream){
					this.super$write(stream);
					stream.writeBoolean(this._crafting);
					stream.writeFloat(this._progress);
				},

				read( stream,  revision){
					this.super$read(stream, revision);
					this._crafting = stream.readBoolean();
					this._progress = stream.readFloat();
				},
				customWrite(stream){}	,
				customRead(stream){}	
				
			}
			Object.assign(entb,entitydef);
			
			return extend(TileEntity,entb);
			
			
		});
		if(crafter.customUpdate===undefined){
			crafter.customUpdate = function(tile){}
		}
		if(crafter.customDraw===undefined){
			crafter.customDraw = function(tile){}
		}
		return crafter;
		
	},
	//animated
	getAnimationSet(subname, length, _basespeed, speedfunc, manualDraw){
		if(_basespeed===undefined){_basespeed=1;}
		if(manualDraw===undefined){manualDraw=false;}
		if(speedfunc===undefined){speedfunc=function(entity){
			return 1;
		}}
		return {
			animation_name: subname,
			animation_length: length,
			animation_frames:[],
			basespeed: _basespeed,
			speedfunction: speedfunc,
			manualDrawing: manualDraw
		};
	},
	// non animated
	getSprite(subname){
		return this.getAnimationSet(subname,1,0);
	},
	
	getInput(item, amount, storage, optional, consumechance){
		if(amount===undefined){amount=1;}
		if(storage===undefined){storage=0;}
		if(consumechance===undefined){consumechance=1;}
		if(optional===undefined){optional=false;}
		
		
		var rawinput = new Object();
		rawinput.item = ((typeof item === 'string' || item instanceof String)? _Util.getItem(item): item);
		rawinput.itemname = (typeof item === 'string' || item instanceof String)?item: rawinput.item.name;

		rawinput.amount = Math.max(1,Math.round(amount));
		rawinput.storage = Math.max(storage,rawinput.amount);
		rawinput.optional=optional;
		rawinput.consumechance=consumechance;

		return rawinput;
	},
	
	getDirectOutput(item, amount, outputchance){
		if(amount===undefined){amount=1;}
		if(outputchance===undefined){outputchance=1;}
		
		var rawoutput = new Object();
		rawoutput.item = (typeof item === 'string' || item instanceof String)? _Util.getItem(item): item;
		rawoutput.itemname = (typeof item === 'string' || item instanceof String)?item: rawoutput.item.name;
		rawoutput.amount = Math.max(1,Math.round(amount));
		rawoutput.outputchance=outputchance;
		rawoutput.get = function(bobject){
			
			if(bobject[this.item.name]==undefined){
				bobject[this.item.name]={
					amount: 0,
				};
			}
			bobject[this.item.name].amount+=Mathf.random(1)<this.outputchance?this.amount:0;
		}
		rawoutput.display = function(table){
			table.row();
			table.add(new ItemDisplay(this.item, this.amount, true)).left().padRight(3);
			if(this.outputchance<1){
				table.add(Core.bundle.format("block.loot_table_Chance",Math.round(this.outputchance*100)+"%")).left().padLeft(5).padTop(2).left();
			}
		}
		rawoutput.init = function(){
			if(this.item==null){
				this.item = _Util.getItem(this.itemname);
			}
		}
		
		return rawoutput;
	},
	getLootTable(items){
		for(var i = 0;i<items.length;i++){
			if(items[i].weight===undefined||items[i].weight<0){
				print("(Xelo's utils)WARNING: loottable weight cannot be negative of undefined, using default: 1");
				items[i].weight=1;
			}
			if(items[i].outputNode===undefined){
				print("(Xelo's utils)WARNING: loot table entry cannot be undefined, removing...");
				items.splice(i,1);
				i--;
			}
		}
		if(items.length==0){
			print("(Xelo's utils)ERROR: output loot table is empty.");
			
		}
		
		var rawoutput = new Object();
		rawoutput.get = function(bobject){
			var total=0;
			for(var i = 0;i<items.length;i++){
				total += items[i].weight;
			}
			var rand = Mathf.random(total);
			for(var i = 0;i<items.length;i++){
				if(rand<items[i].weight){
					items[i].outputNode.get(bobject);
					break;
				}
				rand-=items[i].weight;
			}
		}
		rawoutput.display = function(table){
			var total=0;
			for(var i = 0;i<items.length;i++){
				total += items[i].weight;
			}
			table.row();
			for(var i = 0;i<items.length;i++){
				if(i!=0){
					table.row();
				}
				var itc= items[i];
				
				table.add(Core.bundle.format("block.loot_table_Chance", Math.round(100*itc.weight/total) + "%")).top().left();
				
				table.table(Tex.underline, cons(
					innertable=>{
						innertable.left().defaults().marginTop(3).left();
						itc.outputNode.display(innertable);
					}
				)).left().padTop(9);
			}
			
			
		}
		
		rawoutput.init = function(){
			for(var i = 0;i<items.length;i++){
				 items[i].outputNode.init();
			}
		}
		
		return rawoutput;
	},
	
	getOutputStorage(item, amount){
		if(amount===undefined){amount=1;}
		var rawoutput = new Object();
		rawoutput.item = (typeof item === 'string' || item instanceof String)? _Util.getItem(item): item;
		rawoutput.itemname = (typeof item === 'string' || item instanceof String)?item: rawoutput.item.name;
		rawoutput.amount = Math.max(1,Math.round(amount));
		
		return rawoutput;
	},
	
	getBar(name,valuefunc,pal){
		if(pal===undefined){pal=Pal.ammo;}
		var bar = new Object();
		bar.name=name;
		bar.func = new Func(){
			get(entity){ 
				return new Bar(name, pal, floatp(() => valuefunc(entity))); 
			}
		}
		return bar;
	},
	
	setCustomPowerCond(block, powerfunc, basepoweruse){
		if(basepoweruse===undefined){basepoweruse=69;}
		if(!(powerfunc instanceof Func)){
			// i dont think youll put nothing for the function pertaining to the amount of power it should consume but if you did
			powerfunc= new Func(){
				get(entity){
					return 69.0; //4140 power consumption
				}
			}
		}
		block.consumes.add( 
			extend(ConsumePower, {
				consumePorp: powerfunc,
				requestedPower(entity){
					return this.consumePorp.get(entity);
				}
			})
		).update(true);
		block.hasPower =true;
		block.basepoweruse=basepoweruse;
		block.consumesPower =true;
		
	},
	
	
}