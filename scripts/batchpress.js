
const basecraftspeed= 0.2;
const batchpress = extendContent(Block, "batch-press", {
	//acceptItem(source,item){
    //    return heat > 0.5f;
    //},
	
	update(tile){
		
		var ent = tile.entity;
		if(ent.getSpeed()===undefined){
			ent.setSpeed(0);
		}
		if(ent.power.graph.getSatisfaction() > 0.2){
			ent.setSpeed(Mathf.lerpDelta(ent.getSpeed(), 1, 0.01));
		}else{
			ent.setSpeed(Mathf.lerpDelta(ent.getSpeed(), 0, 0.05));
		}	
		
		if(ent.getUnloading()){
			while(this.tryDump(tile,Items.graphite)){}
			
			if(tile.entity.items.get(Items.graphite)===0){
				ent.setUnloading(false);
				ent.setProgress(0);
			}
		}else{
			if(ent.items.get(Items.coal)===9){
				ent.setProgress(ent.getProgress()+ent.getSpeed()*0.1*basecraftspeed);
				if(ent.getProgress()>1){
					ent.items.clear();
					ent.items.add(Items.graphite,9);
					ent.setUnloading(true);
					
					for(var i =0;i<10;i++){
						Effects.effect(Fx.fuelburn,(tile.x-1.4)* Vars.tilesize, Vars.tilesize*(tile.y + Mathf.random(-1.4,1.4)));
						
					}
					
				}
			}
			
		}
		
		///this.offloadNear(tile,Items.scrap);
		
	},
	draw(tile){
		var ent = tile.entity;

		ent.setFrame((Time.time()-ent.getPrevtime())*ent.getSpeed()*((!ent.getUnloading() && ent.items.get(Items.coal)===9)?-1:1) + ent.getFrame());
		ent.setFrame(Mathf.clamp(ent.getFrame(),0,this.animationframes.length-0.4));
		Draw.rect(this.baseimage, tile.drawx(), tile.drawy());
		
		//draw items here i think
		var itemcontains = ent.getUnloading()? Items.graphite : Items.coal;
		var itemAmount = tile.entity.items.get(itemcontains);
		
		var sizeitem = this.itemSize===undefined?Vars.tilesize*0.5:Vars.itemSize;
		
		var count = 0;
		for(var i=1;i<=3;i+=1){
			for(var j=1;j<=3;j+=1){
				count++;
				if(itemAmount>=count){
					Draw.rect(itemcontains.icon(Cicon.medium), (tile.x+ i-1.5)* Vars.tilesize, (tile.y+ j-1.5)* Vars.tilesize, sizeitem,sizeitem);
				}
			
			}
			
		}
		
		Draw.rect(this.animationframes[Math.floor(ent.getFrame())], tile.drawx(), tile.drawy());
		
		ent.setPrevtime (Time.time());
	},
	load(){
		this.super$load();
		this.animationframes = [];
		this.baseimage = Core.atlas.find(this.name+"-base");
		for(var i=1;i<=15;i++){
			this.animationframes.push(Core.atlas.find(this.name+"-lid-"+i));
		}
		
	},
	acceptItem(item,tile,source){
		if(item!==Items.coal){return false;}
		return tile.entity.items.get(item)<9 && !tile.entity.getUnloading();
		
	},
	handleItem(item,tile,source){
		tile.entity.items.add(item, 1);
	},
	
});

batchpress.entityType=prov(()=>extend(TileEntity,{
	_unloading: false,
		getUnloading(){return this._unloading},
		setUnloading(sped){this._unloading=sped},
	_frame: 0,
		getFrame(){return this._frame},
		setFrame(sped){this._frame=sped},
	_progress: 0,
		getProgress(){return this._progress},
		setProgress(sped){this._progress=sped},
	_speed: 0,
		getSpeed(){return this._speed},
		setSpeed(sped){this._speed=sped},
	_prevtime:0,
		getPrevtime(){return this._prevtime},
		setPrevtime(sped){this._prevtime=sped}
	
}));


